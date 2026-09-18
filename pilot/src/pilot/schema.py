"""Observation schema. Linux metric names are kept distinct; errors are never collapsed."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Optional

# /proc/net/dev columns. Do not sum rx_errs+rx_drop+rx_frame into one "errors" series.
PROC_NET_DEV = (
    "rx_bytes",
    "rx_packets",
    "rx_errs",
    "rx_drop",
    "rx_fifo",
    "rx_frame",
    "rx_compressed",
    "rx_multicast",
    "tx_bytes",
    "tx_packets",
    "tx_errs",
    "tx_drop",
    "tx_fifo",
    "tx_colls",
    "tx_carrier",
    "tx_compressed",
)

# /proc/net/snmp Tcp: — not the same thing as /proc/net/dev rx_errs.
PROC_NET_SNMP_TCP = (
    "TcpInSegs",
    "TcpOutSegs",
    "TcpRetransSegs",
    "TcpInErrs",
    "TcpEstabResets",
    "TcpAttemptFails",
)

COUNTER_METRICS = set(PROC_NET_DEV) | set(PROC_NET_SNMP_TCP) | {
    "app_requests_total",
    "app_timeouts_total",
    "app_bytes_total",
    "cgroup_cpu_throttled_usec",
}

GAUGE_METRICS = {
    "app_latency_ms",
    "proc_cpu_percent",
    "proc_rss_bytes",
    "collector_lag_ms",
    "cgroup_cpu_throttled_ratio",
}


@dataclass(frozen=True)
class Observation:
    run_id: str
    source_id: str
    interface: str
    metric: str
    value: Optional[float]
    unit: str
    metric_type: str  # counter | gauge | status
    observation_time_ms: int
    arrival_time_ms: int
    scrape_seq: int
    collector_epoch: int
    collection_status: str  # ok | missing | unsupported | failed
    source_ref: str
    transform: str = "none"
    notes: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def counter(run_id: str, source_id: str, interface: str, metric: str, value: float,
            t_obs: int, t_arr: int, seq: int, epoch: int, source_ref: str,
            unit: str = "1", transform: str = "none") -> Observation:
    return Observation(
        run_id=run_id, source_id=source_id, interface=interface, metric=metric,
        value=value, unit=unit, metric_type="counter",
        observation_time_ms=t_obs, arrival_time_ms=t_arr, scrape_seq=seq,
        collector_epoch=epoch, collection_status="ok", source_ref=source_ref,
        transform=transform,
    )


def gauge(run_id: str, source_id: str, interface: str, metric: str, value: float,
          t_obs: int, t_arr: int, seq: int, epoch: int, source_ref: str,
          unit: str, transform: str = "none") -> Observation:
    return Observation(
        run_id=run_id, source_id=source_id, interface=interface, metric=metric,
        value=value, unit=unit, metric_type="gauge",
        observation_time_ms=t_obs, arrival_time_ms=t_arr, scrape_seq=seq,
        collector_epoch=epoch, collection_status="ok", source_ref=source_ref,
        transform=transform,
    )


def missing(run_id: str, source_id: str, interface: str, metric: str,
            t_obs: int, t_arr: int, seq: int, epoch: int, source_ref: str,
            unit: str = "1", metric_type: str = "counter") -> Observation:
    return Observation(
        run_id=run_id, source_id=source_id, interface=interface, metric=metric,
        value=None, unit=unit, metric_type=metric_type,
        observation_time_ms=t_obs, arrival_time_ms=t_arr, scrape_seq=seq,
        collector_epoch=epoch, collection_status="missing", source_ref=source_ref,
        transform="gap",
    )
