from pilot.regression import analyze_aa, analyze_collector_change, analyze_deliberate_regression


def test_aa_is_not_a_false_alarm():
    c = analyze_aa(n_runs=6)
    assert c.decision == "no_practically_meaningful_difference"
    assert c.aa_false_alarm is False


def test_deliberate_regression_detected():
    c = analyze_deliberate_regression(n_runs=6)
    assert c.decision == "regression_supported"
    assert c.effect > c.meaningful_delta


def test_collector_change_is_deterministic():
    a = analyze_collector_change(n_runs=5)
    b = analyze_collector_change(n_runs=5)
    assert a.decision == b.decision
    assert abs(a.effect - b.effect) < 1e-6
