# LinkedIn profile audit: Data Engineer · Platform Engineer · Forward Deployed Engineer

Audit of linkedin.com/in/siddheshnitinamrale on 11 Oct 2026, measured against the 76 roles
in [`job-descriptions/`](job-descriptions/README.md) (big companies, past 7 days).
Items marked **[confirm]** need your yes: only state what is true.

## Verdict

| Target role | Fit today | Main gap |
|---|---|---|
| Data Engineer | **Strong** | Title says "Analytics Full Stack Developer"; skills section has ~15 of 100 slots |
| Data / AI Platform Engineer | **Strong** | Kubernetes and cost/observability work not shown yet |
| Forward Deployed Engineer | **Weak signal** | Nothing says you work *with users*; no evals; no posts or recommendations |

The About section and the Pittsburgh International Airport role are already elite: specific,
quantified and production-grade. The gaps are in what recruiters' searches and LinkedIn's
matching read first: **title, headline, skills, Featured, activity and recommendations.**

## What the research says recruiters screen for

- **Data Engineer:** Spark/PySpark, Databricks or Snowflake, SQL, data modelling, streaming
  (Kafka/Kinesis/Event Hubs), Airflow, data quality and governance; AWS at Amazon, Capital One
  and JPMorganChase; AI-ready data at Amazon, Walmart and Meta.
- **Forward Deployed Engineer:** shipping agentic AI *inside customer environments*, Python
  plus TypeScript/React, RAG, multi-agent/MCP, **evaluation frameworks**, translating messy
  workflows into production, stakeholder trust. 5–8+ years typical.
- **Work authorisation:** many big employers won't sponsor (see research README); Capital One
  DE5 will consider it. Keep visa status off the public profile; raise it in the first
  recruiter call.

---

## 1. Headline (highest impact)

**Now:** Data & AI Platform Engineer | Databricks Lakehouse · Real-Time Streaming · LLM
Pipelines | Spark · Python · Unity Catalog · IoT Telemetry | Azure · Terraform

**Proposed (174 characters):**

> Data & AI Platform Engineer | Forward-Deployed Builder | Databricks Lakehouse · Real-Time Streaming · LLM & Agent Pipelines in Production | Python · Spark · Azure · Terraform

Why: puts all three target titles' keywords in the first line search shows, and adds the
FDE signal ("forward-deployed builder", "agent pipelines in production").

## 2. Current job title

**Now:** Analytics Full Stack Developer. LinkedIn matching and recruiter title searches
weight this heavily, and it contains neither "Data Engineer" nor "Platform".

**Proposed [confirm, keep your official title in it]:**

> Analytics Full Stack Developer (Data & AI Platform Engineering)

## 3. About (rewrite: same facts, adds the FDE story, 2,330 characters)

> I build data and AI platforms that run in production, and I work directly with the people who use them.
>
> At Pittsburgh International Airport I designed and run the One Data Platform end to end, from device and vendor feeds to the AI-enriched data products operations teams use every day:
> • Lakehouse: 60 Databricks Lakeflow pipelines and 58 jobs on Unity Catalog across flights, baggage, parking, ground transport, finance, workforce and customer experience. Auto Loader bronze with schema rescue, SCD2 silver, gold data products with explicit grain.
> • GenAI in the pipeline: Databricks ai_query (Llama 3.3 70B) turns FAA NOTAMs and customer feedback into plain-English summaries, with versioned prompts, a model kill switch and a content-hashed Delta cache so reruns are deterministic and cheap.
> • Ingestion: a .NET 8 Azure Functions platform with ~50 vendor and device connectors (Amadeus, SITA, Daifuku, Workday, TSA, FAA): watermarking, gap detection, time-range reprocessing, dual writes to ADLS and Azure Data Explorer. 1,300+ unit tests.
> • Streaming and IoT: ~70 Azure Functions over IoT Hub and Event Hubs into Kusto for near-real-time occupancy, gate and parking data (~5-minute freshness).
> • Platform: Terraform, Databricks Asset Bundles, Bicep and Azure DevOps with OIDC and approval-gated prod; Unity Catalog grants and lineage kept as code.
> • In users' hands: Kusto-backed data APIs with freshness alerts, and React + MSAL apps operations staff run daily (parking kiosks, live gate map, concessions, staff directory).
>
> How I work: I sit with the operations teams, map the real workflow, ship a working version fast, measure it, and harden it into something other engineers can maintain. **[confirm]**
>
> Outside work I publish runnable systems labs (Python, DuckDB, Parquet, CI): a contract-gated medallion lakehouse, held-out Linux incident diagnosis, and VELA, a native Rust media player. Now building an MCP server that lets AI agents query governed lakehouse data, with evaluations gating changes in CI.
>
> Microsoft Certified: Azure AI Engineer and Azure Developer. MS in Computer Science, NJIT.
>
> Open to Data Engineer, Data/AI Platform Engineer and Forward Deployed Engineer roles. Pittsburgh based, open to relocation and remote.

