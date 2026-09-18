from __future__ import annotations

import argparse
import json
from pathlib import Path

from .cases import build


def _default_out() -> str:
    return str(Path(__file__).resolve().parents[3] / "public" / "forge")


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="forge", description="Lakehouse DE cases")
    sub = p.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("build-cases")
    b.add_argument("--out", default=_default_out())
    args = p.parse_args(argv)
    if args.cmd == "build-cases":
        out = build(args.out)
        print("wrote", out)
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
