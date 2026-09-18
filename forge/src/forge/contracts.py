"""Data contracts and quality expectations."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional, Sequence


@dataclass
class ExpectationResult:
    name: str
    passed: bool
    detail: str
    severity: str = "error"  # error | warn


@dataclass
class ContractReport:
    table: str
    results: list[ExpectationResult] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return all(r.passed or r.severity == "warn" for r in self.results)

    @property
    def hard_failures(self) -> list[ExpectationResult]:
        return [r for r in self.results if not r.passed and r.severity == "error"]


def _get(row: dict[str, Any], key: str) -> Any:
    return row.get(key)


def expect_non_null(rows: Sequence[dict[str, Any]], col: str) -> ExpectationResult:
    bad = sum(1 for r in rows if _get(r, col) is None)
    return ExpectationResult(
        name="non_null:" + col,
        passed=bad == 0,
        detail=str(bad) + " null values in " + col,
    )


def expect_unique(rows: Sequence[dict[str, Any]], cols: Sequence[str]) -> ExpectationResult:
    seen: set[tuple] = set()
    dups = 0
    for r in rows:
        key = tuple(_get(r, c) for c in cols)
        if key in seen:
            dups += 1
        else:
            seen.add(key)
    return ExpectationResult(
        name="unique:" + ",".join(cols),
        passed=dups == 0,
        detail=str(dups) + " duplicate keys",
    )


def expect_in_set(rows: Sequence[dict[str, Any]], col: str, allowed: set[Any]) -> ExpectationResult:
    bad = [r for r in rows if _get(r, col) not in allowed]
    return ExpectationResult(
        name="in_set:" + col,
        passed=len(bad) == 0,
        detail=str(len(bad)) + " values outside " + str(sorted(allowed)[:8]),
    )


def expect_range(
    rows: Sequence[dict[str, Any]],
    col: str,
    lo: Optional[float] = None,
    hi: Optional[float] = None,
) -> ExpectationResult:
    bad = 0
    for r in rows:
        v = _get(r, col)
        if v is None:
            continue
        if lo is not None and v < lo:
            bad += 1
        elif hi is not None and v > hi:
            bad += 1
    return ExpectationResult(
        name="range:" + col,
        passed=bad == 0,
        detail=str(bad) + " out of range [" + str(lo) + "," + str(hi) + "]",
    )


def expect_freshness(
    rows: Sequence[dict[str, Any]],
    event_col: str,
    arrival_col: str,
    max_lag_ms: int,
) -> ExpectationResult:
    if not rows:
        return ExpectationResult("freshness", True, "empty")
    lags = []
    for r in rows:
        e = _get(r, event_col)
        a = _get(r, arrival_col)
        if e is None or a is None:
            continue
        lags.append(a - e)
    if not lags:
        return ExpectationResult("freshness", False, "no timestamps")
    peak = max(lags)
    return ExpectationResult(
        name="freshness_lag_ms",
        passed=peak <= max_lag_ms,
        detail="peak_lag_ms=" + str(peak) + " sla=" + str(max_lag_ms),
        severity="warn",
    )


def validate_bronze_events(rows: Sequence[dict[str, Any]]) -> ContractReport:
    rep = ContractReport("bronze.events")
    rep.results.append(expect_non_null(rows, "event_id"))
    rep.results.append(expect_non_null(rows, "user_id"))
    rep.results.append(expect_non_null(rows, "event_time_ms"))
    rep.results.append(expect_unique(rows, ["event_id"]))
    rep.results.append(expect_in_set(rows, "event_type", {"view", "click", "alloc", "convert", "sensor"}))
    return rep


def validate_silver_users(rows: Sequence[dict[str, Any]]) -> ContractReport:
    rep = ContractReport("silver.users_scd2")
    rep.results.append(expect_non_null(rows, "user_id"))
    rep.results.append(expect_non_null(rows, "valid_from_ms"))
    current = [r for r in rows if r.get("is_current")]
    rep.results.append(expect_unique(current, ["user_id"]))
    return rep


def validate_gold_metrics(rows: Sequence[dict[str, Any]]) -> ContractReport:
    rep = ContractReport("gold.daily_metrics")
    rep.results.append(expect_non_null(rows, "day"))
    rep.results.append(expect_non_null(rows, "metric"))
    rep.results.append(expect_range(rows, "value", lo=0.0))
    return rep