## 4. Experience

**Pittsburgh International Airport:** keep the bullets (they are excellent). Add one
*outcome* line at the top, using real numbers you can stand behind **[confirm values]**:

> Replaced [N] manual reports / spreadsheets with governed data products used by [N] operations staff across [N] departments; [key result, e.g. parking or gate data now ~5 minutes fresh instead of next-day].

**Freddie Mac / Top Hat:** the bullets read as generic (e.g. "cloud-based ETL frameworks",
"Cloud Data Services"), which experienced screeners discount. Replace with specifics
**[fill with what you actually used]**:

> • Built [Python/Spark/…] ingestion pipelines on [AWS/Azure service] for [loan-level dataset], processing [volume] per [day/month].
> • Automated validation and reconciliation across mortgage datasets, cutting manual review effort by 40%.
> • Built REST services in [language/framework] that served validated data to risk and compliance analytics.

## 5. Skills (biggest search gap: about 15 used, up to 100 allowed)

**Pin as top 5:** Data Engineering · Databricks · Apache Spark · Python · Generative AI

**Add now (already evidenced in your profile/work):**
Data Engineering, ETL/ELT, Data Modeling, Data Quality, Data Governance, Stream Processing,
Delta Lake, PySpark **[confirm]**, Azure Data Explorer (Kusto), Kusto Query Language (KQL),
Azure Event Hubs, Azure IoT Hub, Azure Functions, Azure Data Lake Storage, Microsoft Azure,
Infrastructure as Code, Bicep, CI/CD, REST APIs, C#, .NET, React.js, TypeScript **[confirm]**,
Generative AI, Retrieval-Augmented Generation (RAG) **[confirm]**, LLM Evaluation **[confirm]**,
Rust, DuckDB, Apache Parquet, GitHub Actions, Stakeholder Management.

**Add when the in-progress projects ship:** Apache Kafka, Apache Flink, Apache Iceberg,
Trino, Kubernetes, vLLM, Model Context Protocol (MCP), AI Agents, pgvector, OpenTelemetry.

**Worth learning, frequently demanded in the research, not on your profile:**
AWS (Amazon, AWS, Capital One, JPMorganChase), Snowflake + dbt + Airflow (banks, Salesforce),
TypeScript/React depth for FDE roles. Also the **Databricks Certified Data Engineer
Professional** and **Generative AI Engineer Associate**: Databricks appears constantly in
both role families, and your production experience makes them quick wins.

## 6. Featured section (currently empty)

1. Portfolio site (runnable labs, live, Lighthouse 95+).
2. VELA on GitHub (github.com/SiddheshAmrale/vela): shows systems depth.
3. A post on the LLM NOTAM pipeline (see §8): the best FDE-style story you have.
4. Lakehouse Forge lab (medallion, CDC/SCD2, contracts): a direct Data Engineer signal.

## 7. Open to Work (recruiters only: keep it)

Job titles: Data Engineer · Senior Data Engineer · Data Platform Engineer · Platform
Engineer · Forward Deployed Engineer · AI Engineer · ML Platform Engineer. Locations:
Pittsburgh, New York, San Francisco Bay Area, Seattle, Austin + Remote. (Google's FDE III,
GenAI role this week listed Pittsburgh.)

## 8. Activity (0 posts): one post every 1–2 weeks

FDE and platform hiring managers read posts as evidence of communication. Starters, all
grounded in work you already did:

1. **"Making LLM enrichment deterministic in a lakehouse."** Temperature 0, strict JSON
   schema, versioned prompts, kill switch, content-hashed Delta cache: why reruns cost $0.
2. **"50 vendor feeds, one ingestion platform."** Watermarks, gap detection and
   time-range reprocessing: what breaks in real feeds (late, duplicated, out-of-order).
3. **"Software packet loss is not optical BER."** A short story from your labs on measuring
   the right thing.

## 9. Recommendations (0): ask for 2–3

A manager or ops lead at the airport (outcomes, working with operations) and a Freddie Mac
colleague (engineering quality). Suggest they mention one concrete project each.

## 10. Banner and contact info

- Banner: [`linkedin-banner.png`](linkedin-banner.png) (1584×396, matches the portfolio).
- Contact info: add the portfolio URL and GitHub.

## Priority order

1. Headline · 2. Skills (add + pin) · 3. Open to Work titles · 4. About · 5. Featured ·
6. Title wording · 7. Recommendations · 8. First post · 9. Fill experience specifics.
