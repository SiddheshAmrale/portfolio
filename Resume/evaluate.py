"""Scores resumes against the skills demanded in the job research.

    python evaluate.py

Coverage = share of skill mentions across the researched roles (weighted by how
many roles ask for the skill) that appear in the resume's extracted PDF text.
The text comes from pdftotext, roughly what an ATS parser sees.
"""

import collections
import json
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
JOBS = HERE.parent / "research" / "job-descriptions" / "2026-10-11-big-companies.json"

# research skill label -> patterns that count as a match in resume text
SYN = {
    "sql": [r"\bsql\b"], "python": [r"\bpython\b"], "spark": [r"\bspark\b"],
    "pyspark": [r"pyspark"], "redshift": [r"redshift"], "airflow": [r"airflow"],
    "aws": [r"\baws\b"], "kafka": [r"kafka"], "databricks": [r"databricks"],
    "snowflake": [r"snowflake"], "etl": [r"\betl\b"], "etl/elt": [r"\belt\b"],
    "java": [r"\bjava\b"], "bigquery": [r"bigquery"], "dbt": [r"\bdbt\b"],
    "data modelling": [r"data model|dimensional model"], "streaming": [r"stream"],
    "ml data": [r"\bml\b|mlflow"], "azure": [r"azure"], "iceberg": [r"iceberg"],
    "gcp": [r"\bgcp\b|google cloud"], "rag": [r"\brag\b"], "evals": [r"evaluat"],
    "rag/evals": [r"\brag\b"], "data quality": [r"data quality|quality checks"],
    "genai": [r"llm|generative|genai"], "data warehousing": [r"warehous"],
    "governance": [r"governance|governed"], "kinesis": [r"kinesis"],
    "kubernetes": [r"kubernetes"], "delta": [r"delta"], "scala": [r"scala"],
    "flink": [r"flink"], "tableau": [r"tableau"], "power bi": [r"power bi"],
    "agents": [r"agent"], "typescript": [r"typescript"], "react": [r"react"],
    "vertex": [r"vertex"], "gemini": [r"gemini"], "mlops": [r"mlops|mlflow"],
    "terraform": [r"terraform"], "mcp": [r"\bmcp\b"], "multi-agent": [r"multi-agent"],
    "llm apps": [r"llm"], "llm": [r"llm"], "nlp/ml": [r"nlp|sentiment"],
    "cloud-native architecture": [r"kubernetes|serverless"], "ml": [r"\bml\b|mlflow"],
}


def labels(skill):
    """Split compound research labels like 'kafka/flink' or 'gcp/bigquery'."""
    s = skill.lower()
    if s in SYN:
        return [s]
    parts = [p.strip() for p in re.split(r"[/,]", s) if p.strip()]
    return [p for p in parts if p in SYN] or [s]


def demand():
    roles = json.loads(JOBS.read_text(encoding="utf-8"))["roles"]
    out = {}
    for fam in ("Data Engineer", "Forward Deployed Engineer"):
        c = collections.Counter()
        for r in (r for r in roles if r["family"] == fam):
            for s in r["skills"]:
                for lab in labels(s):
                    c[lab] += 1
        out[fam] = c
    return out


def text(pdf):
    return subprocess.run(["pdftotext", "-layout", str(pdf), "-"], capture_output=True,
                          text=True, encoding="utf-8", errors="replace").stdout.lower()


def score(t, counter):
    hit, miss, total, got = [], [], 0, 0
    for lab, n in counter.most_common():
        pats = SYN.get(lab)
        if not pats:
            continue
        total += n
        if any(re.search(p.replace(' ', r'\s+'), t) for p in pats):
            got += n
            hit.append((lab, n))
        else:
            miss.append((lab, n))
    return round(100 * got / total), hit, miss


def main():
    d = demand()
    resumes = {
        # the Aug 2025 resume, kept out of the repo root: git show c062a6b:Resume/Siddhesh_Amrale_Resume.pdf
        "Original (Aug 2025)": HERE / "build" / "original_2025.pdf",
        "Current": HERE / "Siddhesh_Amrale_Resume.pdf",
    }
    for name, pdf in resumes.items():
        if not pdf.exists():
            continue
        t = text(pdf)
        words = len(t.split())
        print(f"\n## {name}  ({words} words)")
        for fam, c in d.items():
            pct, hit, miss = score(t, c)
            print(f"  {fam}: {pct}% of demand covered; missing: "
                  + ", ".join(f"{m} ({n})" for m, n in miss[:10]))


if __name__ == "__main__":
    main()
