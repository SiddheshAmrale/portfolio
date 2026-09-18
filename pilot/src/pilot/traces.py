"""Constructed Linux-semantics traces.

The build host is Windows without WSL, so these are not netem/cgroup captures.
Counters use documented Linux names and wrap/reset rules. Application and host
series are generated from the same pinned seed as the network series so the
three perspectives stay internally consistent. Live HTTP bursts are recorded
separately when requested.
"""

from __future__ import annotations

import hashlib
from typing import Sequence

from .schema import Observation, counter, gauge, missing


def _rng(seed: str) -> callable:
    h = hashlib.sha256(seed.encode("utf-8")).digest()
    state = int.from_bytes(h[:8], "little") or 1

    def rnd() -> float:
        nonlocal state
        state = (1103515245 * state + 12345) & 0x7FFFFFFF
        return state / 0x7FFFFFFF

    return rnd


def _base_counters(seq: int) -> dict[str, float]:
    # monotonically increasing Linux-shaped counters
    t = seq
    return {
        "rx_bytes": 8_000_000 + t * 120_000,
        "rx_packets": 12_000 + t * 180,
        "rx_errs": 2,
        "rx_drop": 0,
        "rx_fifo": 0,
        "rx_frame": 0,
        "rx_compressed": 0,
        "rx_multicast": 40 + t,
        "tx_bytes": 5_000_000 + t * 90_000,
        "tx_packets": 10_000 + t * 150,
        "tx_errs": 0,
        "tx_drop": 0,
        "tx_fifo": 0,
        "tx_colls": 0,
        "tx_carrier": 0,
        "tx_compressed": 0,
        "TcpInSegs": 20_000 + t * 200,
        "TcpOutSegs": 19_000 + t * 190,
        "TcpRetransSegs": 40,
        "TcpInErrs": 0,
        "TcpEstabResets": 1,
        "TcpAttemptFails": 0,
        "app_requests_total": t * 20,
        "app_timeouts_total": 0,
        "app_bytes_total": t * 40_000,
    }


def healthy_trace(run_id: str, n: int = 24, seed: str = "healthy") -> list[Observation]:
    rnd = _rng(seed)
    rows: list[Observation] = []
    for seq in range(n):
        t = 1_000_000 + seq * 1000
        c = _base_counters(seq)
        cpu = 12 + rnd() * 8
        lat = 18 + rnd() * 6
        rows.extend(_emit(run_id, "nic0", "eth0", seq, 0, t, t + int(rnd() * 8), c, cpu, lat))
    return rows


def _emit(run_id: str, source: str, iface: str, seq: int, epoch: int, t_obs: int, t_arr: int,
          counters: dict[str, float], cpu: float, lat: float) -> list[Observation]:
    ref = "constructed:" + run_id + ":seq" + str(seq)
    rows: list[Observation] = []
    for metric, value in counters.items():
        unit = "B" if "bytes" in metric.lower() or metric.endswith("bytes") else "1"
        if metric.startswith("Tcp"):
            unit = "seg"
            iface_m = "host"
        elif metric.startswith("app_"):
            unit = "ms" if "latency" in metric else ("B" if "bytes" in metric else "1")
            iface_m = "app"
        else:
            iface_m = iface
        rows.append(counter(run_id, source, iface_m, metric, value, t_obs, t_arr, seq, epoch, ref, unit=unit))
    rows.append(gauge(run_id, source, "proc", "proc_cpu_percent", cpu, t_obs, t_arr, seq, epoch, ref, unit="%"))
    rows.append(gauge(run_id, source, "app", "app_latency_ms", lat, t_obs, t_arr, seq, epoch, ref, unit="ms"))
    rows.append(gauge(run_id, source, "collector", "collector_lag_ms", float(t_arr - t_obs), t_obs, t_arr, seq, epoch, ref, unit="ms"))
    return rows


def condition_trace(run_id: str, condition: str, n: int = 24, seed: str = "") -> list[Observation]:
    """Ground-truth condition is metadata for evaluation only — not attached to observations."""
    rnd = _rng(seed or (run_id + condition))
    rows: list[Observation] = []
    retrans = 40.0
    timeouts = 0.0
    for seq in range(n):
        t = 1_700_000 + seq * 1000
        c = _base_counters(seq)
        cpu = 14 + rnd() * 6
        lat = 20 + rnd() * 5
        lag = int(rnd() * 10)
        if condition == "delay" and seq >= 6:
            lat = 110 + rnd() * 20
        elif condition == "loss" and seq >= 6:
            retrans += 8 + rnd() * 6
            timeouts += 1
            lat = 80 + rnd() * 40
            c["rx_drop"] = 3 + seq
        elif condition == "cpu" and seq >= 6:
            cpu = 92 + rnd() * 6
            lat = 95 + rnd() * 25
        elif condition == "stale" and seq >= 6:
            lat = 100 + rnd() * 20
            lag = 5000 + seq * 200
        elif condition == "mixed" and seq >= 6:
            cpu = 88 + rnd() * 8
            lat = 120 + rnd() * 20
            retrans += 5
        elif condition == "healthy_high":
            c["rx_bytes"] = 8_000_000 + seq * 400_000
            lat = 22 + rnd() * 8
            cpu = 28 + rnd() * 10
        c["TcpRetransSegs"] = retrans
        c["app_timeouts_total"] = timeouts
        t_arr = t + lag
        rows.extend(_emit(run_id, "nic0", "eth0", seq, 0, t, t_arr, c, cpu, lat))
        if condition == "stale" and seq in (9, 10, 11):
            # replace network counters with missing; keep app gauges
            rows = [r for r in rows if not (r.scrape_seq == seq and r.metric in ("rx_bytes", "TcpRetransSegs"))]
            rows.append(missing(run_id, "nic0", "eth0", "rx_bytes", t, t_arr, seq, 0, "constructed:gap", unit="B"))
            rows.append(missing(run_id, "nic0", "host", "TcpRetransSegs", t, t_arr, seq, 0, "constructed:gap", unit="seg"))
    return rows


def intervention_trace(run_id: str, condition: str, action: str, n: int = 24) -> list[Observation]:
    """Phase 0-11 impaired, 12-end after an action. Action may be correct or a no-op."""
    rnd = _rng(run_id + condition + action)
    rows: list[Observation] = []
    retrans = 40.0
    for seq in range(n):
        t = 2_000_000 + seq * 1000
        c = _base_counters(seq)
        cpu = 14 + rnd() * 5
        lat = 20 + rnd() * 5
        impaired = seq >= 6
        repaired = seq >= 14
        if impaired and not repaired:
            if condition == "cpu":
                cpu, lat = 93, 100
            elif condition == "loss":
                retrans += 10
                lat = 90
            elif condition == "delay":
                lat = 120
        if repaired:
            helps = (
                (condition == "cpu" and action == "restore_cpu")
                or (condition == "loss" and action == "remove_loss")
                or (condition == "delay" and action == "remove_delay")
            )
            if helps:
                cpu, lat = 16, 22
            else:
                # wrong intervention: keep the impairment
                if condition == "cpu":
                    cpu, lat = 92, 98
                elif condition == "loss":
                    retrans += 8
                    lat = 88
                elif condition == "delay":
                    lat = 118
        c["TcpRetransSegs"] = retrans
        rows.extend(_emit(run_id, "nic0", "eth0", seq, 0, t, t + 4, c, cpu, lat))
    return rows


def quality_baseline(n: int = 20) -> list[Observation]:
    return healthy_trace("quality-base", n=n, seed="quality-base")
