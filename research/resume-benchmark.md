# Resume benchmark: Data Engineer · Platform Engineer · Forward Deployed Engineer

12 Oct 2026. Resumes: [`Resume/`](../Resume/) (built by `build_resume.py`, scored by `evaluate.py`).
Demand data: the 76 big-company roles in [`job-descriptions/`](job-descriptions/README.md).

## 1. Keyword coverage (what an ATS match sees)

Share of skill demand across the researched roles that appears in the resume text
(weighted by how many roles ask for each skill; text extracted from the PDF the way a parser
reads it).

| Resume | Data Engineer (51 roles) | Forward Deployed Engineer (25 roles) |
|---|---|---|
| Original (Aug 2025) | 82% | 67% |
| New: Data & Platform | 81% | 80% |
| New: Forward Deployed | 81% | 80% |

The original's Data Engineer score included dbt and Iceberg, which nothing in the
experience supports, so they were removed. The FDE gain comes from evaluation, MCP, LLM apps
and customer-facing work now being stated explicitly.

**Remaining gaps are vendor stacks, not wording:** Redshift (14 roles, all Amazon/AWS),
BigQuery/GCP (8), Vertex AI/Gemini (16 Google FDE mentions), dbt (3), Flink (3), Iceberg (2).
They can only be closed honestly by using them:

| Gap | Cheapest honest fix | Unlocks |
|---|---|---|
| Vertex AI / Gemini | Add a Gemini backend + eval run to the Agent-Ready Lakehouse project (free tier) | Google FDE III, GenAI (lists Pittsburgh) |
| Redshift / AWS data | Port Lakehouse Forge gold layer to Redshift Serverless or Athena; write it up | Amazon / AWS DE II roles |
| BigQuery | Same port to BigQuery sandbox (free) | Walmart, IBM, Google |
| dbt | Express Forge silver/gold as dbt models with tests | Banks, Salesforce |
| Kafka/Flink/Iceberg | The planned Streaming Lakehouse project | Walmart Ads, Salesforce |

## 2. Benchmark against a top-company hire

A real top candidate's resume is private, and public "example" resumes are mostly
invented, so comparing against one would not be meaningful. The benchmark below is instead
the **hiring bar the postings themselves describe** for the best-fit roles:
Google FDE III GenAI ($174K–$252K, Pittsburgh option, 5 yrs), Databricks Sr. FDE ($182K–$250K,
6+ yrs), OpenAI FDE Financial Services ($185K–$300K, 5+ yrs), Capital One Data Engineer 5
($209K–$238.5K, 6 yrs, will consider sponsorship) and Walmart Staff DE ($143K–$286K).

Scores 1–5. "Bar" = what a resume that clears these screens typically shows.

| Dimension | Bar | Original | New | Evidence in new resume / gap |
|---|---|---|---|---|
| End-to-end ownership | 5 | 4 | **5** | Owns the airport's platform from feeds to apps |
| Production scale | 5 | 4 | **4** | 60 pipelines, ~50 connectors, ~70 functions, 5-min freshness; no data volumes yet |
| Measured outcomes | 5 | 4 | **4** | 2 days vs weeks, $400K+, −60% requests, −40% MTTR; need confirming (§4) |
| Data stack match | 5 | 4 | **4** | Spark, Databricks, SQL, Airflow, Kafka, streaming; no Redshift/BigQuery/dbt |
| AI depth (RAG, agents, evals) | 5 | 3 | **4** | LLMs in pipelines with versioned prompts, RAG + eval sets, Agent-Ready Lakehouse (MCP + eval gate) built |
| Works with customers | 5 | 2 | **3** | Internal ops teams and vendor integrations; no external customers yet |
| Writing / public signal | 4 | 1 | **2** | Portfolio + labs; no posts, talks or recommendations |
| Years for level | 5–6+ | 6.7 | 6.7 | Meets Google FDE III, Capital One DE5, Databricks Sr FDE; below 8-yr IV roles |
| Verifiable claims | 5 | 3 | **4** | Titles match LinkedIn; GitHub, portfolio, credential links |
| ATS-safe format | 5 | 4 | **5** | One column, standard headings, DOCX + text PDF, no tables |

**Verdict:** the new resume clears the screen for Data Engineer 5 / Senior DE and FDE III
level roles. The two gaps a top-company FDE panel will probe are *external customer work*
and *public evidence of how you think*. Both are fixable in weeks, not years:

1. Publish the Agent-Ready Lakehouse (built locally in `agent-ready-lakehouse/`) and run its agent eval on Gemini and one OpenAI model; write it up: covers agents, MCP, evals,
   and shows customer-style problem framing.
2. Publish three posts (topics in `linkedin-profile-optimization.md` §8).
3. Get two recommendations, one from an operations stakeholder ("they sat with us…").
4. In interviews, frame the airport departments and the ~50 vendors as customers: discovery,
   scoping, deployment, adoption. That *is* forward-deployed work.

## 3. Best-fit targets right now

| Role | Why | Watch-out |
|---|---|---|
| Google FDE III, Generative AI | Pittsburgh option, 5 yrs, RAG/agents/evals | Vertex/Gemini expected: do the Gemini eval run first |
| Capital One Data Engineer 5 | Will consider sponsorship; Spark + Databricks | AWS-heavy; DE4 roles say no sponsorship |
| Databricks Sr. FDE (Digital Native, Financial Services) | Databricks production depth, TypeScript + Python | Skip National Security / Federal (citizenship) |
| AWS Sr. FDE | RAG, agents, evals, TypeScript/React | AWS AI stack |
| Salesforce FDE, Data 360 | Real-time data + Databricks/Snowflake | Agentforce familiarity |
| Walmart Staff DE, Customer Insights & GenAI | GenAI + data platform, Azure listed | GCP/BigQuery |

## 4. Confirm before sending

Every number below came from your earlier resume or LinkedIn. Interviewers drill into each
one; keep only what you can explain with how it was measured.

- Airport: $400K+/yr savings (ADF → serverless); onboarding weeks → 2 days; Power BI for 5
  business units; −60% ad-hoc report requests; −40% incident response time; RAG
  orchestrated with Airflow.
- Freddie Mac: 1K+ req/s at P95 < 10 ms; 99.95% uptime; 12+ services on AKS/EKS; release
  cycles −50%; deployment incidents −30%; −40% manual review.
- Top Hat: 10M+ requests/day at < 90 ms p99; refresh lag 4 h → < 20 min; 99.5% → 99.9%.
- Left out until confirmed: "500M+ events/day" (old summary; no bullet backed it).
- **Make LinkedIn match the resume:** LinkedIn's Freddie Mac and Top Hat bullets describe
  different work and stacks (e.g. Top Hat C#/.NET vs Angular/Java). Recruiters compare them.
- Kafka, Snowflake and AWS stay in Skills because your earlier resume listed them; remove any
  you could not discuss for ten minutes.
