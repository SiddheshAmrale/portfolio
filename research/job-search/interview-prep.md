# Interview prep: Data Engineer · Platform Engineer · Forward Deployed Engineer

Built from your resume and real work. Where a detail only you know is needed, it says
**[fill]**. Practise answers out loud: under 2 minutes each, numbers first.

---

## 1. "Tell me about yourself"

**60 seconds:**

> I build data and AI platforms, and I like building them next to the people who use them.
> I started as a full-stack engineer in Pune, building products and the data services
> behind them. Then I moved to Freddie Mac, working on mortgage data pipelines and APIs
> while I did my master's at NJIT. For the last almost three years I've owned Pittsburgh
> International Airport's data platform end to end: about 50 vendor and device feeds, 60
> Databricks pipelines, real-time IoT streams, and LLM enrichment that turns FAA notices
> and passenger feedback into something the operations teams can act on. The part I enjoy
> most is sitting with an ops team, seeing how they actually work, shipping something in
> days and then hardening it. That's why I'm looking at [Data Platform / Forward Deployed]
> roles: more of that loop, at bigger scale.

**Variant endings:**
- *Data Engineer:* "…why I'm looking for a senior data engineering role on a platform
  where data correctness under real-world mess is the job."
- *FDE:* "…the same loop forward-deployed engineers run with customers, and I want to do
  it across many customers instead of one."

---

## 2. STAR stories (have all six ready)

### A. Ingestion platform: new sources in 2 days instead of weeks
- **S:** Each new vendor feed (Amadeus, SITA, Daifuku, Workday, TSA, FAA…) was a one-off
  pipeline. **[fill: how long the last one took; who was waiting on it]**
- **T:** Make onboarding a configuration task, not a project.
- **A:** Built a reusable .NET 8 Azure Functions framework: pluggable paging strategies,
  Managed Identity auth, watermark/CDC loads, gap detection, time-range reprocessing, dual
  writes to ADLS and Azure Data Explorer. 1,300+ unit tests so changes are safe.
- **R:** ~50 connectors across 16 function apps; new sources in ~2 days. Moving off ADF
  identified $400K+/yr. **[fill: how the $400K was computed]**
- **Follow-ups to expect:** How do you detect a gap vs. a quiet period? What happens when
  a vendor changes its schema? Exactly-once vs. at-least-once, and where are you idempotent?
  How do you reprocess a time range without double counting?

### B. LLMs inside a data pipeline, made deterministic
- **S:** Raw FAA NOTAMs and free-text feedback were unreadable at scale for ops staff.
- **A:** Databricks `ai_query` (Llama 3.3 70B) in Lakeflow; temperature 0, strict JSON
  schema, versioned prompts, a kill switch, and a Delta cache keyed on a content hash, so
  unchanged inputs are never re-sent.
- **R:** Plain-English summaries and sentiment in the gold layer; reruns deterministic and
  cheap. **[fill: volume per day, cost per run, how quality was checked]**
- **Follow-ups:** How do you evaluate output quality? What if the model hallucinates a
  runway closure? How do you roll back a prompt? What does the kill switch do downstream?

### C. Real-time IoT: correct numbers with late and out-of-order events
- **A:** ~70 Azure Functions + a Node.js decoder for LoRaWAN sensors, people counters and
  camera analytics → IoT Hub/Event Hubs → Kusto. ~5-minute freshness.
- **Talking points:** event time vs. ingestion time, watermarks, dedupe keys, device clock
  drift, what "occupancy" means when a sensor drops out (missing is not zero).
- **[fill: a specific bug or incident and how you found it]**

### D. Working with operations teams (FDE gold)
- **S:** **[fill: one team, e.g. parking or concessions, and their pain]**
- **A:** Sat with them, mapped the real workflow, shipped a React + MSAL app on
  Kusto-backed APIs within **[fill: days/weeks]**, then iterated.
- **R:** Used daily; incident response time down 40%. **[fill: how measured]**
- **Lesson to say out loud:** what they asked for vs. what they needed.

### E. RAG agents with evaluation
- **A:** Azure OpenAI + Semantic Kernel over governed data, orchestrated with Airflow;
  evaluation sets checked before changes ship.
- **R:** Five teams self-serve; ad-hoc report requests down ~60%.
- **Follow-ups:** What's in the eval set and who wrote it? Retrieval vs. generation errors?
  How do you stop the agent from answering outside its data? Link to the Agent-Ready
  Lakehouse: policy lives in the data layer, not the prompt.

### F. Reliability at Freddie Mac
- SLIs/SLOs and error budgets; circuit breakers, idempotency, backoff; 99.95% uptime; GraphQL
  + REST gateway at 1K+ req/s, P95 < 10 ms. **[fill: one outage and what changed after]**

