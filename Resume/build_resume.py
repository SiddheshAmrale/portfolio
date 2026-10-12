"""Builds the tailored resumes (DOCX + PDF) from one content model.

    python build_resume.py

Outputs, next to this script:
    Siddhesh_Amrale_Resume_Data_Platform.docx / .pdf
    Siddhesh_Amrale_Resume_Forward_Deployed.docx / .pdf

Layout rules (ATS): one column, standard section names, no tables, text
boxes, icons or images; contact details in the body, not the page header.
"""

import html
import subprocess
import sys
from pathlib import Path

from docx import Document
from docx.enum.text import WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

HERE = Path(__file__).resolve().parent
EDGE = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")

NAME = "Siddhesh Amrale"
CONTACT = [
    "Pittsburgh, PA (open to relocation)",
    "siddhesh.amrale@gmail.com",
    "+1 (973) 438-8729",
    "linkedin.com/in/siddheshnitinamrale",
    "github.com/SiddheshAmrale",
    "gentle-river-08010bc0f.1.azurestaticapps.net",
]

# ---------------------------------------------------------------- content

ACAA_SCOPE = (
    "Own the airport's data and AI platform end to end, from device and vendor "
    "feeds to the data products and apps operations staff use every day."
)

ACAA = {
    "lakehouse": (
        "Designed and built the One Data Platform on Databricks: 60 Lakeflow (DLT) "
        "pipelines and 58 jobs on Unity Catalog across flights, baggage, parking, "
        "ground transport, finance, workforce and customer experience. Auto Loader "
        "bronze, SCD2 silver and gold data products feed Power BI for 5 business units."
    ),
    "ingestion": (
        "Built a reusable ingestion platform on .NET 8 Azure Functions (16 function "
        "apps, ~50 connectors including Amadeus, SITA, Daifuku, Workday, TSA and FAA) "
        "with watermark/CDC loads, gap detection and time-range reprocessing. New "
        "sources now take 2 days instead of weeks; 1,300+ unit tests."
    ),
    "cost": (
        "Moved pipelines off Azure Data Factory onto serverless functions, "
        "identifying $400K+ a year in savings."
    ),
    "streaming": (
        "Built the real-time path: ~70 Azure Functions and a Node.js decoder for "
        "LoRaWAN sensors, people counters and camera analytics, streaming through "
        "IoT Hub and Event Hubs into Azure Data Explorer (KQL) for occupancy, gate "
        "and parking data at about 5-minute freshness."
    ),
    "platform": (
        "Run the platform as code: Terraform, Databricks Asset Bundles, Bicep and "
        "Azure DevOps with OIDC and approval-gated production; Unity Catalog grants "
        "reconciled from code; alerts on pipeline failures, freshness and latency."
    ),
    "llm": (
        "Put LLMs inside the pipeline: Databricks ai_query (Llama 3.3 70B) turns FAA "
        "NOTAMs and customer feedback into plain-English summaries and sentiment, "
        "with strict JSON output, versioned prompts, a kill switch and a "
        "content-hashed Delta cache that keeps reruns deterministic and cheap."
    ),
    "rag": (
        "Built RAG agents on Azure OpenAI and Semantic Kernel over governed data, "
        "orchestrated with Airflow and checked against evaluation sets before "
        "changes ship. Five business teams now self-serve answers; ad-hoc report "
        "requests fell by about 60%."
    ),
    "users": (
        "Work directly with operations teams to map how they really work, then ship "
        "React + MSAL apps and Kusto-backed data APIs they use daily (parking "
        "kiosks, live gate status map, concessions, staff directory), covered by "
        "Cypress E2E tests. Incident response time down 40%."
    ),
}

FREDDIE_SCOPE = (
    "Mortgage data pipelines and APIs for risk and compliance analytics, while "
    "completing an MS in Computer Science at NJIT."
)

