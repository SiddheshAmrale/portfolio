"""Compare two pinned analysis versions under matched workloads.

A large number of samples in one run does not replace repeated independent runs.
"""

from __future__ import annotations

from dataclasses import dataclass
from statistics import median
from typing import Callable, Sequence

from .quality import rates_for_series
from .replay import deliver_twice, delay_delivery
from .schema import Observation
from .traces import healthy_trace


@dataclass
class GroupResult:
    name: str
    n: int
    values: list[float]
    median: float
    mean: float


@dataclass
class Comparison:
    primary_metric: str
    meaningful_delta: float
    a: GroupResult
    b: GroupResult
    aa_false_alarm: bool
    decision: str
    effect: float
    detail: str


def _latency(rows: Sequence[Observation]) -> float:
    vals = [r.value for r in rows if r.metric == "app_latency_ms" and r.value is not None]
    if not vals:
        return 0.0
    return float(sum(vals) / len(vals))


def _rx_peak_naive(rows: Sequence[Observation]) -> float:
    pts = rates_for_series(rows, "rx_bytes", "eth0")
    xs = [abs(p.naive_per_s) for p in pts if p.naive_per_s is not None]
    return max(xs) if xs else 0.0


def _rx_peak_pilot(rows: Sequence[Observation]) -> float:
    pts = rates_for_series(rows, "rx_bytes", "eth0")
    xs = [abs(p.pilot_per_s) for p in pts if p.pilot_per_s is not None]
    return max(xs) if xs else 0.0


def analyze_collector_change(n_runs: int = 8) -> Comparison:
    """Collector A: naive peak |rx_bytes/s| after restart+delay+dupes. B: pilot peak on the same traces."""
    from .replay import restart_collector

    a_vals: list[float] = []
    b_vals: list[float] = []
    for i in range(n_runs):
        raw = healthy_trace("reg-" + str(i), n=20, seed="reg-" + str(i))
        dirty = delay_delivery(deliver_twice(restart_collector(raw, 10), every_n=4), delay_ms=2500)
        a_vals.append(_rx_peak_naive(dirty))
        b_vals.append(_rx_peak_pilot(dirty))
    return _compare("peak_abs_rx_bytes_per_s", 1_000.0, "naive_rate", a_vals, "pilot_rate", b_vals)


def analyze_aa(n_runs: int = 8) -> Comparison:
    a_vals: list[float] = []
    b_vals: list[float] = []
    for i in range(n_runs):
        raw = healthy_trace("aa-a-" + str(i), n=20, seed="aa-" + str(i))
        raw2 = healthy_trace("aa-b-" + str(i), n=20, seed="aa-" + str(i))
        a_vals.append(_latency(raw))
        b_vals.append(_latency(raw2))
    return _compare("app_latency_ms", 5.0, "A", a_vals, "A_repeat", b_vals)


def analyze_deliberate_regression(n_runs: int = 8) -> Comparison:
    """B injects extra application latency (a known regression)."""
    a_vals: list[float] = []
    b_vals: list[float] = []
    for i in range(n_runs):
        raw = healthy_trace("del-a-" + str(i), n=20, seed="del-" + str(i))
        bad = healthy_trace("del-b-" + str(i), n=20, seed="del-bad-" + str(i))
        # shift latency gauges
        from .replay import clone
        bad = [
            clone(r, value=(r.value or 0) + 40.0) if r.metric == "app_latency_ms" else r
            for r in bad
        ]
        a_vals.append(_latency(raw))
        b_vals.append(_latency(bad))
    return _compare("app_latency_ms", 10.0, "baseline", a_vals, "regressed", b_vals)


def _compare(metric: str, meaningful: float, na: str, a: Sequence[float], nb: str, b: Sequence[float]) -> Comparison:
    ga = GroupResult(na, len(a), list(a), float(median(a)), float(sum(a) / len(a)))
    gb = GroupResult(nb, len(b), list(b), float(median(b)), float(sum(b) / len(b)))
    effect = gb.median - ga.median
    # A vs A: same seed lists should be tiny
    same = abs(effect) < meaningful
    if na == "A" and nb == "A_repeat":
        decision = "no_practically_meaningful_difference" if same else "false_alarm"
        aa_false = not same
    elif abs(effect) < meaningful:
        decision = "no_practically_meaningful_difference"
        aa_false = False
    elif effect > 0:
        decision = "regression_supported"
        aa_false = False
    else:
        decision = "improvement_supported"
        aa_false = False
    return Comparison(
        primary_metric=metric,
        meaningful_delta=meaningful,
        a=ga, b=gb,
        aa_false_alarm=aa_false,
        decision=decision,
        effect=effect,
        detail="median(" + nb + ") - median(" + na + ") = " + f"{effect:.3f}" + " " + metric
        + "; threshold=" + str(meaningful),
    )
