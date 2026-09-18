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


def sample_ratio(enrollment: Sequence[dict[str, Any]], expected: dict[str, float] | None = None) -> dict[str, Any]:
    """Per-cell allocation share vs expected traffic split (SRM / sample-ratio check)."""
    counts: dict[str, float] = {}
    for r in enrollment:
        cell = str(r["cell"])
        counts[cell] = counts.get(cell, 0.0) + 1.0
    total = sum(counts.values()) or 1.0
    observed = {c: n / total for c, n in sorted(counts.items())}
    if expected is None:
        expected = {c: 1.0 / len(counts) for c in counts} if counts else {}
    # Chi-square-ish absolute deviation; teaching threshold.
    max_abs_dev = 0.0
    for c, share in observed.items():
        exp = expected.get(c, 0.0)
        max_abs_dev = max(max_abs_dev, abs(share - exp))
    skewed = max_abs_dev > 0.12  # >12pp off expected share
    return {
        "observed_share": observed,
        "expected_share": expected,
        "max_abs_deviation": max_abs_dev,
        "sample_ratio_ok": not skewed,
        "notes": (
            "Sample-ratio mismatch (SRM) means the allocator or pipeline is biased — "
            "do not trust conversion lifts until shares match the design."
        ),
    }


def experiment_health(
    enrollment: Sequence[dict[str, Any]],
    checks: Sequence[ExpectationResult],
    *,
    lag_slo_ms: int = 5_000,
    expected_share: dict[str, float] | None = None,
) -> dict[str, Any]:
    hard = [c for c in checks if not c.passed]
    max_lag = max((int(r["lag_ms"]) for r in enrollment), default=0)
    lag_ok = max_lag <= lag_slo_ms
    ratio = sample_ratio(enrollment, expected_share)
    healthy = len(hard) == 0 and lag_ok and bool(ratio["sample_ratio_ok"])
    return {
        "healthy": healthy,
        "hard_failures": [c.__dict__ for c in hard],
        "n_enrollment": len(enrollment),
        "peak_allocation_lag_ms": max_lag,
        "lag_slo_ms": lag_slo_ms,
        "lag_slo_ok": lag_ok,
        "sample_ratio": ratio,
        "notes": (
            "Duplicate (experiment,user) allocations break causal analysis. "
            "Lag SLOs and sample-ratio (SRM) are Netflix-style data-health gates."
        ),
    }


def run_experiment_case(
    allocs: Sequence[Allocation],
    outcomes: Sequence[Outcome],
    *,
    lag_slo_ms: int = 5_000,
    expected_share: dict[str, float] | None = None,
) -> dict[str, Any]:
    enrollment, checks = silver_enrollment(allocs)
    metrics = gold_experiment_metrics(enrollment, outcomes)
    health = experiment_health(
        enrollment, checks, lag_slo_ms=lag_slo_ms, expected_share=expected_share,
    )
    return {
        "software": SOFTWARE,
        "enrollment": enrollment,
        "metrics": metrics,
        "health": health,
        "checks": [c.__dict__ for c in checks],
    }
