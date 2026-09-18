from pilot.diagnosis import diagnose, naive_network_blame
from pilot.evaluate import evaluate, intervention_cases
from pilot.traces import condition_trace


def test_rules_do_not_need_labels():
    rows = condition_trace("x", "cpu", n=20, seed="x")
    assert not any("cpu" == getattr(r, "notes", "cpu") and False for r in rows)
    d = diagnose(rows)
    assert d.label == "receiver_cpu"


def test_delay_is_not_called_loss():
    d = diagnose(condition_trace("d", "delay", n=20, seed="d"))
    assert d.label == "network_delay"


def test_stale_is_insufficient():
    d = diagnose(condition_trace("s", "stale", n=20, seed="s"))
    assert d.label == "insufficient_evidence"


def test_mixed_is_insufficient():
    d = diagnose(condition_trace("m", "mixed", n=20, seed="m"))
    assert d.label == "insufficient_evidence"


def test_held_out_eval():
    rep = evaluate("held_out")
    assert rep.n >= 8
    assert 0 < rep.diagnosed_pct < 1
    assert rep.accuracy_when_diagnosed >= 0.99
    assert rep.network_false_attr == 0
    assert rep.missed_impaired == 0


def test_correct_intervention_helps_wrong_does_not():
    cases = intervention_cases()
    for c in cases:
        assert c["correct_action_helped"] is True
        assert c["wrong_action_helped"] is False


def test_naive_blame_disagrees_on_cpu():
    rows = condition_trace("x", "cpu", n=20, seed="x")
    assert naive_network_blame(rows) == "network"
    assert diagnose(rows).label == "receiver_cpu"