FREDDIE = [
    "Built Python and SQL ingestion pipelines for loan-level mortgage data, with "
    "automated validation, reconciliation and quality checks that cut manual data "
    "review by 40%.",
    "Designed a GraphQL and REST data gateway (Node.js, Java) behind Azure API "
    "Management with Entra ID auth, caching and rate limiting, serving mortgage "
    "decisioning data at 1K+ requests/s with P95 latency under 10 ms.",
    "Defined SLIs, SLOs and error budgets, and added circuit breakers, idempotency "
    "and retries with backoff across data services, holding 99.95% uptime.",
    "Moved on-prem workflows and 12+ services onto Kubernetes (AKS, EKS) with "
    "GitHub Actions CI/CD and ArgoCD canary and blue-green releases: release "
    "cycles 50% shorter, deployment incidents down 30%.",
]

TOPHAT_SCOPE = (
    "Where I started: full-stack products and the data services behind them for "
    "enterprise clients."
)

TOPHAT = [
    "Built full-stack web applications (Angular, Java, MongoDB) for media content "
    "delivery over Azure Blob Storage and CDN, serving 10M+ requests a day at "
    "under 90 ms p99.",
    "Built batch ETL for content metadata, cutting refresh lag from 4 hours to "
    "under 20 minutes.",
    "Added Prometheus and Grafana dashboards and alerts on latency, throughput and "
    "error-rate SLIs, then fixed the worst bottlenecks: availability rose from "
    "99.5% to 99.9%.",
]

PROJECTS = {
    "agent": (
        "Agent-Ready Lakehouse",
        "Python, MCP, DuckDB, sqlglot, GitHub Actions",
        "github.com/SiddheshAmrale/agent-ready-lakehouse",
        "MCP server that gives AI agents governed, read-only access to lakehouse data: SQL "
        "allow-list, per-role sandboxes with masking and row filters, a locked engine and an "
        "audit log. A CI eval gate checks metric accuracy against an independent oracle, 23 "
        "attack and out-of-scope requests, and latency (p95 14 ms).",
    ),
    "forge": (
        "Lakehouse Forge",
        "Python, DuckDB, Parquet, pytest",
        "portfolio: /labs/forge",
        "Runnable medallion lakehouse with CDC/SCD2, data-contract quarantine, "
        "late-arriving facts, freshness SLAs and experiment health checks.",
    ),
    "vela": (
        "VELA, native media player",
        "Rust, libmpv, OpenGL",
        "github.com/SiddheshAmrale/vela",
        "Cross-platform (Windows, macOS, Linux) player that renders only when a "
        "frame or the UI changes: 5.6% CPU on HEVC playback vs 9.8% for stock mpv, "
        "2.2 MB binary, 85 end-to-end checks.",
    ),
    "labs": (
        "Telemetry and incident diagnosis labs",
        "Python, Linux, GitHub Actions",
        "portfolio: /labs/telemetry, /labs/incident",
        "Counter pipelines that hold up under duplicates, reordering, gaps and "
        "restarts; incident diagnosis scored on held-out cases, with live Linux "
        "network-namespace faults running in CI.",
    ),
}

CERTS = [
    "Microsoft Certified: Azure AI Engineer Associate (2025)",
    "Microsoft Certified: Azure Developer Associate (AZ-204, 2024)",
    "Microsoft Certified: Azure Administrator Associate (AZ-104, 2022)",
]

EDUCATION = [
    ("M.S. Computer Science, New Jersey Institute of Technology", "2023"),
    ("B.E. Computer Engineering, Savitribai Phule Pune University", "2019"),
]

