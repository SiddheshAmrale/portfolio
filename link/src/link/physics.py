"""Pinned physics-inspired models. Not silicon validation."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any


SOFTWARE = "linklab 0.1.0"


@dataclass(frozen=True)
class LaneSample:
    lane: int
    t_ms: int
    snr_db: float
    ber: float
    eye_open_ui: float
    fec_uncorrectable: float
    flaps: int
    domain: str  # electrical | optical
    impairment: str
    jitter_ui: float = 0.05


def ber_from_snr_db(snr_db: float, pam4: bool = True) -> float:
    """Approximate Q-function style BER vs SNR. Teaching curve, not a PAM4 standard."""
    # Convert rough SNR to sigma; clamp for numerics.
    x = max(snr_db, 0.0)
    # Higher SNR → lower BER. PAM4 is harsher than NRZ in this toy model.
    scale = 1.35 if pam4 else 1.0
    z = (x / scale - 6.0) / 2.2
    # erfc-like tail
    ber = 0.5 * math.erfc(z / math.sqrt(2.0))
    return float(min(max(ber, 1e-15), 0.5))


def eye_from_snr(snr_db: float) -> float:
    """Eye opening proxy in UI units (0..1)."""
    return float(min(max((snr_db - 8.0) / 20.0, 0.0), 1.0))


def fec_residual(ber: float, coding_gain_db: float = 6.0) -> float:
    """Toy RS/FEC residual uncorrectable rate after coding gain."""
    # Map coding gain to effective BER reduction (very rough).
    factor = 10 ** (-coding_gain_db / 5.0)
    return float(min(ber * factor, 0.5))


def software_loss_is_not_ber(packet_loss_pct: float) -> dict[str, Any]:
    return {
        "claim": "software_packet_loss_equals_optical_ber",
        "valid": False,
        "packet_loss_pct": packet_loss_pct,
        "reason": (
            "tc netem / TCP retransmits are L3/L4 software impairments. "
            "Optical/electrical BER is a physical-layer symbol error process "
            "before (and after) FEC. Credo PILOT eye/SNR/lane BER telemetry "
            "must not be collapsed into rx_drop."
        ),
    }


def simulate_lane(
    lane: int,
    n: int = 24,
    base_snr_db: float = 24.0,
    impairment: str = "healthy",
    domain: str = "electrical",
    seed: int = 7,
) -> list[LaneSample]:
    # Deterministic LCG
    state = (seed * 1103515245 + lane * 12345) & 0x7FFFFFFF
    rows: list[LaneSample] = []
    flaps = 0
    for i in range(n):
        state = (1103515245 * state + 12345) & 0x7FFFFFFF
        noise = ((state % 1000) / 1000.0 - 0.5) * 0.6
        snr = base_snr_db + noise
        if impairment == "snr_fade" and i >= 8:
            snr -= 7.0 + 0.15 * (i - 8)
        elif impairment == "burst_errors" and i in (10, 11, 12):
            snr -= 12.0
        elif impairment == "flap" and i in (9, 14, 18):
            flaps += 1
            snr = 3.0
        elif impairment == "optical_oma_drop" and domain == "optical" and i >= 8:
            snr -= 9.0  # stand-in for OMA / TDECQ degradation
        elif impairment == "jitter_dominated" and i >= 8:
            snr -= 1.5  # mild SNR change; jitter is the story
        elif impairment == "healthy":
            pass
        ber = ber_from_snr_db(snr, pam4=True)
        eye = eye_from_snr(snr)
        fec_u = fec_residual(ber, coding_gain_db=6.5 if domain == "optical" else 5.5)
        jitter = float(min(max(0.35 - eye * 0.28 + abs(noise) * 0.02, 0.02), 0.45))
        if impairment == "jitter_dominated" and i >= 8:
            jitter = float(min(0.18 + 0.025 * (i - 8) + abs(noise) * 0.01, 0.48))
            eye = float(max(0.42 - 0.04 * (i - 8) - abs(noise) * 0.02, 0.08))
            ber = ber_from_snr_db(snr - 4.0, pam4=True)
            fec_u = fec_residual(ber, coding_gain_db=5.5)
        rows.append(LaneSample(
            lane=lane, t_ms=1_700_000 + i * 1000, snr_db=snr, ber=ber,
            eye_open_ui=eye, fec_uncorrectable=fec_u, flaps=flaps,
            domain=domain, impairment=impairment, jitter_ui=jitter,
        ))
    return rows


def link_health_score(rows: list[LaneSample]) -> dict[str, Any]:
    """Composite 0–100 teaching score (Credo PILOT Link Health Score theme). Not silicon FOM."""
    if not rows:
        return {"score": 0.0, "band": "unknown", "components": {}}
    tail = rows[-6:]
    mean_snr = sum(r.snr_db for r in tail) / len(tail)
    mean_ber = sum(r.ber for r in tail) / len(tail)
    mean_eye = sum(r.eye_open_ui for r in tail) / len(tail)
    mean_jitter = sum(r.jitter_ui for r in tail) / len(tail)
    flaps = max(r.flaps for r in rows)
    # Component scores in [0, 1]
    snr_c = min(max((mean_snr - 8.0) / 16.0, 0.0), 1.0)
    # BER 1e-15 → ~1, BER 1e-3 → low
    ber_c = min(max((-math.log10(max(mean_ber, 1e-15)) - 3.0) / 12.0, 0.0), 1.0)
    eye_c = min(max(mean_eye / 0.7, 0.0), 1.0)
    jit_c = min(max(1.0 - (mean_jitter - 0.05) / 0.35, 0.0), 1.0)
    flap_c = 0.0 if flaps >= 2 else (0.5 if flaps == 1 else 1.0)
    score = 100.0 * (0.28 * snr_c + 0.28 * ber_c + 0.22 * eye_c + 0.14 * jit_c + 0.08 * flap_c)
    band = "green" if score >= 75 else ("amber" if score >= 50 else "red")
    return {
        "score": round(score, 1),
        "band": band,
        "components": {
            "snr": round(snr_c, 3),
            "ber": round(ber_c, 3),
            "eye": round(eye_c, 3),
            "jitter": round(jit_c, 3),
            "flap": round(flap_c, 3),
        },
        "notes": (
            "Composite Link Health Score teaching model inspired by PILOT-style "
            "cluster observability. Weights are didactic, not Credo product formulas."
        ),
    }


def diagnose_lane(rows: list[LaneSample]) -> dict[str, Any]:
    if not rows:
        return {"label": "insufficient_evidence", "notes": "no samples"}
    tail = rows[-6:]
    mean_snr = sum(r.snr_db for r in tail) / len(tail)
    mean_ber = sum(r.ber for r in tail) / len(tail)
    mean_eye = sum(r.eye_open_ui for r in tail) / len(tail)
    mean_jitter = sum(r.jitter_ui for r in tail) / len(tail)
    flaps = max(r.flaps for r in rows)
    head_snr = sum(r.snr_db for r in rows[:6]) / 6.0
    head_jitter = sum(r.jitter_ui for r in rows[:6]) / 6.0

    evidence = {
        "snr_drop": mean_snr < head_snr - 3.0,
        "ber_hot": mean_ber > 1e-5,
        "eye_closing": mean_eye < 0.35,
        "flapping": flaps >= 2,
        "jitter_rise": mean_jitter > head_jitter + 0.06 and mean_jitter > 0.18,
    }
    # Flaps first: short deep fades are classified as flaps, not steady SI.
    if evidence["flapping"]:
        label = "link_flap"
        notes = "Repeated lane flaps. Distinct from a sustained SNR fade."
    elif evidence["jitter_rise"] and evidence["eye_closing"] and not evidence["snr_drop"]:
        label = "jitter_limited"
        notes = "Jitter rise closes the eye with only mild SNR change. Domain=" + rows[-1].domain + "."
    elif evidence["snr_drop"] and evidence["ber_hot"]:
        label = "signal_integrity_degrade"
        notes = "SNR fade with elevated BER. Domain=" + rows[-1].domain + "."
    elif evidence["eye_closing"] and evidence["ber_hot"]:
        label = "eye_closure"
        notes = "Eye opening collapsed with BER rise."
    elif mean_snr >= 18 and mean_ber <= 1e-5:
        label = "healthy"
        notes = "Lane SNR/BER within teaching thresholds."
    else:
        label = "insufficient_evidence"
        notes = "Degraded but rules do not separate flap vs SI."
    health = link_health_score(rows)
    return {
        "label": label,
        "notes": notes,
        "evidence": evidence,
        "mean_snr_db": mean_snr,
        "mean_ber": mean_ber,
        "mean_eye_ui": mean_eye,
        "mean_jitter_ui": mean_jitter,
        "flaps": flaps,
        "domain": rows[-1].domain,
        "link_health": health,
        "impairment_truth": rows[-1].impairment,  # evaluation only
    }


def coding_gain_demo(pre_fec_ber: float = 1e-4) -> dict[str, Any]:
    post = fec_residual(pre_fec_ber, coding_gain_db=7.0)
    curve = []
    for snr in (10, 12, 14, 16, 18, 20, 22, 24):
        pre = ber_from_snr_db(float(snr))
        curve.append({
            "snr_db": snr,
            "pre_fec_ber": pre,
            "post_fec_ber": fec_residual(pre, coding_gain_db=7.0),
        })
    return {
        "pre_fec_ber": pre_fec_ber,
        "post_fec_ber": post,
        "approx_gain_db": 7.0,
        "curve": curve,
        "notes": "FEC reduces residual errors; it does not turn optical BER into TCP retransmits.",
    }
