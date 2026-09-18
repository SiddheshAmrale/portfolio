"""Linux /proc collector. Used when the files exist; otherwise metrics are marked unsupported."""

from __future__ import annotations

import os
import time
from typing import Optional

from .schema import Observation, PROC_NET_DEV, PROC_NET_SNMP_TCP

PROC_NET_DEV_PATH = "/proc/net/dev"
PROC_NET_SNMP_PATH = "/proc/net/snmp"
PROC_STAT_PATH = "/proc/stat"


def linux_available() -> bool:
    return os.path.exists(PROC_NET_DEV_PATH) and os.path.exists(PROC_NET_SNMP_PATH)


def _now_ms() -> int:
    return int(time.time() * 1000)


def clk_tck() -> int:
    try:
        return int(os.sysconf("SC_CLK_TCK"))
    except (ValueError, OSError, AttributeError):
        return 100


def parse_pid_stat_ticks(text: str) -> int:
    """utime+stime ticks from /proc/<pid>/stat (fields 14 and 15)."""
    rest = text[text.rfind(")") + 1 :].split()
    return int(rest[11]) + int(rest[12])


def read_pid_ticks(pid: int) -> int | None:
    path = "/proc/" + str(pid) + "/stat"
    try:
        with open(path, "r", encoding="utf-8") as f:
            return parse_pid_stat_ticks(f.read())
    except OSError:
        return None


def read_pid_rss_bytes(pid: int) -> int | None:
    path = "/proc/" + str(pid) + "/statm"
    try:
        with open(path, "r", encoding="utf-8") as f:
            pages = int(f.read().split()[1])
        return pages * os.sysconf("SC_PAGE_SIZE")
    except (OSError, ValueError, IndexError):
        return None


def parse_cgroup_cpu_stat(text: str) -> dict[str, int]:
    out: dict[str, int] = {}
    for line in text.splitlines():
        parts = line.split()
        if len(parts) == 2 and parts[1].isdigit():
            out[parts[0]] = int(parts[1])
    return out


def read_cgroup_throttled_usec(cgroup_dir: str) -> int | None:
    path = os.path.join(cgroup_dir, "cpu.stat")
    try:
        with open(path, "r", encoding="utf-8") as f:
            parsed = parse_cgroup_cpu_stat(f.read())
        if "throttled_usec" in parsed:
            return parsed["throttled_usec"]
        # cgroup v1: nr_throttled / throttled_time (ns)
        if "throttled_time" in parsed:
            return parsed["throttled_time"] // 1000
    except OSError:
        return None
    return None


def parse_proc_net_dev(text: str) -> dict[str, dict[str, int]]:
    lines = text.strip().splitlines()
    out: dict[str, dict[str, int]] = {}
    for line in lines[2:]:
        if ":" not in line:
            continue
        name, rest = line.split(":", 1)
        iface = name.strip()
        parts = rest.split()
        if len(parts) < 16:
            continue
        vals = [int(p) for p in parts[:16]]
        out[iface] = dict(zip(PROC_NET_DEV, vals))
    return out


def parse_proc_net_snmp_tcp(text: str) -> dict[str, int]:
    lines = text.strip().splitlines()
    keys: Optional[list[str]] = None
    vals: Optional[list[int]] = None
    for line in lines:
        if not line.startswith("Tcp:"):
            continue
        fields = line.split()[1:]
        if keys is None:
            keys = fields
        else:
            vals = [int(x) for x in fields]
    if not keys or not vals:
        return {}
    raw = dict(zip(keys, vals))
    wanted = {}
    for name in PROC_NET_SNMP_TCP:
        short = name[3:] if name.startswith("Tcp") else name
        if name in raw:
            wanted[name] = raw[name]
        elif short in raw:
            wanted[name] = raw[short]
    return wanted


def collect_linux(run_id: str, source_id: str, seq: int, epoch: int) -> list[Observation]:
    t_obs = _now_ms()
    t_arr = t_obs
    rows: list[Observation] = []
    if not linux_available():
        for metric in PROC_NET_DEV:
            unit = "B" if metric.endswith("bytes") else "pkt"
            rows.append(Observation(
                run_id=run_id, source_id=source_id, interface="eth0",
                metric=metric, value=None, unit=unit, metric_type="counter",
                observation_time_ms=t_obs, arrival_time_ms=t_arr, scrape_seq=seq,
                collector_epoch=epoch, collection_status="unsupported",
                source_ref="linux:" + PROC_NET_DEV_PATH + "#eth0." + metric,
                notes="host has no /proc/net/dev; not recorded as zero",
            ))
        for metric in PROC_NET_SNMP_TCP:
            rows.append(Observation(
                run_id=run_id, source_id=source_id, interface="host",
                metric=metric, value=None, unit="seg", metric_type="counter",
                observation_time_ms=t_obs, arrival_time_ms=t_arr, scrape_seq=seq,
                collector_epoch=epoch, collection_status="unsupported",
                source_ref="linux:" + PROC_NET_SNMP_PATH,
                notes="host has no /proc/net/snmp; not recorded as zero",
            ))
        for metric, unit in (("proc_cpu_percent", "%"), ("collector_lag_ms", "ms"), ("app_latency_ms", "ms")):
            mtype = "gauge"
            rows.append(Observation(
                run_id=run_id, source_id=source_id, interface="collector",
                metric=metric, value=None, unit=unit, metric_type=mtype,
                observation_time_ms=t_obs, arrival_time_ms=t_arr, scrape_seq=seq,
                collector_epoch=epoch, collection_status="unsupported",
                source_ref="linux:/proc",
                notes="Linux process/cgroup and app scrapes are unavailable on this host",
            ))
        return rows

    with open(PROC_NET_DEV_PATH, "r", encoding="utf-8") as f:
        dev = parse_proc_net_dev(f.read())
    for iface, metrics in dev.items():
        for metric, value in metrics.items():
            unit = "B" if metric.endswith("bytes") else "pkt"
            rows.append(Observation(
                run_id=run_id, source_id=source_id, interface=iface,
                metric=metric, value=float(value), unit=unit, metric_type="counter",
                observation_time_ms=t_obs, arrival_time_ms=t_arr, scrape_seq=seq,
                collector_epoch=epoch, collection_status="ok",
                source_ref="linux:" + PROC_NET_DEV_PATH + "#" + iface + "." + metric,
            ))

    with open(PROC_NET_SNMP_PATH, "r", encoding="utf-8") as f:
        tcp = parse_proc_net_snmp_tcp(f.read())
    for metric, value in tcp.items():
        rows.append(Observation(
            run_id=run_id, source_id=source_id, interface="host",
            metric=metric, value=float(value), unit="seg", metric_type="counter",
            observation_time_ms=t_obs, arrival_time_ms=t_arr, scrape_seq=seq,
            collector_epoch=epoch, collection_status="ok",
            source_ref="linux:" + PROC_NET_SNMP_PATH + "#" + metric,
        ))
    return rows