SKILLS_DATA = [
    ("Data engineering",
     "SQL, Python, PySpark, Apache Spark, Databricks (Lakeflow/DLT, Unity Catalog, "
     "Auto Loader, Asset Bundles), Delta Lake, Parquet, DuckDB, Airflow, Snowflake, "
     "ETL/ELT, CDC, SCD Type 2, dimensional modeling, data warehousing, data quality, data governance, Power BI"),
    ("Streaming",
     "Azure Event Hubs, IoT Hub, Azure Data Explorer (Kusto/KQL), Kafka, "
     "event-driven architecture, watermarking, late and out-of-order data"),
    ("Platform & cloud",
     "Azure (Functions, Data Lake Storage, Key Vault, API Management, DevOps), "
     "AWS (S3, Lambda, EKS), Terraform, Bicep, Docker, Kubernetes (AKS, EKS), "
     "GitHub Actions, ArgoCD, CI/CD, OIDC, Prometheus, Grafana, SLIs/SLOs"),
    ("AI",
     "LLM pipelines, RAG, Azure OpenAI, Semantic Kernel, Databricks ai_query, "
     "prompt versioning, LLM evaluation, AI agents, MCP, MLflow"),
    ("Languages & apps",
     "Python, SQL/KQL, C#/.NET 8, TypeScript, JavaScript/Node.js, Java, Rust, "
     "React, Angular, REST, GraphQL, Cypress"),
]

SKILLS_FDE = [
    ("Build & ship",
     "Python, TypeScript, React, Node.js, C#/.NET 8, Java, SQL/KQL, REST, GraphQL, "
     "Cypress, Rust"),
    ("AI",
     "LLM apps and pipelines, RAG, AI agents, MCP, LLM evaluation, Azure OpenAI, "
     "Semantic Kernel, Databricks ai_query, prompt versioning, MLflow"),
    ("Data",
     "Databricks (Lakeflow/DLT, Unity Catalog), Apache Spark, PySpark, Delta Lake, "
     "Airflow, Snowflake, Kafka, Event Hubs, Azure Data Explorer, ETL/ELT, CDC, data warehousing, "
     "data modeling, data quality, governance"),
    ("Cloud & delivery",
     "Azure, AWS (S3, Lambda, EKS), Terraform, Bicep, Docker, Kubernetes, "
     "GitHub Actions, Azure DevOps, ArgoCD, OIDC, Prometheus, Grafana, SLIs/SLOs"),
    ("Working with customers",
     "Workflow discovery with operations teams, rapid prototyping, production "
     "rollout, stakeholder management"),
]

VARIANTS = {
    "Data_Platform": {
        "headline": "Data & AI Platform Engineer",
        "summary": (
            "Data and AI platform engineer with 6+ years of experience. Started in "
            "full-stack product work in Pune, moved to mortgage data pipelines and "
            "APIs at Freddie Mac while earning an MS in Computer Science at NJIT, "
            "and now own Pittsburgh International Airport's data platform end to "
            "end: ~50 source connectors, 60 Databricks pipelines, real-time IoT "
            "streams and LLM enrichment, all deployed as code. Focus: correct data "
            "under late, duplicated and out-of-order events, freshness SLOs, and AI "
            "outputs that are versioned, evaluated and auditable."
        ),
        "skills": SKILLS_DATA,
        "acaa": ["lakehouse", "ingestion", "cost", "streaming", "platform", "llm", "rag", "users"],
        "projects": ["forge", "agent", "labs", "vela"],
    },
    "Forward_Deployed": {
        "headline": "Data & AI Engineer | Forward-Deployed Builder",
        "summary": (
            "Engineer who builds data and AI systems alongside the people who use "
            "them, 6+ years. Started in full-stack product work in Pune, moved to "
            "mortgage data pipelines and APIs at Freddie Mac while earning an MS in "
            "Computer Science at NJIT, and now own Pittsburgh International "
            "Airport's data and AI platform. The loop: sit with the operations "
            "team, map the real workflow, ship a working version fast, measure it, "
            "then harden it into a platform. Shipped LLM enrichment, RAG agents with "
            "evaluation sets, streaming IoT pipelines and React apps staff use daily."
        ),
        "skills": SKILLS_FDE,
        "acaa": ["users", "rag", "llm", "ingestion", "lakehouse", "streaming", "platform", "cost"],
        "projects": ["agent", "forge", "vela", "labs"],
    },
}


