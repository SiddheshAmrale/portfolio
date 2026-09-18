# Forge

Lakehouse data engineering package aimed at **Databricks / Netflix-style** hiring themes: medallion Bronze→Silver→Gold, CDC/SCD2, late-arriving facts, data contracts, quality expectations, freshness SLAs, and experiment allocation pipelines.

This is **not** a Databricks cluster or Netflix production platform. It is runnable Python + DuckDB + Parquet that demonstrates the same failure modes and invariants those roles care about.

```bash
pip install -e "./forge[dev]"
python -m pytest -q
python -m forge build-cases --out public/forge
```

## Keywords mapped

| Posting theme | Forge demonstration |
|---|---|
| Medallion / Delta Lake | Append-only bronze, cleansed silver, curated gold |
| CDC / APPLY CHANGES | SCD2 dimensions with valid_from / valid_to |
| Late-arriving data | Watermark vs arrival; gold recomputes when late facts appear |
| Data contracts | Schema + null + uniqueness + range expectations |
| Netflix experiments | Allocation events → silver enrollment → gold metrics with health checks |
| Observability | Pipeline run report: rows in/out, rejects, freshness lag |

Software packet-loss analogies and optical BER are **out of scope** here — see the Link Integrity lab.
