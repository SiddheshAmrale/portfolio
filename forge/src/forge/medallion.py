"""Medallion pipeline: bronze → silver → gold with late-data recomputation."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional, Sequence

from .cdc import UserChange, UserDim, apply_scd2, as_of
from .contracts import (
    ContractReport,
    validate_bronze_events,
    validate_gold_metrics,
    validate_silver_users,
)


SOFTWARE = "forge 0.1.0"


@dataclass
class PipelineRun:
    name: str
    bronze_in: int
    bronze_rejected: int
    silver_users: int
    gold_rows: int
    late_events: int
    contracts: list[ContractReport] = field(default_factory=list)
    notes: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "bronze_in": self.bronze_in,
            "bronze_rejected": self.bronze_rejected,
            "silver_users": self.silver_users,
            "gold_rows": self.gold_rows,
            "late_events": self.late_events,
            "contracts": [
                {
                    "table": c.table,
                    "ok": c.ok,
                    "results": [r.__dict__ for r in c.results],
                }
                for c in self.contracts
            ],
            "notes": self.notes,
        }


def _day(ms: int) -> str:
    # Fixed epoch days for reproducibility (not timezone-aware wall clock).
    return "d" + str(ms // 86_400_000)


def ingest_bronze(raw: Sequence[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]], ContractReport]:
    """Append-only bronze. Contract failures are quarantined, not deleted silently."""
    report = validate_bronze_events(raw)
    if report.ok:
        return list(raw), [], report
    # Quarantine rows that violate uniqueness or nulls.
    seen: set[Any] = set()
    good: list[dict[str, Any]] = []
    bad: list[dict[str, Any]] = []
    for r in raw:
        eid = r.get("event_id")
        if eid is None or r.get("user_id") is None or r.get("event_time_ms") is None:
            bad.append({**r, "_reject": "null_required"})
            continue
        if eid in seen:
            bad.append({**r, "_reject": "duplicate_event_id"})
            continue
        seen.add(eid)
        if r.get("event_type") not in {"view", "click", "alloc", "convert", "sensor"}:
            bad.append({**r, "_reject": "bad_event_type"})
            continue
        good.append(r)
    # Re-validate the accepted set.
    report = validate_bronze_events(good)
    return good, bad, report


def build_silver_users(changes: Sequence[UserChange], seed: Sequence[UserDim] | None = None) -> tuple[list[UserDim], ContractReport]:
    rows = apply_scd2(seed or [], changes)
    report = validate_silver_users([r.to_dict() for r in rows])
    return rows, report


def build_gold_daily(
    bronze: Sequence[dict[str, Any]],
    users: Sequence[UserDim],
    watermark_ms: Optional[int] = None,
) -> tuple[list[dict[str, Any]], int]:
    """Aggregate converts by day × plan as-of event time. Late facts beyond watermark counted."""
    late = 0
    buckets: dict[tuple[str, str], float] = {}
    for ev in bronze:
        if ev.get("event_type") != "convert":
            continue
        t = int(ev["event_time_ms"])
        arr = int(ev.get("arrival_time_ms", t))
        if watermark_ms is not None and arr > watermark_ms and t <= (watermark_ms - 3_600_000):
            late += 1
        u = as_of(users, str(ev["user_id"]), t)
        plan = u.plan if u else "unknown"
        key = (_day(t), plan)
        buckets[key] = buckets.get(key, 0.0) + float(ev.get("value", 1.0))
    gold = [
        {"day": day, "metric": "converts", "plan": plan, "value": val}
        for (day, plan), val in sorted(buckets.items())
    ]
    return gold, late


def run_medallion(
    raw_events: Sequence[dict[str, Any]],
    user_changes: Sequence[UserChange],
    name: str = "medallion",
    watermark_ms: Optional[int] = None,
) -> tuple[PipelineRun, dict[str, Any]]:
    bronze, rejected, b_rep = ingest_bronze(raw_events)
    users, u_rep = build_silver_users(user_changes)
    gold, late = build_gold_daily(bronze, users, watermark_ms=watermark_ms)
    g_rep = validate_gold_metrics(gold)
    run = PipelineRun(
        name=name,
        bronze_in=len(raw_events),
        bronze_rejected=len(rejected),
        silver_users=len(users),
        gold_rows=len(gold),
        late_events=late,
        contracts=[b_rep, u_rep, g_rep],
        notes="Quarantined rejects stay visible. Late converts beyond watermark are counted for observability.",
    )
    payload = {
        "software": SOFTWARE,
        "bronze": bronze,
        "quarantine": rejected,
        "silver_users": [u.to_dict() for u in users],
        "gold": gold,
        "run": run.to_dict(),
    }
    return run, payload
