from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .integrity import SOFTWARE, TripSetpoint, evaluate_trips, integrity_report, simulate_channel
from .physics_store import demo_cases as physics_demo_cases


def all_cases() -> list[dict[str, Any]]:
    trips = [
        TripSetpoint("coolant_temp", high=330.0, action="high_temp_alarm"),
        TripSetpoint("neutron_flux", high=1.2e6, action="high_flux_alarm"),
    ]
    modes = [
        ("healthy", "Healthy coolant channel", "ok samples; trip stays quiet.", "coolant_temp", 300.0, "C"),
        ("missing_gap", "Missing samples stay missing", "Gaps must be null, not zero.", "coolant_temp", 300.0, "C"),
        ("zero_filled_bug", "Zero-fill anti-pattern", "Treating missing as 0 destroys trip logic and means.", "coolant_temp", 300.0, "C"),
        ("stale", "Stale channel", "Frozen values must be marked stale.", "coolant_temp", 300.0, "C"),
        ("trip_high", "High-temp trip", "Crossing setpoint fires the alarm on ok samples only.", "coolant_temp", 300.0, "C"),
        ("sensor_fail", "Sensor failed", "Failed status withholds values.", "coolant_temp", 300.0, "C"),
        ("trip_high", "High neutron flux trip", "Same integrity rules on a second process channel.", "neutron_flux", 8.0e5, "n/cm2/s"),
    ]
    cases = []
    for mode, title, question, channel, base, unit in modes:
        rows = simulate_channel(channel, mode=mode, base=base, unit=unit)
        report = integrity_report(rows)
        trip = evaluate_trips(rows, [t for t in trips if t.channel == channel])
        cases.append({
            "id": mode + "_" + channel,
            "title": title,
            "question": question,
            "software": SOFTWARE,
            "disclaimer": "Teaching model for advanced-fission I&C data integrity. Not NQA-1 software. Not Oklo plant data.",
            "theme": "Oklo / SMR instrumentation",
            "ground_truth": mode,
            "samples": [r.to_dict() for r in rows],
            "series": [{"t": r.t_ms, "v": r.value, "status": r.status} for r in rows],
            "integrity": report,
            "trips": trip,
            "channel": channel,
            "unit": unit,
        })
    for p in physics_demo_cases():
        cases.append({
            "id": p["id"],
            "title": p["title"],
            "question": p["question"],
            "software": SOFTWARE,
            "disclaimer": "Teaching physics-result store. Not Oklo plant multiphysics or NQA-1.",
            "theme": p["theme"],
            "ground_truth": p["id"],
            "samples": [],
            "series": [],
            "integrity": {
                "missing_visible": bool(p["compare"]["b"]["missing_fields"]),
                "safe_mean": None,
                "naive_mean": None,
                "zero_filled_suspicion": False,
                "stale_count": 0,
                "failed_count": 0 if p["compare"]["a"]["ok"] else 1,
                "notes": p["compare"]["notes"],
            },
            "trips": [],
            "physics": p,
        })
    return cases


def build(out_dir: str | Path) -> Path:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    cases = all_cases()
    index = {
        "software": SOFTWARE,
        "cases": [{"id": c["id"], "title": c["title"]} for c in cases],
        "keywords": [
            "instrumentation", "controls", "SCADA", "missing data", "trip setpoint",
            "advanced fission", "SMR", "data integrity", "NQA-1 awareness",
            "reactor data", "physics results", "CI/CD multiphysics", "reproducibility",
        ],
        "disclaimer": "Not nuclear-qualified software. Interview-aligned invariants only.",
        "reproduce": "pip install -e ./smr && python -m pytest -q && python -m smr build-cases",
    }
    (out / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")
    (out / "cases.json").write_text(json.dumps(cases, indent=2), encoding="utf-8")
    return out
