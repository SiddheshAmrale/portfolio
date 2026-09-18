"""Pinned scenarios and website case builder."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .cdc import UserChange
from .experiments import Allocation, Outcome, run_experiment_case
from .medallion import SOFTWARE, run_medallion
from .store import dump_run_parquet


def _events_clean() -> list[dict[str, Any]]:
    base = 1_700_000_000_000
    rows = []
    for i in range(12):
        rows.append({
            "event_id": "e" + str(i),
            "user_id": "u" + str(i % 4),
            "event_type": "convert" if i % 3 == 0 else "view",
            "event_time_ms": base + i * 3_600_000,
            "arrival_time_ms": base + i * 3_600_000 + 50,
            "value": 1.0,
        })
    return rows


def _user_changes() -> list[UserChange]:
    t0 = 1_700_000_000_000
    return [
        UserChange("u0", "free", "us-east", t0),
        UserChange("u1", "free", "us-west", t0),
        UserChange("u2", "pro", "eu", t0),
        UserChange("u3", "pro", "us-east", t0),
        UserChange("u0", "pro", "us-east", t0 + 5 * 3_600_000),  # plan upgrade
        UserChange("u1", "free", "eu", t0 + 8 * 3_600_000),  # region move
    ]


def case_happy_path() -> dict[str, Any]:
    run, payload = run_medallion(_events_clean(), _user_changes(), name="happy_path")
    return {
        "id": "happy_path",
        "title": "Clean medallion run",
        "question": "When contracts pass, bronze→silver→gold should be reproducible and quarantine empty.",
        "theme": "Databricks medallion",
        "software": SOFTWARE,
        "disclaimer": "DuckDB/Parquet lakehouse semantics — not a Databricks Runtime.",
        **payload,
        "run": run.to_dict(),
    }


def case_contract_quarantine() -> dict[str, Any]:
    raw = _events_clean()
    raw.append({
        "event_id": "e0",  # duplicate
        "user_id": "u9",
        "event_type": "convert",
        "event_time_ms": 1_700_000_000_000,
        "arrival_time_ms": 1_700_000_000_100,
        "value": 1.0,
    })
    raw.append({
        "event_id": "bad1",
        "user_id": None,
        "event_type": "convert",
        "event_time_ms": 1_700_000_000_000,
        "arrival_time_ms": 1_700_000_000_100,
        "value": 1.0,
    })
    raw.append({
        "event_id": "bad2",
        "user_id": "u1",
        "event_type": "explode",
        "event_time_ms": 1_700_000_000_000,
        "arrival_time_ms": 1_700_000_000_100,
        "value": 1.0,
    })
    run, payload = run_medallion(raw, _user_changes(), name="contract_quarantine")
    return {
        "id": "contract_quarantine",
        "title": "Contract quarantine",
        "question": "Duplicates, null keys, and illegal event types must quarantine — not silently inflate gold.",
        "theme": "Data contracts / quality",
        "software": SOFTWARE,
        "disclaimer": "Expectation failures are first-class. Silent drop is a pipeline smell.",
        **payload,
        "run": run.to_dict(),
    }


def case_late_arriving() -> dict[str, Any]:
    raw = _events_clean()
    # Late convert: event_time early, arrival after watermark.
    watermark = 1_700_000_000_000 + 10 * 3_600_000
    raw.append({
        "event_id": "late1",
        "user_id": "u0",
        "event_type": "convert",
        "event_time_ms": 1_700_000_000_000 + 2 * 3_600_000,
        "arrival_time_ms": watermark + 60_000,
        "value": 5.0,
    })
    run, payload = run_medallion(raw, _user_changes(), name="late_arriving", watermark_ms=watermark)
    return {
        "id": "late_arriving",
        "title": "Late-arriving facts",
        "question": "A convert that arrives after the watermark must still be visible and counted as late for ops.",
        "theme": "Watermarks / freshness",
        "software": SOFTWARE,
        "disclaimer": "Watermark policy is explicit. Late data is measured, not wished away.",
        **payload,
        "run": run.to_dict(),
        "watermark_ms": watermark,
    }


def case_scd2_as_of() -> dict[str, Any]:
    run, payload = run_medallion(_events_clean(), _user_changes(), name="scd2_as_of")
    return {
        "id": "scd2_as_of",
        "title": "SCD2 as-of join",
        "question": "Gold plan attribution must use the user dimension version valid at event_time, not current plan.",
        "theme": "CDC / SCD2",
        "software": SOFTWARE,
        "disclaimer": "APPLY CHANGES / SCD2 teaching case. Not Unity Catalog.",
        **payload,
        "run": run.to_dict(),
        "highlight": "u0 upgrades free→pro at hour 5; converts before that stay free.",
    }


def case_experiment_healthy() -> dict[str, Any]:
    t0 = 1_700_100_000_000
    allocs = [
        Allocation("a1", "u1", "exp_signup", "control", t0, t0 + 20),
        Allocation("a2", "u2", "exp_signup", "treatment", t0 + 10, t0 + 40),
        Allocation("a3", "u3", "exp_signup", "control", t0 + 20, t0 + 50),
        Allocation("a4", "u4", "exp_signup", "treatment", t0 + 30, t0 + 60),
    ]
    outcomes = [
        Outcome("u1", "exp_signup", False, t0 + 1000),
        Outcome("u2", "exp_signup", True, t0 + 1100),
        Outcome("u3", "exp_signup", False, t0 + 1200),
        Outcome("u4", "exp_signup", True, t0 + 1300),
    ]
    payload = run_experiment_case(allocs, outcomes)
    return {
        "id": "experiment_healthy",
        "title": "Experiment allocation health",
        "question": "Silver enrollment must be unique per (experiment,user); gold shows conversion by cell.",
        "theme": "Netflix experimentation platform",
        "software": SOFTWARE,
        "disclaimer": "Allocation semantics only — not Netflix ExP. Iceberg/Spark not required to learn the invariant.",
        **payload,
    }


def case_experiment_dup_alloc() -> dict[str, Any]:
    t0 = 1_700_100_000_000
    allocs = [
        Allocation("a1", "u1", "exp_signup", "control", t0, t0 + 20),
        Allocation("a2", "u1", "exp_signup", "treatment", t0 + 10, t0 + 40),  # same user, both cells
        Allocation("a3", "u3", "exp_signup", "control", t0 + 20, t0 + 50),
    ]
    outcomes = [
        Outcome("u1", "exp_signup", True, t0 + 1000),
        Outcome("u3", "exp_signup", False, t0 + 1200),
    ]
    payload = run_experiment_case(allocs, outcomes)
    return {
        "id": "experiment_dup_alloc",
        "title": "Broken allocation uniqueness",
        "question": "Duplicate (experiment,user) allocations must fail data-health checks before analysis.",
        "theme": "Netflix data health",
        "software": SOFTWARE,
        "disclaimer": "Demonstrates why uniqueness is a contract, not a dashboard footnote.",
        **payload,
    }


def case_schema_evolution() -> dict[str, Any]:
    """New optional column appears mid-stream — silver must tolerate evolution."""
    raw = _events_clean()
    for r in raw[6:]:
        r["device_fw"] = "1.2.0"  # newly added field
    run, payload = run_medallion(raw, _user_changes(), name="schema_evolution")
    return {
        "id": "schema_evolution",
        "title": "Schema evolution (additive)",
        "question": "Additive optional fields must not break bronze ingest when core contract still holds.",
        "theme": "Schema evolution",
        "software": SOFTWARE,
        "disclaimer": "Additive evolution only. Breaking renames are a different (failing) contract story.",
        **payload,
        "run": run.to_dict(),
        "note": "device_fw appears on later events; event_id/user_id/event_type/time remain required.",
    }


def case_experiment_lag_slo() -> dict[str, Any]:
    t0 = 1_700_100_000_000
    allocs = [
        Allocation("a1", "u1", "exp_signup", "control", t0, t0 + 20),
        Allocation("a2", "u2", "exp_signup", "treatment", t0 + 10, t0 + 40),
        Allocation("a3", "u3", "exp_signup", "control", t0 + 20, t0 + 90_000),  # late arrival
        Allocation("a4", "u4", "exp_signup", "treatment", t0 + 30, t0 + 60),
    ]
    outcomes = [
        Outcome("u1", "exp_signup", False, t0 + 1000),
        Outcome("u2", "exp_signup", True, t0 + 1100),
        Outcome("u3", "exp_signup", False, t0 + 1200),
        Outcome("u4", "exp_signup", True, t0 + 1300),
    ]
    payload = run_experiment_case(allocs, outcomes, lag_slo_ms=5_000)
    return {
        "id": "experiment_lag_slo",
        "title": "Allocation lag SLO breach",
        "question": "Peak allocation lag past the SLO must fail health even when uniqueness is clean.",
        "theme": "Netflix data health / freshness",
        "software": SOFTWARE,
        "disclaimer": "Teaching lag SLO. Not Netflix production SLIs.",
        **payload,
    }


def case_experiment_sample_ratio() -> dict[str, Any]:
    t0 = 1_700_100_000_000
    # 80/20 instead of designed 50/50 — classic SRM / sample-ratio mismatch
    allocs = [
        Allocation("a" + str(i), "u" + str(i), "exp_signup", "control" if i < 8 else "treatment", t0 + i, t0 + i + 10)
        for i in range(10)
    ]
    outcomes = [Outcome("u" + str(i), "exp_signup", i % 2 == 0, t0 + 1000 + i) for i in range(10)]
    payload = run_experiment_case(
        allocs, outcomes,
        expected_share={"control": 0.5, "treatment": 0.5},
    )
    return {
        "id": "experiment_sample_ratio",
        "title": "Sample-ratio mismatch (SRM)",
        "question": "When observed cell shares diverge from the designed split, conversion lifts are untrustworthy.",
        "theme": "Netflix experimentation / SRM",
        "software": SOFTWARE,
        "disclaimer": "SRM teaching gate. Chi-square production tests are richer; the invariant is the same.",
        **payload,
    }


def case_out_of_order_cdc() -> dict[str, Any]:
    """Late CDC change with earlier change_time arrives after a later change — still sorted by time."""
    t0 = 1_700_000_000_000
    # Delivery order (array order) is wrong; apply_scd2 sorts by change_time_ms.
    changes = [
        UserChange("u0", "pro", "us-east", t0 + 5 * 3_600_000),   # arrives first in feed
        UserChange("u0", "free", "us-east", t0),                   # older change arrives late
        UserChange("u1", "free", "us-west", t0),
    ]
    events = [
        {
            "event_id": "e_early",
            "user_id": "u0",
            "event_type": "convert",
            "event_time_ms": t0 + 1 * 3_600_000,
            "arrival_time_ms": t0 + 1 * 3_600_000 + 50,
            "value": 1.0,
        },
        {
            "event_id": "e_late",
            "user_id": "u0",
            "event_type": "convert",
            "event_time_ms": t0 + 6 * 3_600_000,
            "arrival_time_ms": t0 + 6 * 3_600_000 + 50,
            "value": 1.0,
        },
    ]
    run, payload = run_medallion(events, changes, name="out_of_order_cdc")
    return {
        "id": "out_of_order_cdc",
        "title": "Out-of-order CDC sequenced",
        "question": "CDC must apply by sequencing/change time, not arrival order — early convert stays on free.",
        "theme": "AUTO CDC / sequencing",
        "software": SOFTWARE,
        "disclaimer": "Teaching stand-in for Databricks AUTO CDC sequencing. Not Lakeflow Runtime.",
        **payload,
        "run": run.to_dict(),
        "note": "Feed order is pro-then-free; sorted apply yields free→pro history.",
    }


def all_cases() -> list[dict[str, Any]]:
    return [
        case_happy_path(),
        case_contract_quarantine(),
        case_late_arriving(),
        case_scd2_as_of(),
        case_schema_evolution(),
        case_out_of_order_cdc(),
        case_experiment_healthy(),
        case_experiment_dup_alloc(),
        case_experiment_lag_slo(),
        case_experiment_sample_ratio(),
    ]


def build(out_dir: str | Path) -> Path:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    cases = all_cases()
    # Persist a sample medallion run as Parquet and prove DuckDB OLAP reads it.
    _, sample = run_medallion(_events_clean(), _user_changes(), name="persist")
    parquet_meta = dump_run_parquet(sample, out / "parquet" / "happy_path")
    index = {
        "software": SOFTWARE,
        "cases": [{"id": c["id"], "title": c["title"], "theme": c["theme"], "question": c["question"]} for c in cases],
        "keywords": [
            "medallion", "Delta Lake", "CDC", "SCD2", "data contracts",
            "late-arriving data", "watermark", "experiment allocation",
            "sample ratio", "SRM", "lag SLO", "data health", "DuckDB", "Parquet",
        ],
        "duckdb_gold_by_plan": json.loads(parquet_meta.get("gold_query", "[]")),
        "parquet": parquet_meta,
        "disclaimer": "Runnable lakehouse teaching system. Not Databricks Runtime or Netflix production.",
        "reproduce": "pip install -e ./forge && python -m pytest -q && python -m forge build-cases",
    }
    (out / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")
    (out / "cases.json").write_text(json.dumps(cases, indent=2), encoding="utf-8")
    return out
