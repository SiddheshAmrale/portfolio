from forge.cdc import UserChange, apply_scd2, as_of
from forge.contracts import validate_bronze_events
from forge.experiments import Allocation, Outcome, run_experiment_case
from forge.medallion import ingest_bronze, run_medallion
from forge.cases import all_cases, build
import json


def test_scd2_upgrade_and_as_of():
    changes = [
        UserChange("u0", "free", "us", 100),
        UserChange("u0", "pro", "us", 500),
    ]
    rows = apply_scd2([], changes)
    assert len(rows) == 2
    assert as_of(rows, "u0", 200).plan == "free"
    assert as_of(rows, "u0", 600).plan == "pro"
    assert sum(1 for r in rows if r.is_current) == 1


def test_idempotent_same_attributes():
    changes = [
        UserChange("u0", "free", "us", 100),
        UserChange("u0", "free", "us", 200),
    ]
    rows = apply_scd2([], changes)
    assert len(rows) == 1


def test_bronze_quarantines_dupes():
    raw = [
        {"event_id": "a", "user_id": "u", "event_type": "view", "event_time_ms": 1, "arrival_time_ms": 1},
        {"event_id": "a", "user_id": "u", "event_type": "view", "event_time_ms": 2, "arrival_time_ms": 2},
        {"event_id": "b", "user_id": None, "event_type": "view", "event_time_ms": 1, "arrival_time_ms": 1},
    ]
    good, bad, _ = ingest_bronze(raw)
    assert len(good) == 1
    assert len(bad) == 2


def test_contract_unique_events():
    rows = [
        {"event_id": "a", "user_id": "u", "event_type": "view", "event_time_ms": 1},
        {"event_id": "a", "user_id": "u", "event_type": "view", "event_time_ms": 2},
    ]
    rep = validate_bronze_events(rows)
    assert not rep.ok


def test_experiment_dup_fails_health():
    allocs = [
        Allocation("a1", "u1", "e", "control", 1, 2),
        Allocation("a2", "u1", "e", "treatment", 3, 4),
    ]
    out = run_experiment_case(allocs, [Outcome("u1", "e", True, 10)])
    assert out["health"]["healthy"] is False


def test_experiment_healthy():
    allocs = [
        Allocation("a1", "u1", "e", "control", 1, 2),
        Allocation("a2", "u2", "e", "treatment", 3, 4),
    ]
    out = run_experiment_case(allocs, [
        Outcome("u1", "e", False, 10),
        Outcome("u2", "e", True, 11),
    ])
    assert out["health"]["healthy"] is True
    rates = {m["cell"]: m["conversion_rate"] for m in out["metrics"]}
    assert rates["control"] == 0.0
    assert rates["treatment"] == 1.0


def test_late_events_counted(tmp_path):
    cases = {c["id"]: c for c in all_cases()}
    late = cases["late_arriving"]
    assert late["run"]["late_events"] >= 1
    assert any(g["value"] >= 5 for g in late["gold"])


def test_build_writes(tmp_path):
    out = build(tmp_path)
    assert (out / "cases.json").exists()
    assert (out / "index.json").exists()
    assert (out / "parquet" / "happy_path" / "gold.parquet").exists()
    idx = json.loads((out / "index.json").read_text(encoding="utf-8"))
    assert idx["duckdb_gold_by_plan"]


def test_watermark_marks_late():
    from forge.streaming import Event, classify_late
    events = [
        Event("a", 1000, 1050, 1),
        Event("b", 2000, 8000, 1),
    ]
    rows = classify_late(events, allowed_lateness_ms=1000)
    assert rows[0]["late"] is False
    assert rows[1]["late"] is True


def test_medallion_rerun_idempotent_counts():
    raw = [
        {"event_id": "e1", "user_id": "u0", "event_type": "convert", "event_time_ms": 100, "arrival_time_ms": 110, "value": 1.0},
    ]
    changes = [UserChange("u0", "free", "us", 50)]
    run1, p1 = run_medallion(raw, changes, name="a")
    run2, p2 = run_medallion(raw, changes, name="b")
    assert run1.gold_rows == run2.gold_rows
    assert p1["gold"] == p2["gold"]


def test_gold_uses_historical_plan():
    run, payload = run_medallion(
        [{
            "event_id": "c1",
            "user_id": "u0",
            "event_type": "convert",
            "event_time_ms": 200,
            "arrival_time_ms": 210,
            "value": 1.0,
        }],
        [
            UserChange("u0", "free", "us", 100),
            UserChange("u0", "pro", "us", 500),
        ],
    )
    plans = {g["plan"] for g in payload["gold"]}
    assert "free" in plans
    assert "pro" not in plans
