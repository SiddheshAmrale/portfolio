# Job descriptions: Data Engineer and Forward Deployed Engineer

Two LinkedIn snapshots collected **11 October 2026** (United States).

| File | Contents |
|---|---|
| [`2026-10-11-big-companies-data-engineer.md`](2026-10-11-big-companies-data-engineer.md) | **Big companies, posted in the past 7 days:** every Data Engineer posting found (97 postings, 51 distinct roles) |
| [`2026-10-11-big-companies-forward-deployed-engineer.md`](2026-10-11-big-companies-forward-deployed-engineer.md) | **Big companies, posted in the past 7 days:** every Forward Deployed Engineer posting found (109 postings, 25 distinct roles) |
| [`2026-10-11-big-companies.json`](2026-10-11-big-companies.json) | The same 76 roles and 206 postings as structured data |
| [`2026-10-11-data-engineer.md`](2026-10-11-data-engineer.md), [`2026-10-11-forward-deployed-engineer.md`](2026-10-11-forward-deployed-engineer.md), [`2026-10-11-jobs.json`](2026-10-11-jobs.json) | Earlier broad sample (23 postings, mostly smaller companies) |

## Big-company scan: how it was done

- **Companies searched:** Google, Microsoft, Amazon, AWS, Apple, Meta, Netflix, NVIDIA,
  IBM, Oracle, Salesforce, Adobe, Uber, Airbnb, Intel, Cisco, JPMorganChase, Capital One,
  Walmart, Databricks and Snowflake; for Forward Deployed Engineer also Palantir, OpenAI,
  Anthropic and Scale AI.
- **Filters:** United States; posted in the past 7 days; company filter per search.
- **Titles kept:** roles whose title contains "Data Engineer" (also "Data & Analytics
  Engineer" and "Data Engineering" leads), or "Forward Deployed". LinkedIn's keyword
  search also returns general software roles; those were excluded.
- **Every page** of results was read until no matching titles remained. The same role is
  often posted once per city, so postings are grouped into **distinct roles**, and one
  posting per role was read in full.
- **Descriptions are summarised in my own words**, not copied; each posting links to its
  full text. Pay and work-authorisation terms are recorded as stated.
- "Not stated on LinkedIn" means the LinkedIn description gives no pay (Amazon, AWS, IBM
  and JPMorganChase publish none there).

### Coverage

| Company | Data Engineer postings | Forward Deployed Engineer postings |
|---|---|---|
| Capital One | 19 | – |
| IBM | 20 | 1 |
| Amazon | 17 | – |
| AWS | 4 | 8 |
| Meta | 15 | – |
| JPMorganChase | 8 | – |
| Walmart | 6 | – |
| Salesforce | 4 | 43 |
| Oracle | 3 | – |
| Microsoft | 1 | – |
| Google | – | 29 |
| Databricks | – | 22 |
| OpenAI | – | 6 |
| **Total** | **97** | **109** |

No matching titles this week at Apple, Netflix, NVIDIA, Adobe, Uber, Airbnb, Intel, Cisco
or Snowflake (Data Engineer); none on LinkedIn at Palantir, Anthropic or Scale AI
(Forward Deployed Engineer: these mostly hire through their own career sites). Google
files most data work under "Software Engineer" titles.

## Key takeaways

**Work authorisation (H-1B)**

- **Capital One is the clearest signal:** *Data Engineer 5* roles (10 postings) say they
  **will consider sponsoring**; *Data Engineer 4* roles (9 postings) say they **will not**.
- **U.S. person / clearance required:** Amazon Leo (export control, 2 roles), Databricks
  national-security and federal FDE roles, and Google Public Sector FDE roles (U.S.
  citizen, TS/SCI, one with polygraph).
- Most other postings do not mention sponsorship; ask early.

**Pay (where stated)**

- Data Engineer: **$102K–$286K**. Highest: Capital One DE5 ($209K–$262K), Meta technical
  leadership ($210K–$281K), Walmart Staff/Principal ($143K–$286K).
- Forward Deployed Engineer: **$89K–$317K**, concentrated at **$174K–$300K** (Google,
  OpenAI $185K–$300K, Databricks $182K–$250K).

**What Data Engineer roles ask for**

- AWS (Redshift, Kinesis) at Amazon; Spark/PySpark with Databricks or Snowflake at the
  banks and Salesforce; GCP/BigQuery at Walmart and IBM.
- Airflow and Kafka/streaming recur; data modelling, data quality and governance
  everywhere.
- AI is now part of the job description: Amazon teams mention agentic analytics and
  daily AI coding tools, Walmart has GenAI and agent-ready data roles, Meta hires for its
  Superintelligence Labs.

**What Forward Deployed Engineer roles ask for**

- Building and shipping **agentic AI inside customer environments**: Salesforce
  Agentforce, Google Gemini/Vertex AI, OpenAI models, Databricks.
- Python everywhere; TypeScript/React for the app layer; RAG, multi-agent systems, MCP
  servers and **evaluation frameworks** come up repeatedly.
- Seniority is high (5–8+ years typical); industry-specialised teams (legal, healthcare,
  financial services, public sector).

**Close to home**

- **Google, Forward Deployed Engineer III, Generative AI** lists **Pittsburgh, PA** as a
  location option ($174K–$252K, 5 years).
- Databricks' financial-services FDE role includes Philadelphia.

**Fit with your current work** (Pittsburgh International Airport + portfolio labs)

- *Data Engineer:* strong overlap: batch/streaming pipelines, monitoring of success,
  failure and performance, the Lakehouse Forge medallion lab and the data-quality labs.
- *Forward Deployed Engineer:* the RAG agents at work are the core skill. To strengthen:
  an agent **evaluation harness** with before/after metrics, a customer-deployment write-up,
  and some TypeScript/React.