def jobs(v):
    return [
        (
            "Analytics Full Stack Developer (Data & AI Platform Engineering)",
            "Jan 2024 – Present",
            "Pittsburgh International Airport (Allegheny County Airport Authority), Pittsburgh, PA",
            ACAA_SCOPE,
            [ACAA[k] for k in v["acaa"]],
        ),
        ("Software Engineer", "Sep 2022 – Nov 2023",
         "Freddie Mac, New York, NY (remote)", FREDDIE_SCOPE, FREDDIE),
        ("Software Engineer, Full-Stack", "Jan 2019 – Jul 2021",
         "Top Hat Software Technologies, Pune, India", TOPHAT_SCOPE, TOPHAT),
    ]


# ---------------------------------------------------------------- DOCX

INK = RGBColor(0x11, 0x11, 0x11)
MUTED = RGBColor(0x44, 0x44, 0x44)


def _border_bottom(paragraph):
    p_pr = paragraph._p.get_or_add_pPr()
    bdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    for k, val in (("w:val", "single"), ("w:sz", "6"), ("w:space", "1"), ("w:color", "999999")):
        bottom.set(qn(k), val)
    bdr.append(bottom)
    p_pr.append(bdr)


def build_docx(v, path):
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Inches(8.5), Inches(11)
    sec.left_margin = sec.right_margin = Inches(0.6)
    sec.top_margin = sec.bottom_margin = Inches(0.5)
    right_tab = sec.page_width - sec.left_margin - sec.right_margin

    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    normal.font.size = Pt(10)
    normal.font.color.rgb = INK
    normal.paragraph_format.space_after = Pt(0)
    normal.paragraph_format.line_spacing = 1.0

    def para(text="", size=None, bold=False, color=None, after=0, before=0, italic=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(after)
        p.paragraph_format.space_before = Pt(before)
        if text:
            r = p.add_run(text)
            r.bold, r.italic = bold, italic
            if size:
                r.font.size = Pt(size)
            if color:
                r.font.color.rgb = color
        return p

    def heading(text):
        p = para(text.upper(), size=10.5, bold=True, before=7, after=3)
        _border_bottom(p)

    def bullet(text):
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(1.5)
        p.paragraph_format.left_indent = Inches(0.2)
        p.paragraph_format.first_line_indent = Inches(-0.14)
        p.add_run(text)

    def line_with_date(left, right, bold=True):
        p = para(before=5)
        p.paragraph_format.tab_stops.add_tab_stop(right_tab, WD_TAB_ALIGNMENT.RIGHT)
        r = p.add_run(left)
        r.bold = bold
        r2 = p.add_run("\t" + right)
        r2.bold = bold

    para(NAME, size=20, bold=True)
    para(v["headline"], size=11.5, color=MUTED, after=2)
    para(" | ".join(CONTACT), size=9, color=MUTED, after=2)

    heading("Summary")
    para(v["summary"])

    heading("Skills")
    for group, items in v["skills"]:
        p = para(after=1)
        p.add_run(group + ": ").bold = True
        p.add_run(items)

    heading("Experience")
    for title, dates, org, scope, bullets in jobs(v):
        line_with_date(title, dates)
        para(org, italic=True, color=MUTED, after=1)
        para(scope, after=1)
        for b in bullets:
            bullet(b)

    heading("Projects")
    for key in v["projects"]:
        name, tech, where, desc = PROJECTS[key]
        p = para(before=3)
        p.add_run(name).bold = True
        p.add_run(f" | {tech} | {where}").font.color.rgb = MUTED
        para(desc)

    heading("Certifications")
    for c in CERTS:
        para(c)

    heading("Education")
    for degree, year in EDUCATION:
        p = para()
        p.paragraph_format.tab_stops.add_tab_stop(right_tab, WD_TAB_ALIGNMENT.RIGHT)
        p.add_run(degree)
        p.add_run("\t" + year)

    doc.core_properties.author = NAME
    doc.core_properties.title = f"{NAME} Resume - {v['headline']}"
    doc.save(path)


# ---------------------------------------------------------------- PDF (via HTML)

CSS = """
@page { size: Letter; margin: 0.5in 0.6in; }
* { box-sizing: border-box; }
body { font-family: Calibri, Carlito, Arial, sans-serif; font-size: 10pt; color: #111;
       line-height: 1.22; margin: 0; }
h1 { font-size: 20pt; margin: 0; }
.headline { font-size: 11.5pt; color: #444; margin: 0 0 2pt; }
.contact { font-size: 9pt; color: #444; margin: 0 0 2pt; }
h2 { font-size: 10.5pt; text-transform: uppercase; letter-spacing: .04em; margin: 8pt 0 3pt;
     padding-bottom: 1pt; border-bottom: 0.75pt solid #999; }
p { margin: 0; }
.row { display: flex; justify-content: space-between; font-weight: 700; margin-top: 5pt; }
.org { font-style: italic; color: #444; margin-bottom: 1pt; }
ul { margin: 1pt 0 0; padding-left: 14pt; }
li { margin-bottom: 1.5pt; }
.skill { margin-bottom: 2.5pt; }
.proj { margin-top: 3pt; }
.muted { color: #444; }
.edu { display: flex; justify-content: space-between; }
.job, .proj { break-inside: avoid; }
"""


def build_html(v):
    e = html.escape
    out = [f"<!doctype html><html lang='en'><head><meta charset='utf-8'><title>{e(NAME)} Resume</title>"
           f"<style>{CSS}</style></head><body>"]
    out.append(f"<h1>{e(NAME)}</h1><p class='headline'>{e(v['headline'])}</p>")
    out.append(f"<p class='contact'>{e(' | '.join(CONTACT))}</p>")
    out.append(f"<h2>Summary</h2><p>{e(v['summary'])}</p>")
    out.append("<h2>Skills</h2>")
    for g, items in v["skills"]:
        out.append(f"<p class='skill'><b>{e(g)}:</b> {e(items)}</p>")
    out.append("<h2>Experience</h2>")
    for title, dates, org, scope, bullets in jobs(v):
        out.append(f"<div class='job'><div class='row'><span>{e(title)}</span><span>{e(dates)}</span></div>"
                   f"<p class='org'>{e(org)}</p><p>{e(scope)}</p><ul>")
        out += [f"<li>{e(b)}</li>" for b in bullets]
        out.append("</ul></div>")
    out.append("<h2>Projects</h2>")
    for key in v["projects"]:
        name, tech, where, desc = PROJECTS[key]
        out.append(f"<div class='proj'><p><b>{e(name)}</b><span class='muted'> | {e(tech)} | {e(where)}</span></p>"
                   f"<p>{e(desc)}</p></div>")
    out.append("<h2>Certifications</h2>" + "".join(f"<p>{e(c)}</p>" for c in CERTS))
    out.append("<h2>Education</h2>" + "".join(
        f"<div class='edu'><span>{e(d)}</span><span>{e(y)}</span></div>" for d, y in EDUCATION))
    out.append("</body></html>")
    return "".join(out)


def build_pdf(v, html_path, pdf_path):
    html_path.write_text(build_html(v), encoding="utf-8")
    subprocess.run(
        [str(EDGE), "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
         f"--print-to-pdf={pdf_path}", html_path.as_uri()],
        check=True, capture_output=True, timeout=120,
    )


def main():
    build = HERE / "build"
    build.mkdir(exist_ok=True)
    for key, v in VARIANTS.items():
        stem = f"Siddhesh_Amrale_Resume_{key}"
        build_docx(v, HERE / f"{stem}.docx")
        build_pdf(v, build / f"{stem}.html", HERE / f"{stem}.pdf")
        print("built", stem)
    return 0


if __name__ == "__main__":
    sys.exit(main())
