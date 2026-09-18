from __future__ import annotations

import argparse
import json
from pathlib import Path

from . import linux
from .cases import build
from .evaluate import evaluate
from .linux import collect_linux


def _default_linux_out() -> str:
    return str(Path(__file__).resolve().parents[3] / "public" / "pilot" / "linux")


def _default_web_out() -> str:
    return str(Path(__file__).resolve().parents[3] / "public" / "pilot")


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="pilot", description="Telemetry quality + incident diagnosis + regression")
    sub = p.add_subparsers(dest="cmd", required=True)

    b = sub.add_parser("build-cases", help="Write website JSON from pinned Python experiments")
    b.add_argument("--out", default=_default_web_out())
    b.add_argument("--linux", default=None, help="Directory of live Linux runs (ground_truth.jsonl)")

    sub.add_parser("eval", help="Print constructed held-out diagnosis evaluation")
    sub.add_parser("linux-check", help="Show whether /proc Linux collectors are available")

    r = sub.add_parser("reproduce", help="Print a case id's reproduction command")
    r.add_argument("case_id")

    c = sub.add_parser("collect-once", help="One live scrape (Linux /proc if present)")
    c.add_argument("--run-id", default="live")

    rl = sub.add_parser("run-linux", help="Live veth+netem+cgroup experiments (Linux only)")
    rl.add_argument("--out", default=_default_linux_out())
    rl.add_argument("--repeats", type=int, default=2)
    rl.add_argument("--duration", type=float, default=7.0)
    rl.add_argument("--seed", type=int, default=7)

    el = sub.add_parser("eval-linux", help="Evaluate frozen rules on live Linux runs")
    el.add_argument("--dir", default=_default_linux_out())

    args = p.parse_args(argv)

    if args.cmd == "build-cases":
        out = build(args.out, linux_dir=args.linux)
        print("wrote", out)
        return 0
    if args.cmd == "eval":
        rep = evaluate("held_out")
        print(json.dumps({
            "n": rep.n,
            "diagnosed_pct": rep.diagnosed_pct,
            "accuracy_when_diagnosed": rep.accuracy_when_diagnosed,
            "network_false_attr": rep.network_false_attr,
            "missed_impaired": rep.missed_impaired,
            "insufficient": rep.insufficient,
            "rows": [x.__dict__ for x in rep.rows],
        }, indent=2))
        return 0
    if args.cmd == "linux-check":
        print("linux_proc_available", linux.linux_available())
        return 0
    if args.cmd == "reproduce":
        print("pip install -e ./pilot")
        print("python -m pytest -q")
        print("python -m pilot run-linux --out public/pilot/linux")
        print("python -m pilot eval-linux --dir public/pilot/linux")
        print("python -m pilot build-cases --out public/pilot")
        print("case:", args.case_id)
        print("Pinned software: pilot 0.2.1. Constructed fixtures plus live Linux when /proc exists.")
        return 0
    if args.cmd == "collect-once":
        rows = collect_linux(args.run_id, "local", 1, 0)
        print(json.dumps([r.to_dict() for r in rows[:12]], indent=2))
        print("n", len(rows))
        return 0
    if args.cmd == "run-linux":
        from .experiment import run_linux_suite
        out = run_linux_suite(args.out, repeats=args.repeats, seed=args.seed, duration_s=args.duration)
        print("wrote", out)
        return 0
    if args.cmd == "eval-linux":
        from .experiment import evaluate_linux_dir
        rep = evaluate_linux_dir(args.dir)
        print(json.dumps({
            "n": rep.n,
            "diagnosed_pct": rep.diagnosed_pct,
            "accuracy_when_diagnosed": rep.accuracy_when_diagnosed,
            "network_false_attr": rep.network_false_attr,
            "missed_impaired": rep.missed_impaired,
            "insufficient": rep.insufficient,
            "rows": [x.__dict__ for x in rep.rows],
        }, indent=2))
        return 0
    return 1
