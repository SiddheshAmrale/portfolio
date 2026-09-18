from smr.integrity import integrity_report, missing_visible, safe_mean, simulate_channel, evaluate_trips, TripSetpoint
from smr.cases import all_cases, build


def test_missing_not_zero():
    rows = simulate_channel("coolant_temp", mode="missing_gap")
    assert missing_visible(rows)
    assert all(r.value is None for r in rows if r.status == "missing")


def test_zero_fill_suspicion():
    rows = simulate_channel("coolant_temp", mode="zero_filled_bug")
    rep = integrity_report(rows)
    assert rep["zero_filled_suspicion"] is True
    assert safe_mean(rows) is not None
    # naive mean pulled down by zeros
    assert rep["naive_mean"] < rep["safe_mean"]


def test_trip_fires():
    rows = simulate_channel("coolant_temp", mode="trip_high", base=300)
    trips = evaluate_trips(rows, [TripSetpoint("coolant_temp", high=330)])
    assert trips[0]["fired"] is True


def test_stale_marked():
    rows = simulate_channel("coolant_temp", mode="stale")
    assert any(r.status == "stale" for r in rows)


def test_build(tmp_path):
    assert (build(tmp_path) / "cases.json").exists()
    assert len(all_cases()) >= 5
