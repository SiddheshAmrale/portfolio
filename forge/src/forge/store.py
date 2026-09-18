"""DuckDB OLAP queries over Parquet lakehouse tables — Credo/Databricks keyword."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import duckdb
import pyarrow as pa
import pyarrow.parquet as pq


def write_table(rows: list[dict[str, Any]], path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        table = pa.table({"_empty": pa.array([], type=pa.int32())})
    else:
        table = pa.Table.from_pylist(rows)
    pq.write_table(table, path)
    return path


def query_parquet(path: Path, sql: str) -> list[dict[str, Any]]:
    con = duckdb.connect()
    # DuckDB cannot bind path into FROM with prepared ? for read_parquet in all versions;
    # quote a posix path.
    posix = path.as_posix().replace("'", "''")
    q = sql.replace("{{path}}", "'" + posix + "'")
    cur = con.execute(q)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def gold_plan_totals(gold_parquet: Path) -> list[dict[str, Any]]:
    return query_parquet(
        gold_parquet,
        "SELECT plan, SUM(value) AS converts FROM read_parquet({{path}}) GROUP BY 1 ORDER BY 1",
    )


def dump_run_parquet(payload: dict[str, Any], out_dir: Path) -> dict[str, str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    paths = {}
    if payload.get("bronze"):
        paths["bronze"] = str(write_table(payload["bronze"], out_dir / "bronze.parquet"))
    if payload.get("silver_users"):
        paths["silver"] = str(write_table(payload["silver_users"], out_dir / "silver_users.parquet"))
    if payload.get("gold"):
        gpath = write_table(payload["gold"], out_dir / "gold.parquet")
        paths["gold"] = str(gpath)
        paths["gold_query"] = json.dumps(gold_plan_totals(gpath))
    return paths
