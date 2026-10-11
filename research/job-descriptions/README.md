# Job descriptions: Data Engineer and Forward Deployed Engineer

Snapshot of current U.S. LinkedIn postings, collected **11 October 2026** from
LinkedIn's public job search.

| File | Contents |
|---|---|
| [`2026-10-11-data-engineer.md`](2026-10-11-data-engineer.md) | 11 Data Engineer postings (posted within the past week) |
| [`2026-10-11-forward-deployed-engineer.md`](2026-10-11-forward-deployed-engineer.md) | 12 Forward Deployed Engineer postings (posted within the past month) |
| [`2026-10-11-jobs.json`](2026-10-11-jobs.json) | The same 23 postings as structured data |

## How this was collected

- Searches: `Data Engineer` (United States, past week; LinkedIn showed 10,000+
  results) and `"Forward Deployed Engineer"` (United States, past month). The
  first page of results was sampled, one posting per company, to cover a
  spread of employers rather than repeats.
- Each posting was opened and its description read. One Data Engineer posting
  (Zefr) could not be read: LinkedIn showed a sign-in wall.
- **Descriptions are summarised in my own words, not copied.** They belong to
  the employers; follow the link in each entry for the full text. Salary,
  experience, sponsorship and clearance terms are recorded as stated.
- "Not stated" means the posting text did not mention it, not that the answer
  is yes.
- Postings change or close quickly; treat this as a dated snapshot.

## Key takeaways

**Work authorisation matters more than any skill gap.** Several postings exclude
H-1B holders outright:

- *No sponsorship, stated explicitly:* Deloitte (both roles), Travelers.
- *U.S. person / clearance required (export control or government work):*
  Nominal, Analog Devices, Deloitte (Secret clearance for the Data Engineer III
  role; clearance-eligible for the Palantir FDE role).
- *Sponsorship possible:* Domino Data Lab (H-1B "may be available", case by
  case) and Closr (visa transfer for select roles).
- *Not stated:* most others. Ask early.

**Data Engineer: what employers want**

- Batch and streaming/near-real-time pipelines, with data quality, lineage,
  monitoring and incident handling treated as part of the job.
- Spark / PySpark (6 of 11) and Databricks (5 of 11) dominate, most often on
  AWS (5 of 11); Azure and GCP appear as single-platform roles.
- Dimensional modelling (star schemas, slowly changing dimensions) and the
  medallion Bronze/Silver/Gold pattern are named directly.
- dbt and Airflow recur; Kafka / Kinesis for streaming.
- Data engineering *for AI* is spreading: Deloitte, AWS, Travelers and
  Amazon Game Studios all frame the role as feeding ML / GenAI.
- Stated pay: **$62K–$209.5K** across the postings that list it.

**Forward Deployed Engineer: what employers want**

- Embed with customers (often on site), turn messy workflows into deployed
  software, own the deployment end to end, and carry patterns back into the
  product.
- Python everywhere; TypeScript / React for the customer-facing layer.
- LLM agents, RAG and *evaluation* (success criteria, before/after results)
  are the core technical content.
- Startup-heavy, often founding-team roles; travel and on-site work are normal.
- Stated pay is higher: **$91K–$316K**, often with equity.

**Fit with your current work** (Pittsburgh International Airport plus the
portfolio labs):

- *Data Engineer:* strong overlap. Batch/streaming pipelines, monitoring of
  success, failure and performance, a medallion lakehouse lab (Lakehouse
  Forge), data-quality and telemetry labs.
- *Forward Deployed Engineer:* the RAG agents and sentiment analysis at work
  are the core skill. Worth showing more of: a customer-facing deployment
  story, an agent evaluation harness with before/after metrics, and some
  TypeScript/React.
