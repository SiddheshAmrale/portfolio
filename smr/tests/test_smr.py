from smr.integrity import integrity_report, missing_visible, safe_mean, simulate_channel, evaluate_trips, TripSetpoint
from smr.cases import all_cases, build
from smr.physics_store import PhysicsResult, compare_runs, validate_result


def test_missing_not_zero():
    rows = simulate_channel("coolant_temp", mode="missing_gap")
    assert missing_visible(rows)
    assert all(r.value is None for r in rows if r.status == "missing")


def test_zero_fill_suspicion():
    rows = simulate_channel("coolant_temp", mode="zero_filled_bug")
    rep = integrity_report(rows)
    assert rep["zero_filled_suspicion"] is True
    assert safe_mean(rows) is not None
    assert rep["naive_mean"] < rep["safe_mean"]


def test_trip_fires():
    rows = simulate_channel("coolant_temp", mode="trip_high", base=300)
    trips = evaluate_trips(rows, [TripSetpoint("coolant_temp", high=330)])
    assert trips[0]["fired"] is True


def test_flux_trip_fires():
    rows = simulate_channel("neutron_flux", mode="trip_high", base=8.0e5, unit="n/cm2/s")
    trips = evaluate_trips(rows, [TripSetpoint("neutron_flux", high=1.2e6)])
    assert trips[0]["fired"] is True


def test_stale_marked():
    rows = simulate_channel("coolant_temp", mode="stale")
    assert any(r.status == "stale" for r in rows)


def test_physics_repro_ok():
    a = PhysicsResult("r1", "d", "code", "sha", {}, 1.0, 500.0, "ok")
    b = PhysicsResult("r2", "d", "code", "sha", {}, 1.0002, 500.1, "ok")
    assert compare_runs(a, b)["reproducible"] is True


def test_physics_missing_keff():
    a = PhysicsResult("r1", "d", "code", "sha", {}, 1.0, 500.0, "ok")
    b = PhysicsResult("r2", "d", "code", "sha", {}, None, 500.0, "missing_field")
    assert validate_result(b)["ok"] is False
    assert compare_runs(a, b)["reproducible"] is False


def test_physics_code_drift():
    a = PhysicsResult("r1", "d", "code", "sha1", {}, 1.0, 500.0, "ok")
    b = PhysicsResult("r2", "d", "code", "sha2", {}, 1.0, 500.0, "ok")
    assert compare_runs(a, b)["reproducible"] is False
    assert compare_runs(a, b)["same_code_revision"] is False


def test_build(tmp_path):
    assert (build(tmp_path) / "cases.json").exists()
    assert len(all_cases()) >= 9
