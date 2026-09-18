from __future__ import annotations

import argparse
from pathlib import Path

from .cases import build


def _default_out() -> str:
    return str(Path(__file__).resolve().parents[3] / "public" / "link")


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="linklab")
    sub = p.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("build-cases")
    b.add_argument("--out", default=_default_out())
    args = p.parse_args(argv)
    if args.cmd == "build-cases":
        print("wrote", build(args.out))
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
