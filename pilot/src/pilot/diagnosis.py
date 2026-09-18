"""Evidence rules. The injector's condition label is never an input."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional, Sequence

from .quality import mean, rates_for_series
from .schema import Observation

# Frozen after calibration on the calibration split. Do not tune on held-out.
LATENCY_BAD_MS = 50.0
CPU_HOT = 80.0
RETRANS_RATE_HOT = 2.0  # segs/s
LAG_STALE_MS = 1500.0
THROTTLE_HOT_US_S = 5000.0
SKIP_IFACE = {"lo", "app", "proc", "host", "collector", "cgroup"}


@dataclass
class Evidence:
    name: str
    present: bool
    detail: str


@dataclass
class Diagnosis:
    label: str
    evidence: list[Evidence] = field(default_factory=list)
    missing_evidence: list[str] = field(default_factory=list)
    notes: str = ""


def _series(rows: Sequence[Observation], metric: str, interface: Optional[str] = None) -> list[Observation]:
    out = []
    for r in rows:
        if r.metric != metric:
            continue
        if interface is not None and r.interface != interface:
            continue
        out.append(r)
    out.sort(key=lambda r: r.observation_time_ms)
    return out


def _gauge_tail(rows: Sequence[Observation], metric: str, last_n: int = 8) -> list[float]:
    vals = [r.value for r in _series(rows, metric) if r.collection_status == "ok" and r.value is not None]
    return vals[-last_n:]


def _gauge_head(rows: Sequence[Observation], metric: str, first_n: int = 6) -> list[float]:
    vals = [r.value for r in _series(rows, metric) if r.collection_status == "ok" and r.value is not None]
    return vals[:first_n]


def _data_ifaces(rows: Sequence[Observation]) -> list[str]:
    found: list[str] = []
    for r in rows:
        if r.metric == "rx_bytes" and r.interface not in SKIP_IFACE and r.interface not in found:
            found.append(r.interface)
    return found


def diagnose(rows: Sequence[Observation]) -> Diagnosis:
    lat_tail = _gauge_tail(rows, "app_latency_ms")
    lat_head = _gauge_head(rows, "app_latency_ms")
    cpu = _gauge_tail(rows, "proc_cpu_percent")
    lag = _gauge_tail(rows, "collector_lag_ms")
    retrans = rates_for_series(rows, "TcpRetransSegs", "host")
    throttle = rates_for_series(rows, "cgroup_cpu_throttled_usec", "cgroup")
    ifaces = _data_ifaces(rows)
    iface = ifaces[0] if ifaces else "eth0"
    rates_for_series(rows, "rx_bytes", iface)  # keep iface rates computed for completeness

    lat_m = mean(lat_tail)
    lat_h = mean(lat_head)
    cpu_m = mean(cpu)
    lag_m = mean(lag)
    retrans_m = mean([p.pilot_per_s for p in retrans[-8:]])
    throttle_m = mean([p.pilot_per_s for p in throttle[-8:]])
    rx_missing = any(
        r.metric == "rx_bytes" and r.collection_status == "missing" and r.interface in set(ifaces or ["eth0"])
        for r in rows
    )
    retrans_uncertain = any(p.classification in ("ambiguous", "reorder", "missing") for p in retrans[-8:])

    if lat_m is None:
        app_bad = False
    elif lat_h is None:
        app_bad = lat_m >= LATENCY_BAD_MS
    else:
        app_bad = lat_m >= LATENCY_BAD_MS and lat_m >= lat_h * 1.5

    cpu_hot = cpu_m is not None and cpu_m >= CPU_HOT
    cpu_throttled = throttle_m is not None and throttle_m >= THROTTLE_HOT_US_S
    cpu_constrained = cpu_hot or cpu_throttled
    net_loss = retrans_m is not None and retrans_m >= RETRANS_RATE_HOT
    stale = (lag_m is not None and lag_m >= LAG_STALE_MS) or rx_missing
    delay_like = app_bad and not cpu_constrained and not net_loss and not stale

    ev = [
        Evidence("app_latency_high", bool(app_bad), "tail app_latency_ms=" + ("none" if lat_m is None else f"{lat_m:.1f}") + " head=" + ("none" if lat_h is None else f"{lat_h:.1f}")),
        Evidence("receiver_cpu_hot", bool(cpu_hot), "mean proc_cpu_percent=" + ("none" if cpu_m is None else f"{cpu_m:.1f}")),
        Evidence("receiver_cpu_throttled", bool(cpu_throttled), "cgroup throttled_usec/s=" + ("none" if throttle_m is None else f"{throttle_m:.0f}")),
        Evidence("retrans_rate_up", bool(net_loss), "pilot TcpRetransSegs/s=" + ("none" if retrans_m is None else f"{retrans_m:.2f}")),
        Evidence("telemetry_stale_or_missing", bool(stale), "collector_lag_ms=" + ("none" if lag_m is None else f"{lag_m:.0f}") + "; rx missing=" + str(rx_missing)),
        Evidence("network_rates_uncertain", bool(retrans_uncertain), "recent retrans classifications include ambiguous/reorder/missing"),
    ]

    if not app_bad:
        return Diagnosis("healthy", ev, notes="Application latency stays below the frozen threshold relative to the run head.")

    if stale or (rx_missing and app_bad):
        return Diagnosis(
            "insufficient_evidence",
            ev,
            missing_evidence=["fresh network counters", "complete TcpRetransSegs"],
            notes="Application is degraded but network observations are stale or missing. No network-vs-host call.",
        )

    if cpu_constrained and net_loss:
        return Diagnosis(
            "insufficient_evidence",
            ev,
            missing_evidence=["separation of host vs network"],
            notes="CPU restriction and retransmission increase are both present. Ambiguous under the frozen rules.",
        )

    if cpu_constrained and not net_loss:
        return Diagnosis("receiver_cpu", ev, notes="Latency rose with receiver CPU heat or cgroup throttle and without a retransmission increase.")

    if net_loss:
        return Diagnosis("network_loss", ev, notes="Latency rose with a TcpRetransSegs rate increase. Software loss, not optical BER.")

    if delay_like:
        return Diagnosis("network_delay", ev, notes="Latency rose without CPU constraint or retransmission increase.")

    return Diagnosis("insufficient_evidence", ev, missing_evidence=["discriminating network or host signal"], notes="Degraded, but the frozen rules do not pick a cause.")


def naive_network_blame(rows: Sequence[Observation]) -> str:
    """Operator heuristic: if the app is slow, blame the network. Not used by diagnose()."""
    lat = mean(_gauge_tail(rows, "app_latency_ms"))
    if lat is None or lat < LATENCY_BAD_MS:
        return "healthy"
    return "network"


def time_to_detect(rows: Sequence[Observation]) -> Optional[int]:
    """First scrape_seq (after warmup) where the frozen rules leave 'healthy'."""
    by_seq: dict[int, list[Observation]] = {}
    for r in rows:
        by_seq.setdefault(r.scrape_seq, []).append(r)
    acc: list[Observation] = []
    for seq in sorted(by_seq):
        acc.extend(by_seq[seq])
        if seq < 6:
            continue
        if diagnose(acc).label != "healthy":
            return seq
    return None


def predicted_action(label: str) -> str:
    if label == "receiver_cpu":
        return "restore_cpu"
    if label == "network_loss":
        return "remove_loss"
    if label == "network_delay":
        return "remove_delay"
    return "none"


def action_helped(before: Sequence[Observation], after: Sequence[Observation]) -> Optional[bool]:
    b = mean(_gauge_tail(before, "app_latency_ms"))
    a = mean(_gauge_tail(after, "app_latency_ms"))
    if b is None or a is None:
        return None
    return a < b * 0.6
