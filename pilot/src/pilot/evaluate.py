"""Evaluation of frozen diagnosis rules. Ground truth is applied only here."""

from __future__ import annotations

from dataclasses import dataclass

from .diagnosis import action_helped, diagnose, predicted_action
from .traces import condition_trace, intervention_trace

CALIBRATION = [
    ("cal-h1", "healthy_high"),
    ("cal-h2", "healthy_high"),
    ("cal-d1", "delay"),
    ("cal-l1", "loss"),
    ("cal-c1", "cpu"),
    ("cal-s1", "stale"),
]

HELD_OUT = [
    ("ho-h1", "healthy_high"),
    ("ho-d1", "delay"),
    ("ho-d2", "delay"),
    ("ho-l1", "loss"),
    ("ho-l2", "loss"),
    ("ho-c1", "cpu"),
    ("ho-c2", "cpu"),
    ("ho-s1", "stale"),
    ("ho-m1", "mixed"),
]


@dataclass
class EvalRow:
    run_id: str
    truth: str
    predicted: str
    split: str


@dataclass
class EvalReport:
    rows: list[EvalRow]
    diagnosed_pct: float
    accuracy_when_diagnosed: float
    network_false_attr: int
    missed_impaired: int
    insufficient: int
    n: int


def _map_truth(condition: str) -> str:
    if condition in ("healthy", "healthy_high"):
        return "healthy"
    if condition == "delay":
        return "network_delay"
    if condition == "loss":
        return "network_loss"
    if condition == "cpu":
        return "receiver_cpu"
    if condition in ("stale", "mixed"):
        return "insufficient_evidence"
    return condition


def evaluate(split: str = "held_out") -> EvalReport:
    pairs = HELD_OUT if split == "held_out" else CALIBRATION
    rows: list[EvalRow] = []
    for run_id, cond in pairs:
        obs = condition_trace(run_id, cond, n=24, seed=run_id)
        pred = diagnose(obs).label
        rows.append(EvalRow(run_id, _map_truth(cond), pred, split))
    n = len(rows)
    insufficient = sum(1 for r in rows if r.predicted == "insufficient_evidence")
    diagnosed = [r for r in rows if r.predicted != "insufficient_evidence"]
    correct = [r for r in diagnosed if r.predicted == r.truth]
    network_false = sum(
        1 for r in rows
        if r.truth in ("receiver_cpu", "healthy") and r.predicted in ("network_loss", "network_delay")
    )
    missed = sum(
        1 for r in rows
        if r.truth in ("network_loss", "network_delay", "receiver_cpu") and r.predicted == "healthy"
    )
    return EvalReport(
        rows=rows,
        diagnosed_pct=(len(diagnosed) / n) if n else 0.0,
        accuracy_when_diagnosed=(len(correct) / len(diagnosed)) if diagnosed else 0.0,
        network_false_attr=network_false,
        missed_impaired=missed,
        insufficient=insufficient,
        n=n,
    )


def intervention_cases() -> list[dict]:
    out = []
    for cond, good, bad in (
        ("cpu", "restore_cpu", "remove_delay"),
        ("loss", "remove_loss", "restore_cpu"),
        ("delay", "remove_delay", "restore_cpu"),
    ):
        rows_good = intervention_trace("iv-" + cond + "-good", cond, good)
        rows_bad = intervention_trace("iv-" + cond + "-bad", cond, bad)
        before = [r for r in rows_good if r.scrape_seq < 14]
        after_good = [r for r in rows_good if r.scrape_seq >= 14]
        after_bad = [r for r in rows_bad if r.scrape_seq >= 14]
        pred = diagnose(before)
        def lat(rs):
            return [
                {"t": r.observation_time_ms, "v": r.value, "seq": r.scrape_seq}
                for r in rs if r.metric == "app_latency_ms" and r.value is not None
            ]
        out.append({
            "condition": cond,
            "predicted": pred.label,
            "predicted_action": predicted_action(pred.label),
            "correct_action": good,
            "correct_action_helped": action_helped(before, after_good),
            "wrong_action": bad,
            "wrong_action_helped": action_helped(before, after_bad),
            "latency_correct": lat(rows_good),
            "latency_wrong": lat(rows_bad),
        })
    return out
