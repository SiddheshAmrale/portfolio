# LinkedIn post drafts

Three posts, one every 1–2 weeks. Each is grounded in your own work. Edit the
**[fill]** parts, add one image or diagram, and post Tuesday–Thursday morning.
Reply to every comment in the first hour.

---

## Post 1: LLMs inside a data pipeline

Most "LLM in production" demos skip the part data engineers care about: what happens on the
rerun.

At Pittsburgh International Airport we use an LLM inside our Databricks pipelines. It turns
FAA NOTAMs and passenger feedback into plain-English summaries that the operations teams
read every day.

Four rules made it boring, in a good way:

1. Temperature 0 and a strict JSON schema, so output is structured data, not prose.
   [confirm: what happens to a row whose output doesn't parse]
2. Prompts are versioned like code. A change to a prompt is a change to the data.
3. A content-hash cache in Delta. If the input hasn't changed, we never call the model
   again. Reruns are deterministic and close to free.
4. A kill switch for the model. [confirm: what the pipeline does when it's off]

The model is the easy part. Making its output behave like any other well-managed column
is the work.

[fill: one number, e.g. rows per day or cost per run]

#DataEngineering #Databricks #LLM

---

## Post 2: 50 vendor feeds, one ingestion platform

Every data engineer has written the same API connector 20 times.

At PIT we ingest from about 50 vendors and devices (airlines, baggage systems, workforce,
TSA, FAA). Each one has its own paging, auth, rate limits and its own way of breaking.

What made onboarding a new source take 2 days instead of weeks:

• Paging is a strategy you pick, not code you write
• Every source has a watermark, so loads pick up exactly where they left off
• Gap detection: we know the difference between "no data" and "missing data"
• Time-range reprocessing is a button, not a war room
• Dual writes: ADLS for the lakehouse, Azure Data Explorer for minutes-fresh ops views
• 1,300+ unit tests, because the framework is shared by everything

[fill: the most common or strangest failure you've actually seen in these feeds]

What's the strangest vendor-feed behaviour you've seen?

#DataEngineering #Azure #DataQuality

---

## Post 3: Don't put access rules in the prompt

If your AI agent's data rules live in the system prompt, they're a suggestion.

I built a small open-source project to show the alternative: Agent-Ready Lakehouse, an
MCP server that gives agents governed access to lakehouse data.

Three layers:
1. SQL guard: one read-only SELECT, allow-listed datasets, no file reads, no settings probes
2. Per-role sandbox: the engine only holds the rows and columns that role may see, with
   personal data already pseudonymised
3. Locked engine: even SQL that slips past the guard can't read files or unlock itself

Then an eval suite runs in CI on every change. It checks metric accuracy against an
independent oracle, 23 attack and out-of-scope requests, and latency. The suite is itself
tested: break a metric definition or weaken the guard, and CI goes red.

A prompt-injected agent asking for passenger e-mails gets a polite tool error and an audit
log entry. That's the point.

Repo: github.com/SiddheshAmrale/agent-ready-lakehouse

#AIAgents #MCP #DataGovernance #LLMOps
