"""Safety-critical sensor series: missing ≠ zero, trip logic, stale channels."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional, Sequence


SOFTWARE = "smr 0.1.0"


@dataclass(frozen=True)
class Sample:
    channel: str
    t_ms: int
    value: Optional[float]
    unit: str
    status: str  # ok | missing | stale | failed
    source_ref: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "channel": self.channel,
            "t_ms": self.t_ms,
            "value": self.value,
            "unit": self.unit,
            "status": self.status,
            "source_ref": self.source_ref,
        }


@dataclass(frozen=True)
class TripSetpoint:
    channel: str
    high: Optional[float] = None
    low: Optional[float] = None
    action: str = "alarm"


def simulate_channel(
    channel: str,
    n: int = 20,
    base: float = 300.0,
    unit: str = "C",
    mode: str = "healthy",
    seed: int = 3,
) -> list[Sample]:
    state = (seed * 9973 + sum(ord(c) for c in channel)) & 0xFFFF
    rows: list[Sample] = []
    for i in range(n):
        state = (1103515245 * state + 12345) & 0x7FFFFFFF
        noise = ((state % 100) / 100.0 - 0.5) * 2.0
        t = 1_800_000 + i * 1000
        status = "ok"
        value: Optional[float] = base + noise
        if mode == "missing_gap" and i in (8, 9, 10):
            status = "missing"
            value = None
        elif mode == "zero_filled_bug" and i in (8, 9, 10):
            # Anti-pattern: treating missing as 0
            status = "ok"
            value = 0.0
        elif mode == "stale" and i >= 8:
            status = "stale"
            value = base  # frozen
        elif mode == "trip_high" and i >= 10:
            value = base + 40 + (i - 10) * 2
        elif mode == "sensor_fail" and i >= 12:
            status = "failed"
            value = None
        rows.append(Sample(channel, t, value, unit, status, "smr:sim#" + channel))
    return rows


def naive_mean(rows: Sequence[Sample]) -> Optional[float]:
    """Wrong if missing was zero-filled."""
    vals = [r.value for r in rows if r.value is not None]
    if not vals:
        return None
    return sum(vals) / len(vals)


def safe_mean(rows: Sequence[Sample]) -> Optional[float]:
    """Mean over trusted ok samples. Zero-filled coolant temperatures are excluded."""
    vals = []
    for r in rows:
        if r.status != "ok" or r.value is None:
            continue
        if r.channel.startswith("coolant") and r.value == 0.0:
            continue
        vals.append(r.value)
    if not vals:
        return None
    return sum(vals) / len(vals)


def missing_visible(rows: Sequence[Sample]) -> bool:
    return any(r.status == "missing" and r.value is None for r in rows)


def evaluate_trips(rows: Sequence[Sample], trips: Sequence[TripSetpoint]) -> list[dict[str, Any]]:
    out = []
    by_ch = {}
    for r in rows:
        by_ch.setdefault(r.channel, []).append(r)
    for trip in trips:
        series = by_ch.get(trip.channel, [])
        fired = False
        at = None
        for r in series:
            if r.status != "ok" or r.value is None:
                continue
            if trip.high is not None and r.value >= trip.high:
                fired = True
                at = r.t_ms
                break
            if trip.low is not None and r.value <= trip.low:
                fired = True
                at = r.t_ms
                break
        out.append({
            "channel": trip.channel,
            "action": trip.action,
            "fired": fired,
            "at_ms": at,
            "high": trip.high,
            "low": trip.low,
        })
    return out


def integrity_report(rows: Sequence[Sample]) -> dict[str, Any]:
    zero_as_ok = any(r.status == "ok" and r.value == 0.0 for r in rows)
    return {
        "missing_visible": missing_visible(rows),
        "safe_mean": safe_mean(rows),
        "naive_mean": naive_mean(rows),
        "stale_count": sum(1 for r in rows if r.status == "stale"),
        "failed_count": sum(1 for r in rows if r.status == "failed"),
        "zero_filled_suspicion": zero_as_ok and any(
            # temperature channel at 0 C is physically odd for primary coolant teaching case
            r.channel.startswith("coolant") and r.value == 0.0 and r.status == "ok" for r in rows
        ),
        "notes": "Missing must remain null. Zero-filling coolant temperature is a safety data bug.",
    }
