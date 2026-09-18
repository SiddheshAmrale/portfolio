from pilot.linux import collect_linux, linux_available, parse_cgroup_cpu_stat, parse_pid_stat_ticks, parse_proc_net_dev, parse_proc_net_snmp_tcp
from pilot.quality import classify_decrease, rates_for_series
from pilot.replay import deliver_twice, insert_gaps, replay_identity
from pilot.schema import Observation, counter, missing
from pilot.store import duckdb_query, write_parquet
from pilot.traces import quality_baseline
from pilot.cases import quality_cases


def _obs(seq: int, value: float, t: int, epoch: int = 0, iface: str = "eth0") -> Observation:
    return counter("t", "s", iface, "rx_bytes", value, t, t, seq, epoch, "hand#" + str(seq), unit="B")


def test_hand_calculated_rate():
    rows = [_obs(0, 10_000, 0), _obs(1, 20_000, 10_000)]
    pts = rates_for_series(rows, "rx_bytes", "eth0")
    assert len(pts) == 1
    assert pts[0].interval_ms == 10_000
    assert abs(pts[0].naive_per_s - 1000.0) < 1e-9
    assert abs(pts[0].pilot_per_s - 1000.0) < 1e-9
    assert pts[0].classification == "monotonic"


def test_replay_does_not_inflate():
    base = quality_baseline(12)
    once = rates_for_series(base, "rx_bytes", "eth0")
    twice = rates_for_series(replay_identity(base) + replay_identity(base), "rx_bytes", "eth0")
    # identity replay concatenates two copies with the same scrape_seq; dedupe keeps one
    dup = rates_for_series(deliver_twice(base, every_n=1), "rx_bytes", "eth0")
    m1 = sum(p.pilot_per_s or 0 for p in once)
    m2 = sum(p.pilot_per_s or 0 for p in dup)
    assert abs(m1 - m2) < 1e-6


def test_missing_is_not_zero():
    base = [_obs(i, 1000 + i * 100, i * 1000) for i in range(6)]
    gapped = insert_gaps(base, [2, 3])
    miss = [r for r in gapped if r.collection_status == "missing"]
    assert miss and all(r.value is None for r in miss)
    assert not any(r.collection_status == "missing" and r.value == 0 for r in gapped)


def test_prometheus_reset_vs_ambiguous():
    a = _obs(0, 5000, 0)
    reset = _obs(1, 40, 1000, epoch=1)
    klass, _ = classify_decrease(a, reset)
    assert klass == "restart"
    amb = _obs(1, 2000, 1000, epoch=0)
    klass2, _ = classify_decrease(a, amb)
    assert klass2 == "ambiguous"
    pts = rates_for_series([a, amb], "rx_bytes", "eth0")
    assert pts[0].pilot_per_s is None
    assert pts[0].prom_per_s is not None  # Prometheus still assumes reset
    recovered = _obs(2, 6000, 2000)
    pts2 = rates_for_series([a, amb, recovered], "rx_bytes", "eth0")
    assert pts2[1].classification == "after_untrusted"
    assert pts2[1].pilot_per_s is None


def test_interval_uses_observation_time():
    a = counter("t", "s", "eth0", "rx_bytes", 0, 0, 5000, 0, 0, "a", unit="B")
    b = counter("t", "s", "eth0", "rx_bytes", 5000, 10_000, 15_000, 1, 0, "b", unit="B")
    pts = rates_for_series([a, b], "rx_bytes", "eth0")
    assert pts[0].interval_ms == 10_000
    assert abs(pts[0].pilot_per_s - 500.0) < 1e-9
    assert pts[0].naive_arrival_per_s is not None
    assert abs(pts[0].naive_arrival_per_s - (5000 / 10.0)) < 1e-9


def test_delay_uses_observation_not_arrival_clock():
    a = counter("t", "s", "eth0", "rx_bytes", 0, 0, 0, 0, 0, "a", unit="B")
    b = counter("t", "s", "eth0", "rx_bytes", 1000, 1000, 6000, 1, 0, "b", unit="B")
    pts = rates_for_series([a, b], "rx_bytes", "eth0")
    assert pts[0].interval_ms == 1000
    assert abs(pts[0].pilot_per_s - 1000.0) < 1e-9
    assert abs(pts[0].naive_arrival_per_s - (1000 / 6.0)) < 1e-9


def test_unsupported_is_not_zero():
    if linux_available():
        return
    rows = collect_linux("live", "local", 1, 0)
    assert rows
    assert all(r.collection_status == "unsupported" for r in rows)
    assert all(r.value is None for r in rows)
    assert any(r.metric == "rx_bytes" for r in rows)
    assert any(r.metric == "TcpRetransSegs" for r in rows)


def test_observations_have_no_condition_field():
    rows = quality_baseline(4)
    for r in rows:
        assert "condition" not in r.to_dict()


def test_pid_stat_and_cgroup_parse():
    text = "12 (python) " + " ".join(str(i) for i in range(14))
    assert parse_pid_stat_ticks(text) == 11 + 12
    parsed = parse_cgroup_cpu_stat("nr_periods 3\nnr_throttled 1\nthrottled_usec 9000\n")
    assert parsed["throttled_usec"] == 9000


def test_at_least_one_quality_alert_changes():
    cases = quality_cases()
    assert any(c["alert"]["conclusion_changed"] for c in cases)
    gaps = next(c for c in cases if c["id"] == "gaps")
    assert gaps["missing_rx_visible"] is True
    dups = next(c for c in cases if c["id"] == "duplicates")
    base = next(c for c in cases if c["id"] == "baseline")
    assert dups["n_raw"] > base["n_raw"]
    assert abs((dups["means"]["pilot"] or 0) - (base["means"]["pilot"] or 0)) < 1e-6


def test_proc_net_dev_parse_keeps_columns():
    text = (
        "Inter-|   Receive                                                |  Transmit\n"
        " face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed\n"
        "  eth0: 100 2 3 4 5 6 7 8 200 9 10 11 12 13 14 15\n"
    )
    parsed = parse_proc_net_dev(text)
    assert parsed["eth0"]["rx_errs"] == 3
    assert parsed["eth0"]["rx_drop"] == 4
    assert parsed["eth0"]["tx_colls"] == 13
    assert parsed["eth0"]["rx_errs"] != parsed["eth0"]["rx_drop"]


def test_snmp_tcp_parse():
    text = (
        "Ip: 1 2\n"
        "Tcp: RtoAlgorithm RtoMin InSegs OutSegs RetransSegs InErrs OutRsts\n"
        "Tcp: 1 200 10 11 12 13 14\n"
    )
    tcp = parse_proc_net_snmp_tcp(text)
    assert tcp["TcpRetransSegs"] == 12
    assert tcp["TcpInSegs"] == 10


def test_duckdb_reads_parquet(tmp_path):
    rows = quality_baseline(8)
    path = tmp_path / "obs.parquet"
    write_parquet(rows, path)
    got = duckdb_query(path, "SELECT COUNT(*) AS n FROM obs WHERE metric = 'rx_bytes'")
    assert got[0]["n"] == 8
