"""Build website JSON cases from the Python engines."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Sequence

from .evaluate import evaluate, intervention_cases
from .quality import missing_visible, rates_for_series
from .replay import (
    ambiguous_discontinuity,
    delay_delivery,
    deliver_twice,
    insert_gaps,
    out_of_order,
    restart_collector,
    schema_unit_change,
)
from .diagnosis import diagnose, naive_network_blame, time_to_detect
from .regression import analyze_aa, analyze_collector_change, analyze_deliberate_regression
from .schema import Observation
from .store import write_parquet
from .traces import condition_trace, quality_baseline
from . import linux


SOFTWARE = "pilot 0.2.1"


def _dump_rows(rows: Sequence[Observation], limit: int | None = None) -> list[dict[str, Any]]:
    data = [r.to_dict() for r in rows]
    return data if limit is None else data[:limit]


def _rate_dump(rows: Sequence[Observation], metric: str, interface: str) -> list[dict[str, Any]]:
    pts = rates_for_series(rows, metric, interface)
    return [
        {
            "t_obs_ms": p.t_obs_ms,
            "t_arr_ms": p.t_arr_ms,
            "interval_ms": p.interval_ms,
            "naive_per_s": p.naive_per_s,
            "naive_arrival_per_s": p.naive_arrival_per_s,
            "prom_per_s": p.prom_per_s,
            "pilot_per_s": p.pilot_per_s,
            "classification": p.classification,
            "detail": p.detail,
            "scrape_seq": p.scrape_seq,
        }
        for p in pts
    ]


def _alert(naive_vals: list[float | None], pilot_vals: list[float | None], threshold: float) -> dict[str, Any]:
    def fired(xs: list[float | None]) -> bool:
        return any(x is not None and abs(x) > threshold for x in xs)

    def peak(xs: list[float | None]) -> float | None:
        vals = [abs(x) for x in xs if x is not None]
        return max(vals) if vals else None

    return {
        "threshold_per_s": threshold,
        "naive_alert": fired(naive_vals),
        "pilot_alert": fired(pilot_vals),
        "naive_mean": _mean(naive_vals),
        "pilot_mean": _mean(pilot_vals),
        "naive_peak_abs": peak(naive_vals),
        "pilot_peak_abs": peak(pilot_vals),
        "conclusion_changed": fired(naive_vals) != fired(pilot_vals),
    }


def _mean(xs: list[float | None]) -> float | None:
    vals = [x for x in xs if x is not None]
    if not vals:
        return None
    return sum(vals) / len(vals)


def quality_cases() -> list[dict[str, Any]]:
    base = quality_baseline(20)
    orig_rx = _rate_dump(base, "rx_bytes", "eth0")
    key = {
        "rx_bytes", "rx_packets", "rx_errs", "rx_drop", "tx_bytes",
        "TcpRetransSegs", "TcpInSegs", "app_requests_total", "app_latency_ms",
        "proc_cpu_percent", "collector_lag_ms",
    }
    specs = [
        ("baseline", "Pinned healthy trace. Naive and pilot agree when the series is clean.", base),
        ("duplicates", "Replaying the same scrape must not inflate bytes/s.", deliver_twice(base, 3)),
        ("out_of_order", "Late/out-of-order arrivals keep observation_time for the interval.", out_of_order(base, 2)),
        ("gaps", "Dropped scrapes stay missing, not zero.", insert_gaps(base, [6, 7, 8])),
        ("late_samples_after_restart", "Delivery delay with preserved observation timestamps, plus a collector restart.", delay_delivery(restart_collector(base, 10), 5000)),
        ("unit_change", "Unit change without a new metric id is not a traffic spike.", schema_unit_change(base, 12)),
        ("ambiguous_discontinuity", "An unexplained counter drop is uncertain, not an invented rate.", ambiguous_discontinuity(base, 11)),
    ]
    cases = []
    for cid, question, rows in specs:
        rx = _rate_dump(rows, "rx_bytes", "eth0")
        naive_vals = [p["naive_per_s"] for p in rx]
        arrival_vals = [p["naive_arrival_per_s"] for p in rx]
        pilot_vals = [p["pilot_per_s"] for p in rx]
        naive_m = _mean(naive_vals)
        arrival_m = _mean(arrival_vals)
        pilot_m = _mean(pilot_vals)
        focused = [r for r in rows if r.metric in key]
        cases.append({
            "id": cid,
            "title": cid.replace("_", " "),
            "question": question,
            "software": SOFTWARE,
            "linux_proc_available": linux.linux_available(),
            "disclaimer": "Constructed Linux-semantics traces (no WSL/netem on this host). Prometheus already handles resets; the contribution is classifying wrap/restart/reorder/identity/ambiguous.",
            "reproduce": "python -m pilot reproduce " + cid,
            "original_rows": _dump_rows([r for r in base if r.metric in key]),
            "original_rates_rx_bytes": orig_rx,
            "rows": _dump_rows(focused),
            "rates_rx_bytes": rx,
            "missing_rx_visible": missing_visible(rows, "rx_bytes"),
            "alert": _alert(naive_vals, pilot_vals, 500_000),
            "means": {"naive_obs": naive_m, "naive_arrival": arrival_m, "pilot": pilot_m},
            "n_raw": len(rows),
            "n_unique_seq": len({(r.metric, r.scrape_seq, r.collector_epoch) for r in rows}),
            "withheld": sum(1 for p in rx if p["pilot_per_s"] is None),
        })
    return cases


def incident_cases() -> list[dict[str, Any]]:
    conditions = [
        ("healthy_high", "Healthy service under higher load"),
        ("delay", "Added delay (userspace model, not netem)"),
        ("loss", "Injected loss (userspace model, not optical BER)"),
        ("cpu", "Receiver CPU restriction (busy thread model, not cgroup)"),
        ("stale", "Interrupted telemetry"),
        ("mixed", "CPU restriction plus loss — should be insufficient evidence"),
    ]
    cases = []
    for cond, title in conditions:
        rows = condition_trace("inc-" + cond, cond, n=24, seed="inc-" + cond)
        d = diagnose(rows)
        cases.append({
            "id": cond,
            "blind_label": "Incident " + chr(65 + len(cases)),
            "title": title,
            "software": SOFTWARE,
            "disclaimer": "Software impairments and constructed Linux counters. Not SerDes/BER/FEC or optical degradation.",
            "reproduce": "python -m pilot reproduce incident:" + cond,
            "source": "constructed",
            "ground_truth": cond,
            "baseline_diagnosis": naive_network_blame(rows),
            "time_to_detect_seq": time_to_detect(rows),
            "diagnosis": {
                "label": d.label,
                "notes": d.notes,
                "evidence": [{"name": e.name, "present": e.present, "detail": e.detail} for e in d.evidence],
                "missing_evidence": d.missing_evidence,
            },
            "rows": _dump_rows(rows),
            "app_latency": [
                {"t": r.observation_time_ms, "v": r.value}
                for r in rows if r.metric == "app_latency_ms" and r.value is not None
            ],
            "cpu": [
                {"t": r.observation_time_ms, "v": r.value}
                for r in rows if r.metric == "proc_cpu_percent" and r.value is not None
            ],
            "retrans_rates": _rate_dump(rows, "TcpRetransSegs", "host"),
        })
    eval_ho = evaluate("held_out")
    eval_cal = evaluate("calibration")
    payload = {
        "id": "_eval",
        "title": "Held-out evaluation",
        "software": SOFTWARE,
        "held_out": {
            "n": eval_ho.n,
            "diagnosed_pct": eval_ho.diagnosed_pct,
            "accuracy_when_diagnosed": eval_ho.accuracy_when_diagnosed,
            "network_false_attr": eval_ho.network_false_attr,
            "missed_impaired": eval_ho.missed_impaired,
            "insufficient": eval_ho.insufficient,
            "rows": [r.__dict__ for r in eval_ho.rows],
        },
        "calibration": {
            "n": eval_cal.n,
            "accuracy_when_diagnosed": eval_cal.accuracy_when_diagnosed,
            "diagnosed_pct": eval_cal.diagnosed_pct,
        },
        "linux_eval": None,
        "linux_unconfirmed": 0,
        "interventions": intervention_cases(),
        "disclaimer": "Rules frozen on the calibration split. Ground truth is not an input to diagnose(). Constructed traces are fixtures. Live Linux runs, when present, are labeled linux-live.",
        "cases": cases,
    }
    return [payload]


def pack_linux_incidents(linux_dir: str | Path) -> dict[str, Any] | None:
    from .experiment import CONDITIONS, evaluate_linux_dir
    from .store import read_parquet

    root = Path(linux_dir)
    truth_path = root / "ground_truth.jsonl"
    if not truth_path.exists():
        return None
    by_cond: dict[str, list[dict[str, Any]]] = {}
    for line in truth_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        rec = json.loads(line)
        by_cond.setdefault(rec["condition"], []).append(rec)
    key = {
        "rx_bytes", "rx_packets", "rx_errs", "rx_drop", "tx_bytes",
        "TcpRetransSegs", "TcpInSegs", "app_requests_total", "app_latency_ms",
        "proc_cpu_percent", "collector_lag_ms", "cgroup_cpu_throttled_usec",
    }
    cases = []
    for cond in CONDITIONS:
        recs = by_cond.get(cond, [])
        chosen = next((r for r in recs if r.get("impairment_confirmed")), recs[0] if recs else None)
        if chosen is None:
            continue
        rows = read_parquet(root / "runs" / chosen["run_id"] / "obs.parquet")
        focused = [r for r in rows if r.metric in key]
        d = diagnose(focused if focused else rows)
        iface = next((r.interface for r in rows if r.metric == "rx_bytes" and r.interface not in ("lo", "app")), "eth0")
        cases.append({
            "id": "linux-" + cond,
            "blind_label": "Linux " + chr(65 + len(cases)),
            "title": "Live Linux: " + cond,
            "software": SOFTWARE,
            "source": "linux-live",
            "disclaimer": "Live Ubuntu netns+veth+netem+cgroup. Packets traverse a veth. Software packet loss is not optical BER/FEC. Injector label is not an input to diagnose().",
            "reproduce": "python -m pilot run-linux --out public/pilot/linux && python -m pilot eval-linux --dir public/pilot/linux",
            "ground_truth": cond,
            "impairment_confirmed": chosen.get("impairment_confirmed"),
            "confirm_detail": chosen.get("confirm_detail"),
            "baseline_diagnosis": naive_network_blame(rows),
            "time_to_detect_seq": time_to_detect(rows),
            "diagnosis": {
                "label": d.label,
                "notes": d.notes,
                "evidence": [{"name": e.name, "present": e.present, "detail": e.detail} for e in d.evidence],
                "missing_evidence": d.missing_evidence,
            },
            "rows": _dump_rows(focused),
            "app_latency": [
                {"t": r.observation_time_ms, "v": r.value}
                for r in rows if r.metric == "app_latency_ms" and r.value is not None
            ],
            "cpu": [
                {"t": r.observation_time_ms, "v": r.value}
                for r in rows if r.metric == "proc_cpu_percent" and r.value is not None
            ],
            "retrans_rates": _rate_dump(rows, "TcpRetransSegs", "host"),
            "rx_iface": iface,
        })
    ev = evaluate_linux_dir(root)
    unconfirmed = 0
    for line in truth_path.read_text(encoding="utf-8").splitlines():
        if line.strip() and not json.loads(line).get("impairment_confirmed", True):
            unconfirmed += 1
    return {
        "cases": cases,
        "eval": {
            "n": ev.n,
            "diagnosed_pct": ev.diagnosed_pct,
            "accuracy_when_diagnosed": ev.accuracy_when_diagnosed,
            "network_false_attr": ev.network_false_attr,
            "missed_impaired": ev.missed_impaired,
            "insufficient": ev.insufficient,
            "unconfirmed": unconfirmed,
            "rows": [r.__dict__ for r in ev.rows],
        },
    }


def regression_payload() -> dict[str, Any]:
    aa = analyze_aa()
    coll = analyze_collector_change()
    reg = analyze_deliberate_regression()

    def pack(c) -> dict[str, Any]:
        return {
            "primary_metric": c.primary_metric,
            "meaningful_delta": c.meaningful_delta,
            "decision": c.decision,
            "effect": c.effect,
            "detail": c.detail,
            "aa_false_alarm": c.aa_false_alarm,
            "a": c.a.__dict__,
            "b": c.b.__dict__,
        }

    return {
        "software": SOFTWARE,
        "disclaimer": "Repeated independent constructed runs. Not firmware. Primary metric declared before comparison.",
        "reproduce": "python -m pilot reproduce regression",
        "aa": pack(aa),
        "collector_naive_vs_pilot": pack(coll),
        "deliberate_regression": pack(reg),
    }


def build(out_dir: str | Path, linux_dir: str | Path | None = None) -> Path:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    linux_path = Path(linux_dir) if linux_dir else (out / "linux")
    q = quality_cases()
    inc = incident_cases()
    live = pack_linux_incidents(linux_path)
    if live and live["cases"]:
        constructed = inc[0]["cases"]
        for i, c in enumerate(constructed):
            c["blind_label"] = "Fixture " + chr(65 + i)
        inc[0]["cases"] = live["cases"] + constructed
        inc[0]["linux_eval"] = live["eval"]
        inc[0]["disclaimer"] = (
            "Live Linux cases first, then constructed fixtures. "
            "Rules frozen on the constructed calibration split. Ground truth is not an input to diagnose()."
        )
        q.append(_quality_from_linux(linux_path))
    q = [c for c in q if c]
    reg = regression_payload()
    index = {
        "software": SOFTWARE,
        "quality": [{"id": c["id"], "title": c["title"], "question": c["question"]} for c in q],
        "incident": [{"id": c["id"], "title": c["title"], "source": c.get("source", "constructed")} for c in inc[0]["cases"]],
        "linux": bool(live and live["cases"]),
        "reproduce": "pip install -e ./pilot && python -m pytest -q && python -m pilot run-linux && python -m pilot build-cases",
    }
    (out / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")
    (out / "quality.json").write_text(json.dumps(q, indent=2), encoding="utf-8")
    (out / "incident.json").write_text(json.dumps(inc[0], indent=2), encoding="utf-8")
    (out / "regression.json").write_text(json.dumps(reg, indent=2), encoding="utf-8")
    raw = quality_baseline(12)
    write_parquet(raw, out / "raw_quality_baseline.parquet")
    return out


def _quality_from_linux(linux_dir: Path) -> dict[str, Any] | None:
    from .store import read_parquet

    root = Path(linux_dir)
    healthy = None
    truth = root / "ground_truth.jsonl"
    if not truth.exists():
        return None
    for line in truth.read_text(encoding="utf-8").splitlines():
        rec = json.loads(line)
        if rec.get("condition") == "healthy":
            healthy = rec["run_id"]
            break
    if not healthy:
        return None
    rows = read_parquet(root / "runs" / healthy / "obs.parquet")
    iface = next((r.interface for r in rows if r.metric == "rx_bytes" and r.interface not in ("lo", "app", "eth0")), None)
    if iface is None:
        iface = next((r.interface for r in rows if r.metric == "rx_bytes" and r.interface != "lo"), "eth0")
    focused = [r for r in rows if r.metric in ("rx_bytes", "rx_drop", "rx_errs", "TcpRetransSegs", "app_latency_ms", "proc_cpu_percent")]
    rx = _rate_dump(rows, "rx_bytes", iface)
    naive_vals = [p["naive_per_s"] for p in rx]
    arrival_vals = [p["naive_arrival_per_s"] for p in rx]
    pilot_vals = [p["pilot_per_s"] for p in rx]
    return {
        "id": "linux_live_healthy",
        "title": "linux live healthy",
        "question": "Real /proc/<server-pid>/net/dev and TcpRetransSegs from a live Ubuntu netns+veth workload.",
        "software": SOFTWARE,
        "linux_proc_available": True,
        "disclaimer": "Live Linux collection from the server netns. Columns are not collapsed. This is not netem-impaired.",
        "reproduce": "python -m pilot run-linux",
        "original_rows": _dump_rows(focused),
        "original_rates_rx_bytes": rx,
        "rows": _dump_rows(focused),
        "rates_rx_bytes": rx,
        "missing_rx_visible": missing_visible(rows, "rx_bytes"),
        "alert": _alert(naive_vals, pilot_vals, 500_000),
        "means": {"naive_obs": _mean(naive_vals), "naive_arrival": _mean(arrival_vals), "pilot": _mean(pilot_vals)},
        "n_raw": len(rows),
        "n_unique_seq": len({(r.metric, r.scrape_seq, r.collector_epoch) for r in rows}),
        "withheld": sum(1 for p in rx if p["pilot_per_s"] is None),
        "source": "linux-live",
        "rx_iface": iface,
    }
