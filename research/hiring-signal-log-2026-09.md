# Hiring Signal Log — Credo + Future Waves

Captured: **27–28 Sep 2026**  
Candidate: Siddhesh Amrale ([LinkedIn](https://www.linkedin.com/in/siddheshnitinamrale/))  
Portfolio: https://github.com/SiddheshAmrale/portfolio  
Constraint: Do not invent applicant counts. LinkedIn “people clicked apply” / “applicants” are snapshots and can change.

Related docs:
- `research/career-research-audit.md` (14 Sep 2026 — broader sector audit)
- `research/portfolio-project-recommendations.md`
- Canvas: `canvases/future-wave-low-applicant-roles.canvas.tsx` (Cursor IDE)

---

## 1. Credo Semiconductor

### Company
- Site: https://credosemi.com/
- Careers: https://credosemi.com/about-credo/careers/
- LinkedIn company: https://www.linkedin.com/company/credo-semi/ (id `3034982`)
- Focus: high-speed copper/optical interconnects (SerDes, AEC, optical modules), PILOT diagnostic/analytics platform

### LinkedIn US jobs sample (company filter, ~18 results on 28 Sep 2026)

| Role | Location | LinkedIn job id | Applies (clicked / applicants) | Checked | Notes |
|------|----------|-----------------|--------------------------------|---------|-------|
| Software Engineer (Corporate Strategy) | San Jose onsite | 4462330255 | Over 100 | 28 Sep | Python/SQL/web/LLM APIs; reports to SVP Product; $100k–$135k |
| Principal AI System Architect | San Jose | 4462331232 | **3** | 28 Sep | Early applicant; extreme bar (XPU/interconnect + tapeouts) |
| Senior Optical Hardware Engineer | San Jose | 4456025458 | **6** | 28 Sep | 212.5G PAM4 / PCB / SI; $140k–$210k (Built In / careers) |
| Senior Design Verification Engineer | Pittsburgh onsite | 4470395634 | **11** | 28 Sep | Early applicant; Sandra Weber hiring post earlier; 7+ yrs SV/UVM |
| Director, System Validation Engineering | San Jose | 4464109984 | **17** | 28 Sep | Director-level |
| Optical Systems Engineer | San Jose | 4442668267 | **48** | 28 Sep | Optical components / schematics; $180k–$210k |
| Field Application Engineer | San Jose | 4442617826 | **77** | 28 Sep | Was ~74 on 27 Sep |
| Senior PHY RTL Design Engineer | San Jose | 4437582068 | **78** | 28 Sep | $130k–$200k |
| Senior Application Security Engineer | San Jose | 4442673021 | ~89 (27 Sep) | 27 Sep | Re-check if using |
| Network Engineer | San Jose | 4442654795 | Over 100 (27 Sep) | 27 Sep | IT networking |

### Careers-page roles not always on LinkedIn US list
| Role | Why it matters | Pay (careers / boards) |
|------|----------------|------------------------|
| **Senior Software Engineer, PILOT** | Best skill match (Python, OLAP/DuckDB, data lakes, pipelines) | $150k–$175k |
| Hardware Validation Engineer | Python lab automation bridge | $80k–$120k |
| Senior Application Engineer (DSP) | Python/NumPy/Pandas + optical DSP | $120k–$200k |
| Staff / Principal Application Engineer | Customer/lab heavy | Higher |

**PILOT applicant count:** unknown — apply on company site, not counted in LinkedIn US Easy Apply sample.

### Credo DV bar (why 11 applies ≠ easy)
From Clera / Built In postings (verified snippets 28 Sep):
- 7+ years ASIC/SoC verification
- SystemVerilog, UVM, constrained-random, assertions
- Ethernet / PCIe / CXL; AMBA; FEC; Cadence/Mentor/Synopsys
- Pittsburgh posting salary band cited ~$120k–$200k

### Credo fit verdict (for this candidate)
| Path | Verdict |
|------|---------|
| PILOT Senior SWE | **Apply now** — strongest match |
| Corporate Strategy SWE | Possible but Over 100 applies, lower pay |
| Hardware Validation / AE automation | Build toward (Python + lab) |
| DV / PHY RTL / Optical Hardware / Principal AI | Not reachable without multi-year EE/ASIC |

---

## 2. LinkedIn profile state (projects rewritten 27 Sep 2026)

### Headline (as of 28 Sep)
`Data & AI Engineer | Azure Databricks · Delta Lake · Event Hubs · Spark | Real-Time Pipelines · LLM/RAG · ETL Automation | Azure AI-102 · AZ-204 · AZ-104`

### Projects on profile (Credo name-drop and GitHub URLs removed after feedback)
1. **Contract-Gated Medallion Lakehouse** (Sep 2026–Present) — Bronze quarantine, Silver SCD2, Gold as-of, watermarks, experiment gates  
2. **Held-Out Linux Incident Diagnosis** (Sep 2026–Present) — Parquet/DuckDB, held-out labels, Ubuntu netns live impairments  
3. **Per-Lane Link Health Diagnostics** (Sep 2026–Present) — SNR/BER/eye/jitter/FEC/CTLE-FFE, separate failure classes  

Edit form ids (internal LinkedIn): lakehouse `1694228812`, network `1694176853`, link `1694204078`.

### Profile assessment vs Credo / Physical AI
- **Not elite** for semiconductor/Physical AI recruiters (Azure keyword headline, recent lab-scale projects)
- **Solid** for cloud data/AI roles
- Gaps: no Isaac/ROS/GR00T signal; no SerDes/optical production history; projects dated Sep 2026

### Repo verification
- Public: https://github.com/SiddheshAmrale/portfolio
- Local pytest (27 Sep 2026): **65 passed**

---

## 3. Future-wave low-applicant scan (28 Sep 2026)

Thesis from prior research (Physical AI ≈ AI 2015–17; photonics as interconnect substrate; nuclear/fusion high payoff / low SWE volume). Job-volume preference: Physical AI > AI agents/infra > photonics scarcity > bio/quantum/fusion for this background.

### Verified quiet openings (LinkedIn)

| Applies | Role | Company | Job id | Wave | Fit for candidate |
|--------:|------|---------|--------|------|-------------------|
| **0** clicked | Senior Software Engineer, Robotics Tracking and Fusion | Anduril Industries | 4466727344 | Physical AI / defense | Stretch (perception/C++) |
| **3** clicked | Staff Hardware Reliability Engineer - Sensors | Pittsburgh Robotics Network | 4464772402 | Robotics (local) | Low (hardware) |
| **4** clicked | Application Engineer – PIC Architecture | OpenLight | 4469215214 | Silicon photonics | Low now (PIC/EE) |
| **7** clicked | Senior Solutions Architect, Industrial Robotics | NVIDIA | 4451476914 | Physical AI platform | Medium* after Isaac/GR00T proof |
| **7** applicants | Senior Software Engineer, Robotics Behavior & Interaction | FieldAI | 4468843239 | Physical AI | Medium* after ROS2/sim |
| (early / first 25) | Staff AI Inference and Acceleration Engineer | Figure | 4433888877 | Humanoid / Physical AI | Stretch (8+ yrs accel) |
| (~53, older post) | AI Training Infrastructure Engineer – Humanoid WBC | Figure | 4404383562 | Humanoid infra | Stretch; closer after infra projects |

Search used: early-applicant US filter with keywords  
`robotics OR GR00T OR Isaac OR humanoid OR photonics OR "optical interconnect" OR fusion OR Oklo`.

### Oklo (advanced fission) — Greenhouse, not always LinkedIn-countable
| Role | Board URL | Pay | Notes |
|------|-----------|-----|-------|
| Software Engineer (Applied AI/ML) | https://job-boards.greenhouse.io/oklo/jobs/6150355004 | $200k–$250k | Nuclear background not required; curiosity + software |
| Senior Software Engineer | https://job-boards.greenhouse.io/oklo/jobs/5739483004 | (see posting) | |
| Core Design / PRA / Process | Greenhouse | Varies | Domain nuclear — not a software pivot |

Oklo LinkedIn company: https://www.linkedin.com/company/oklo/ (reported company id ~2894564). Many roles apply off LinkedIn → low Easy Apply noise.

### Wave fit summary
| Wave | Job volume | Entry for this background | Action |
|------|------------|---------------------------|--------|
| Physical AI / robot foundation models | Highest among the set | Medium — build Isaac/ROS/telemetry | **Primary skill bet** |
| AI agents / AI cluster infra | Extremely high | Medium — already adjacent | Keep building |
| Silicon photonics / optical interconnect | High scarcity, fewer seats | Medium–High — SW/diagnostics via Credo | Adjacent to PILOT |
| Oklo / advanced nuclear SW+AI | Low volume, high pay | Medium if simulation/data story | Parallel apply |
| Quantum / fusion physics roles | Low SWE volume | Very high barrier | Skip as primary |

### Recommended sequence (as of 28 Sep)
1. **Apply now:** Credo Senior Software Engineer, PILOT (careers site)  
2. **Parallel long-shot:** Oklo Applied AI/ML SWE (Greenhouse) if simulation/data platform story is ready  
3. **Skill bet (6–18 mo):** Physical AI infrastructure — Python/C++, ROS 2, Isaac Sim, PyTorch, robot telemetry, sim→real eval → NVIDIA/FieldAI/Figure-style roles  
4. **Do not fake:** DV (SystemVerilog/UVM), optical PCB hardware, ASIC tapeout claims  

---

## 4. Copy / positioning mistakes corrected (27 Sep)

Rejected LinkedIn project patterns:
- Name-dropping Credo / PILOT in project descriptions  
- Leading with disclaimers (“not Spark”, “not ASIC”)  
- “Lab”, “teaching model”, “didactic”  
- Pasting GitHub URL in description (removed per user)

Preferred pattern (user-approved lakehouse style): name the mechanism → what the system does in short sentences → no employer name, no disclaimer paragraph.

---

## 5. Source checklist

| Source | Used for |
|--------|----------|
| LinkedIn job view pages (logged-in) | Applicant / clicked-apply counts |
| https://credosemi.com/about-credo/careers/ | Full Credo role list, PILOT JD |
| Clera / Built In Credo postings | DV / optical / AE requirements |
| https://job-boards.greenhouse.io/oklo/ | Oklo SWE/AI roles and pay |
| NVIDIA Workday / LinkedIn | GR00T / industrial robotics roles |
| Figure LinkedIn postings | Humanoid training/inference infra |
| Local `python -m pytest -q` (27 Sep) | Portfolio test honesty |

---

## 6. Refresh protocol

When updating this file:
1. Re-open LinkedIn job URLs; replace apply counts and date  
2. Re-scrape Credo careers for PILOT / validation titles  
3. Note whether Oklo roles moved or closed on Greenhouse  
4. Do **not** backfill missing counts from memory  

Last full LinkedIn apply recount: **28 Sep 2026**.
