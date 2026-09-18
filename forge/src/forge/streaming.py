"""Event-time vs processing-time watermark teaching helpers."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Sequence


@dataclass(frozen=True)
class Event:
    event_id: str
    event_time_ms: int
    arrival_time_ms: int
    value: float


def watermark_ms(events: Sequence[Event], allowed_lateness_ms: int) -> int | None:
    if not events:
        return None
    max_event = max(e.event_time_ms for e in events)
    return max_event - allowed_lateness_ms


def classify_late(events: Sequence[Event], allowed_lateness_ms: int) -> list[dict[str, Any]]:
    wm = watermark_ms(events, allowed_lateness_ms)
    out = []
    for e in events:
        late = wm is not None and e.arrival_time_ms > (e.event_time_ms + allowed_lateness_ms)
        out.append({
            "event_id": e.event_id,
            "event_time_ms": e.event_time_ms,
            "arrival_time_ms": e.arrival_time_ms,
            "value": e.value,
            "late": late,
            "lag_ms": e.arrival_time_ms - e.event_time_ms,
        })
    return out
