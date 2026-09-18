"""Rate and discontinuity handling.

Prometheus already treats a counter decrease as a reset. This module does not claim that
as a discovery. It classifies *why* a decrease happened and refuses to invent a rate
when the class is ambiguous.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Sequence

from .schema import Observation

UINT32 = 2**32
UINT64 = 2**64


@dataclass(frozen=True)
class RatePoint:
    t_obs_ms: int
    t_arr_ms: int
    interval_ms: int
    naive_per_s: Optional[float]
    naive_arrival_per_s: Optional[float]
    prom_per_s: Optional[float]
    pilot_per_s: Optional[float]
    classification: str
    detail: str
    scrape_seq: int


def _ok_counters(rows: Sequence[Observation], metric: str, interface: str) -> list[Observation]:
    out = [r for r in rows if r.metric == metric and r.interface == interface]
    out.sort(key=lambda r: (r.scrape_seq, r.arrival_time_ms, r.observation_time_ms))
    return out


def dedupe_by_seq(rows: Sequence[Observation]) -> list[Observation]:
    seen: set[tuple] = set()
    out: list[Observation] = []
    for r in rows:
        key = (r.run_id, r.source_id, r.interface, r.metric, r.scrape_seq, r.collector_epoch, r.value)
        if key in seen:
            continue
        seen.add(key)
        out.append(r)
    return out


def classify_decrease(prev: Observation, cur: Observation) -> tuple[str, str]:
    if prev.value is None or cur.value is None:
        return "missing", "missing observation; no rate"
    if cur.observation_time_ms < prev.observation_time_ms and cur.arrival_time_ms >= prev.arrival_time_ms:
        return "reorder", "observation_time went backwards while arrival_time did not — late sample"
    if cur.collector_epoch > prev.collector_epoch:
        return "restart", "collector_epoch advanced; treat as a new series"
    if prev.interface != cur.interface or prev.source_id != cur.source_id:
        return "identity", "source/interface identity changed"
    pv, cv = prev.value, cur.value
    if cv >= pv:
        return "monotonic", "increase"
    # wrap candidates: decrease that is explained by unsigned wrap
    for mod, name in ((UINT32, "uint32"), (UINT64, "uint64")):
        if pv > mod * 0.9 and (pv - cv) > mod * 0.5:
            wrapped = cv + (mod - pv)
            if wrapped >= 0:
                return "wrap_" + name, "decrease consistent with " + name + " wrap"
    if cur.collection_status != "ok" or prev.collection_status != "ok":
        return "status", "non-ok collection status"
    return "ambiguous", "counter decreased without wrap, restart, reorder, or identity change"


def prometheus_increase(prev: float, cur: float) -> float:
    """Prometheus increase(): a decrease is a reset; contribution is the new value."""
    if cur >= prev:
        return cur - prev
    return cur


def rates_for_series(rows: Sequence[Observation], metric: str, interface: str) -> list[RatePoint]:
    series = dedupe_by_seq(_ok_counters(rows, metric, interface))
    series = [r for r in series if r.collection_status == "ok" and r.value is not None]
    series.sort(key=lambda r: (r.observation_time_ms, r.scrape_seq))
    points: list[RatePoint] = []
    untrusted: set[int] = set()
    for i in range(1, len(series)):
        a, b = series[i - 1], series[i]
        dt = b.observation_time_ms - a.observation_time_ms
        dt_arr = b.arrival_time_ms - a.arrival_time_ms
        naive_arr = (b.value - a.value) / (dt_arr / 1000.0) if dt_arr > 0 else None
        if dt <= 0:
            points.append(RatePoint(
                t_obs_ms=b.observation_time_ms, t_arr_ms=b.arrival_time_ms, interval_ms=dt,
                naive_per_s=None, naive_arrival_per_s=naive_arr, prom_per_s=None, pilot_per_s=None,
                classification="nonpositive_interval",
                detail="observation interval is not positive; refuse to invent a rate",
                scrape_seq=b.scrape_seq,
            ))
            continue
        naive = (b.value - a.value) / (dt / 1000.0)
        home_unit = series[0].unit
        if a.unit != b.unit or b.unit != home_unit:
            klass, detail = "unit_change", "unit changed from " + a.unit + " to " + b.unit + "; not a traffic spike"
            prom = prometheus_increase(a.value, b.value) / (dt / 1000.0)
            pilot = None
        else:
            klass, detail = classify_decrease(a, b)
            prom = prometheus_increase(a.value, b.value) / (dt / 1000.0)
            if (i - 1) in untrusted and klass == "monotonic":
                klass, detail = "after_untrusted", "previous sample was untrusted; withhold rate"
                pilot = None
            elif klass == "monotonic":
                pilot = naive
            elif klass.startswith("wrap_"):
                mod = UINT32 if klass.endswith("32") else UINT64
                pilot = ((b.value + (mod - a.value)) / (dt / 1000.0))
            elif klass == "restart":
                pilot = None
                detail = detail + "; pilot withholds rate across epochs"
            else:
                pilot = None
        if klass == "ambiguous":
            untrusted.add(i)
        points.append(RatePoint(
            t_obs_ms=b.observation_time_ms, t_arr_ms=b.arrival_time_ms, interval_ms=dt,
            naive_per_s=naive, naive_arrival_per_s=naive_arr, prom_per_s=prom, pilot_per_s=pilot,
            classification=klass, detail=detail, scrape_seq=b.scrape_seq,
        ))
    return points


def missing_visible(rows: Sequence[Observation], metric: str) -> bool:
    return any(r.metric == metric and r.collection_status == "missing" for r in rows)


def mean(xs: Sequence[Optional[float]]) -> Optional[float]:
    vals = [x for x in xs if x is not None]
    if not vals:
        return None
    return sum(vals) / len(vals)
