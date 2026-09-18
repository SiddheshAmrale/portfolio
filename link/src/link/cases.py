"""Build website cases for link integrity."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .physics import (
    SOFTWARE,
    coding_gain_demo,
    diagnose_lane,
    simulate_lane,
    software_loss_is_not_ber,
)


def _pack(rows, title: str, question: str) -> dict[str, Any]:
    d = diagnose_lane(rows)
    truth = d.pop("impairment_truth")
    return {
        "id": truth + "_" + rows[0].domain,
        "title": title,
        "question": question,
        "software": SOFTWARE,
        "domain": rows[0].domain,
        "ground_truth": truth,
        "diagnosis": d,
        "disclaimer": "Teaching model with pinned seed. Not BERT/DCA/PIC silicon data.",
        "samples": [
            {
                "lane": r.lane, "t_ms": r.t_ms, "snr_db": r.snr_db, "ber": r.ber,
                "eye_open_ui": r.eye_open_ui, "fec_uncorrectable": r.fec_uncorrectable,
                "flaps": r.flaps, "domain": r.domain, "jitter_ui": r.jitter_ui,
            }
            for r in rows
        ],
        "snr": [{"t": r.t_ms, "v": r.snr_db} for r in rows],
        "ber": [{"t": r.t_ms, "v": r.ber} for r in rows],
        "eye": [{"t": r.t_ms, "v": r.eye_open_ui} for r in rows],
        "jitter": [{"t": r.t_ms, "v": r.jitter_ui} for r in rows],
    }


def all_cases() -> list[dict[str, Any]]:
    cases = [
        _pack(simulate_lane(0, impairment="healthy", domain="electrical"),
              "Healthy electrical lane", "Baseline PAM4-ish SNR/BER stays quiet."),
        _pack(simulate_lane(1, impairment="snr_fade", domain="electrical"),
              "Electrical SNR fade", "Slow SNR drop should raise BER and close the eye."),
        _pack(simulate_lane(2, impairment="burst_errors", domain="electrical"),
              "Burst errors", "Short deep fades produce bursty BER."),
        _pack(simulate_lane(3, impairment="flap", domain="electrical"),
              "Link flaps", "Flaps are not the same as steady SI degradation."),
        _pack(simulate_lane(4, impairment="optical_oma_drop", domain="optical"),
              "Optical OMA/TDECQ-style fade", "Optical-domain impairment with FEC residual."),
        _pack(simulate_lane(5, impairment="healthy", domain="optical"),
              "Healthy optical lane", "Optical healthy baseline."),
    ]
    cases.append({
        "id": "not_netem",
        "title": "Software loss ≠ optical BER",
        "question": "Why must PILOT-style lane BER stay distinct from rx_drop / TcpRetransSegs?",
        "software": SOFTWARE,
        "domain": "meta",
        "ground_truth": "category_error",
        "diagnosis": software_loss_is_not_ber(15.0),
        "disclaimer": "This case exists to prevent the most common portfolio/interview mistake.",
        "samples": [],
        "snr": [],
        "ber": [],
        "eye": [],
        "fec_demo": coding_gain_demo(),
    })
    return cases


def build(out_dir: str | Path) -> Path:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    cases = all_cases()
    # Blind accuracy on teaching set (truth not passed into diagnose except via samples)
    scored = []
    for c in cases:
        if c["id"] == "not_netem":
            continue
        rows = simulate_lane(
            int(c["samples"][0]["lane"]) if c["samples"] else 0,
            impairment=c["ground_truth"],
            domain=c["domain"],
        )
        pred = diagnose_lane(rows)["label"]
        # Map truth to expected label family
        expect = {
            "healthy": "healthy",
            "snr_fade": "signal_integrity_degrade",
            "burst_errors": "signal_integrity_degrade",
            "flap": "link_flap",
            "optical_oma_drop": "signal_integrity_degrade",
        }.get(c["ground_truth"], "insufficient_evidence")
        scored.append({"id": c["id"], "truth": expect, "predicted": pred, "ok": pred == expect})
    index = {
        "software": SOFTWARE,
        "cases": [{"id": c["id"], "title": c["title"], "domain": c.get("domain")} for c in cases],
        "eval": {
            "n": len(scored),
            "accuracy": (sum(1 for s in scored if s["ok"]) / len(scored)) if scored else 0.0,
            "rows": scored,
        },
        "keywords": [
            "SerDes", "PAM4", "BER", "FEC", "eye quality", "SNR", "lane",
            "silicon photonics", "TDECQ", "OMA", "PILOT", "retimer", "AEC",
        ],
        "disclaimer": "Teaching models. Not post-silicon validation.",
        "reproduce": "pip install -e ./link && python -m pytest -q && python -m link build-cases",
    }
    (out / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")
    (out / "cases.json").write_text(json.dumps(cases, indent=2), encoding="utf-8")
    return out
