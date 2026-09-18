"""Controlled replay transforms. Original records are copied, not mutated."""

from __future__ import annotations

from typing import Iterable, Sequence

from .schema import Observation, missing


def clone(row: Observation, **kwargs) -> Observation:
    data = row.to_dict()
    data.update(kwargs)
    return Observation(**data)


def replay_identity(rows: Sequence[Observation]) -> list[Observation]:
    return [clone(r, transform="replay") for r in rows]


def deliver_twice(rows: Sequence[Observation], every_n: int = 5) -> list[Observation]:
    out: list[Observation] = []
    for i, r in enumerate(rows):
        out.append(clone(r, transform="none" if r.transform == "none" else r.transform))
        if i % every_n == 0 and r.collection_status == "ok":
            out.append(clone(r, arrival_time_ms=r.arrival_time_ms + 3, transform="duplicate"))
    return out


def out_of_order(rows: Sequence[Observation], swap_every: int = 7) -> list[Observation]:
    """Swap arrival times of consecutive scrapes within each metric series."""
    out = [clone(r) for r in rows]
    by_key: dict[tuple[str, str], list[int]] = {}
    for i, r in enumerate(out):
        by_key.setdefault((r.metric, r.interface), []).append(i)
    for idxs in by_key.values():
        j = 0
        while j + 1 < len(idxs):
            if j % swap_every == 0:
                i0, i1 = idxs[j], idxs[j + 1]
                a, b = out[i0], out[i1]
                out[i0] = clone(a, arrival_time_ms=b.arrival_time_ms, transform="reorder")
                out[i1] = clone(b, arrival_time_ms=a.arrival_time_ms, transform="reorder")
                j += 2
            else:
                j += 1
    return out


def insert_gaps(rows: Sequence[Observation], drop_seq: Iterable[int]) -> list[Observation]:
    drop = set(drop_seq)
    out: list[Observation] = []
    for r in rows:
        if r.scrape_seq in drop:
            out.append(missing(
                r.run_id, r.source_id, r.interface, r.metric,
                r.observation_time_ms, r.arrival_time_ms, r.scrape_seq,
                r.collector_epoch, r.source_ref, unit=r.unit, metric_type=r.metric_type,
            ))
        else:
            out.append(clone(r))
    return out


def delay_delivery(rows: Sequence[Observation], delay_ms: int = 4000) -> list[Observation]:
    out: list[Observation] = []
    for r in rows:
        if r.scrape_seq >= 8:
            out.append(clone(r, arrival_time_ms=r.arrival_time_ms + delay_ms, transform="delayed_delivery"))
        else:
            out.append(clone(r))
    return out


def restart_collector(rows: Sequence[Observation], at_seq: int = 10) -> list[Observation]:
    out: list[Observation] = []
    for r in rows:
        if r.scrape_seq >= at_seq and r.metric_type == "counter" and r.value is not None:
            # new epoch, counters restart near zero
            new_val = r.value % 17
            out.append(clone(
                r, collector_epoch=r.collector_epoch + 1, value=new_val,
                transform="collector_restart", notes="interface/collector recreate",
            ))
        else:
            out.append(clone(r))
    return out


def schema_unit_change(rows: Sequence[Observation], at_seq: int = 12) -> list[Observation]:
    out: list[Observation] = []
    for r in rows:
        if r.scrape_seq >= at_seq and r.metric == "rx_bytes" and r.value is not None:
            out.append(clone(r, unit="KiB", value=r.value / 1024.0, transform="unit_change",
                             notes="same metric name, unit changed without a new metric id"))
        else:
            out.append(clone(r))
    return out


def ambiguous_discontinuity(rows: Sequence[Observation], at_seq: int = 11) -> list[Observation]:
    out: list[Observation] = []
    for r in rows:
        if r.scrape_seq == at_seq and r.metric == "rx_bytes" and r.value is not None and r.value > 1000:
            out.append(clone(r, value=r.value * 0.4, transform="ambiguous_drop",
                             notes="decrease not near uint wrap and epoch unchanged"))
        else:
            out.append(clone(r))
    return out
