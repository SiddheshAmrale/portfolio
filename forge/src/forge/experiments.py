"""Netflix-style experiment allocation → silver enrollment → gold metrics."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Sequence

from .contracts import ExpectationResult, expect_non_null, expect_unique


SOFTWARE = "forge 0.1.0"


@dataclass(frozen=True)
class Allocation:
    allocation_id: str
    user_id: str
    experiment_id: str
    cell: str
    allocated_at_ms: int
    arrival_time_ms: int


@dataclass(frozen=True)
class Outcome:
    user_id: str
    experiment_id: str
    converted: bool
    outcome_time_ms: int


def silver_enrollment(allocs: Sequence[Allocation]) -> tuple[list[dict[str, Any]], list[ExpectationResult]]:
    """One enrollment row per (experiment, user). Duplicates are a data-health failure."""
    rows = [
        {
            "allocation_id": a.allocation_id,
            "user_id": a.user_id,
            "experiment_id": a.experiment_id,
            "cell": a.cell,
            "allocated_at_ms": a.allocated_at_ms,
            "arrival_time_ms": a.arrival_time_ms,
            "lag_ms": a.arrival_time_ms - a.allocated_at_ms,
        }
        for a in allocs
    ]
    checks = [
        expect_non_null(rows, "allocation_id"),
        expect_unique(rows, ["experiment_id", "user_id"]),
        expect_unique(rows, ["allocation_id"]),
    ]
    return rows, checks


def gold_experiment_metrics(
    enrollment: Sequence[dict[str, Any]],
    outcomes: Sequence[Outcome],
) -> list[dict[str, Any]]:
    by_eu = {(o.experiment_id, o.user_id): o for o in outcomes}
    cells: dict[tuple[str, str], dict[str, float]] = {}
    for e in enrollment:
        key = (str(e["experiment_id"]), str(e["cell"]))
        bucket = cells.setdefault(key, {"allocated": 0.0, "converted": 0.0})
        bucket["allocated"] += 1.0
        o = by_eu.get((e["experiment_id"], e["user_id"]))
        if o and o.converted:
            bucket["converted"] += 1.0
    out = []
    for (exp, cell), b in sorted(cells.items()):
        rate = (b["converted"] / b["allocated"]) if b["allocated"] else 0.0
        out.append({
            "experiment_id": exp,
            "cell": cell,
            "allocated": b["allocated"],
            "converted": b["converted"],
            "conversion_rate": rate,
        })
    return out


def experiment_health(enrollment: Sequence[dict[str, Any]], checks: Sequence[ExpectationResult]) -> dict[str, Any]:
    hard = [c for c in checks if not c.passed]
    max_lag = max((int(r["lag_ms"]) for r in enrollment), default=0)
    return {
        "healthy": len(hard) == 0,
        "hard_failures": [c.__dict__ for c in hard],
        "n_enrollment": len(enrollment),
        "peak_allocation_lag_ms": max_lag,
        "notes": (
            "Duplicate (experiment,user) allocations break causal analysis. "
            "This is the Netflix experimentation-platform data-health theme."
        ),
    }


def run_experiment_case(
    allocs: Sequence[Allocation],
    outcomes: Sequence[Outcome],
) -> dict[str, Any]:
    enrollment, checks = silver_enrollment(allocs)
    metrics = gold_experiment_metrics(enrollment, outcomes)
    health = experiment_health(enrollment, checks)
    return {
        "software": SOFTWARE,
        "enrollment": enrollment,
        "metrics": metrics,
        "health": health,
        "checks": [c.__dict__ for c in checks],
    }