---

## 3. System design prompts (practise on a whiteboard)

1. **Ingest 50 third-party APIs with different paging, auth and reliability.** Connector
   contract, watermark store, idempotent writes, gap detection, replay, schema drift,
   per-source SLOs, alert routing. *This is story A: draw your own system.*
2. **Real-time occupancy dashboard from 2,000 sensors.** Event time, watermarking,
   late-data policy, dedupe, hot path (Kusto/Flink) vs. batch correction, freshness SLO.
3. **Let an LLM agent answer ops questions over company data safely.** Role-scoped access,
   semantic metrics, SQL guard, audit, evals in CI, prompt-injection containment. *This is
   the Agent-Ready Lakehouse: walk through its three layers.*
4. **FDE case: a hospital wants an AI assistant for discharge summaries in 6 weeks.**
   Discovery questions, success metric, data access and privacy, eval set built *with* the
   clinicians, pilot, rollout, what you would refuse to ship.
5. **Lakehouse for a bank: medallion, SCD2, data contracts, lineage.** Lakehouse Forge
   covers this.

**FDE discovery questions to always ask:** Who uses the output, and what decision changes?
What does "good" look like and how will we measure it? What data exists, who owns it, and
what can't leave? What's the cost of a wrong answer? What's the smallest version worth
using next week?

---

## 4. SQL drills on your own project data

Run against `agent-ready-lakehouse/data` (DuckDB). Answers verified on the generated data.

| # | Problem | Skill | Answer (verified) |
|---|---|---|---|
| 1 | How many duplicate rows did the bronze flights feed deliver? | counting distinct | 3,575 rows, 3,456 ids → 119 duplicates |
| 2 | Deduplicate bronze flights keeping one row per `flight_id` | `ROW_NUMBER()` | 3,456 rows |
| 3 | 7-day rolling on-time rate by day | window frame | 30 Sep: 87.39% daily, 82.18% rolling |
| 4 | Longest run of consecutive on-time departures per carrier | gaps and islands | AA 41, WN 33, NK 31 |
| 5 | Episodes where a lot stayed ≥ 80% full for an hour or more | gaps and islands + `HAVING` | Long Term 4, Garage 3, Short Term 3, Economy 2 |
| 6 | Average rating by delay bucket (0–15, 16–60, 60+, cancelled) | `CASE` + join | 4.32, 3.89, 3.09, 2.11 |
| 7 | Top 2 most-delayed destinations per terminal | `QUALIFY` | A: CLT 15.1, DEN 12.7 · B: DCA 10.7, PHL 10.3 · C: DCA 16.0, MCO 10.7 |

<details><summary>Solutions</summary>

```sql
-- 4. gaps and islands
WITH x AS (
  SELECT carrier, sched_dep, status = 'on_time' AS ok,
         row_number() OVER (PARTITION BY carrier ORDER BY sched_dep)
       - row_number() OVER (PARTITION BY carrier, status = 'on_time' ORDER BY sched_dep) AS grp
  FROM flights WHERE status <> 'cancelled')
SELECT carrier, max(n) AS longest
FROM (SELECT carrier, grp, count(*) AS n FROM x WHERE ok GROUP BY 1, 2)
GROUP BY 1 ORDER BY 2 DESC;

-- 3. rolling 7-day
WITH d AS (
  SELECT flight_date,
         avg(CASE WHEN status = 'on_time' THEN 1.0 ELSE 0 END) FILTER (WHERE status <> 'cancelled') AS otp
  FROM flights GROUP BY 1)
SELECT flight_date, otp,
       avg(otp) OVER (ORDER BY flight_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS otp_7d
FROM d ORDER BY 1;

-- 7. QUALIFY
SELECT terminal, dest, avg(dep_delay_min) AS avg_delay
FROM flights WHERE status <> 'cancelled' GROUP BY 1, 2
QUALIFY row_number() OVER (PARTITION BY terminal ORDER BY avg(dep_delay_min) DESC) <= 2;
```

Note on #3: averaging daily rates weights every day equally. Say this in an interview and
offer the flight-weighted version (sum of on-time over sum of operated, across the window).
</details>

**Also drill:** SCD2 merge (`MERGE` with effective dates), sessionisation, median and
percentiles, anti-joins for "in A not in B", and explaining a query plan.

---

## 5. Questions to ask them

- What does a great first 90 days look like for this role?
- (FDE) How many customers would I work with at once, and who owns the product feedback loop?
- (DE) What breaks most often in your pipelines today, and how do you find out?
- How are data quality and AI output quality measured here?
- What's the visa / sponsorship process for this role? (ask the recruiter early, not the panel)
