import pytest

from pilot.experiment import confirm_impairment
from pilot.linux import linux_available
from pilot.schema import Observation
from pilot.traces import condition_trace


def test_confirm_healthy_is_true():
    ok, _ = confirm_impairment("healthy", [20, 22], [21, 23], False)
    assert ok is True


def test_confirm_delay_requires_workload_move():
    ok, _ = confirm_impairment("delay", [20, 21], [21, 22], False)
    assert ok is False
    ok2, _ = confirm_impairment("delay", [20, 21], [90, 100], False)
    assert ok2 is True


def test_live_runner_requires_linux():
    if linux_available():
        pytest.skip("this host is Linux; suite would run live")
    from pilot.experiment import run_linux_suite
    with pytest.raises(RuntimeError, match="Linux /proc"):
        run_linux_suite("/tmp/pilot-should-not-write")


def test_condition_is_not_on_observations():
    rows = condition_trace("x", "cpu", n=8, seed="x")
    for r in rows:
        dumped = r.to_dict()
        assert "condition" not in dumped
        assert isinstance(r, Observation)
