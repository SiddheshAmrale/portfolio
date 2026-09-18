"""Parquet + DuckDB store. Raw records are never overwritten."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Iterable, Sequence

from .schema import Observation


def records_to_rows(records: Sequence[Observation]) -> list[dict[str, Any]]:
    return [r.to_dict() for r in records]


def write_parquet(records: Sequence[Observation], path: str | Path) -> Path:
    import pyarrow as pa
    import pyarrow.parquet as pq

    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    table = pa.Table.from_pylist(records_to_rows(records))
    pq.write_table(table, path)
    return path


def read_parquet(path: str | Path) -> list[Observation]:
    import pyarrow.parquet as pq
    from dataclasses import fields, MISSING

    table = pq.read_table(path)
    out: list[Observation] = []
    for rec in table.to_pylist():
        kwargs = {}
        for f in fields(Observation):
            if f.name in rec:
                kwargs[f.name] = rec[f.name]
            elif f.default is not MISSING:
                kwargs[f.name] = f.default
        out.append(Observation(**kwargs))
    return out


def duckdb_query(parquet_path: str | Path, sql: str) -> list[dict[str, Any]]:
    import duckdb

    con = duckdb.connect(database=":memory:")
    path = Path(parquet_path).resolve().as_posix().replace("'", "''")
    con.execute("CREATE VIEW obs AS SELECT * FROM read_parquet('" + path + "')")
    cur = con.execute(sql)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]
