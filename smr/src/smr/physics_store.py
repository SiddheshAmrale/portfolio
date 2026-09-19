"""Reactor physics-result store teaching helpers (Oklo software-engineer theme)."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any, Optional, Sequence


@dataclass(frozen=True)
class PhysicsResult:
    run_id: str
    design_id: str
    code: str
    git_sha: str
    params: dict[str, Any]
    keff: Optional[float]
    peak_temp_c: Optional[float]
    status: str  # ok | missing_field | failed


def manifest_hash(result: PhysicsResult) -> str:
    payload = {
        "run_id": result.run_id,
        "design_id": result.design_id,
        "code": result.code,
        "git_sha": result.git_sha,
        "params": result.params,
        "keff": result.keff,
        "peak_temp_c": result.peak_temp_c,
        "status": result.status,
    }
    blob = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()[:16]


def validate_result(result: PhysicsResult) -> dict[str, Any]:
    missing = []
    if result.keff is None:
        missing.append("keff")
    if result.peak_temp_c is None:
        missing.append("peak_temp_c")
    if not result.git_sha:
        missing.append("git_sha")
    ok = result.status == "ok" and not missing
    return {
        "run_id": result.run_id,
        "ok": ok,
        "missing_fields": missing,
        "manifest_hash": manifest_hash(result),
        "notes": (
            "Physics results need identity (design, code, git_sha) and required fields. "
            "Missing keff must stay null — not zero — for reproducibility gates."
        ),
    }


def compare_runs(a: PhysicsResult, b: PhysicsResult, keff_tol: float = 5e-4) -> dict[str, Any]:
    va, vb = validate_result(a), validate_result(b)
    same_design = a.design_id == b.design_id
    same_code = a.code == b.code and a.git_sha == b.git_sha
    reproducible = False
    delta_keff = None
    if va["ok"] and vb["ok"] and a.keff is not None and b.keff is not None:
        delta_keff = abs(a.keff - b.keff)
        reproducible = same_design and same_code and delta_keff <= keff_tol
    return {
        "same_design": same_design,
        "same_code_revision": same_code,
        "delta_keff": delta_keff,
        "keff_tol": keff_tol,
        "reproducible": reproducible,
        "a": va,
        "b": vb,
        "notes": (
            "Oklo-style reactor data platforms store physics results with CI/CD identity. "
            "A/A reruns on the same design+sha must match within tolerance."
        ),
    }


def demo_cases() -> list[dict[str, Any]]:
    good_a = PhysicsResult(
        "r1", "core_v3", "neutronics_toy", "abc1234",
        {"enrichment": 0.19, "power_mw": 15}, 1.0452, 512.0, "ok",
    )
    good_b = PhysicsResult(
        "r2", "core_v3", "neutronics_toy", "abc1234",
        {"enrichment": 0.19, "power_mw": 15}, 1.0453, 511.8, "ok",
    )
    missing = PhysicsResult(
        "r3", "core_v3", "neutronics_toy", "abc1234",
        {"enrichment": 0.19, "power_mw": 15}, None, 512.0, "missing_field",
    )
    drifted = PhysicsResult(
        "r4", "core_v3", "neutronics_toy", "def9999",
        {"enrichment": 0.19, "power_mw": 15}, 1.0510, 520.0, "ok",
    )
    return [
        {
            "id": "physics_repro_ok",
            "title": "Reproducible physics A/A",
            "question": "Same design + git_sha must reproduce keff within tolerance.",
            "theme": "Oklo reactor data / CI multiphysics",
            "compare": compare_runs(good_a, good_b),
            "results": [
                {**good_a.__dict__, "manifest_hash": manifest_hash(good_a)},
                {**good_b.__dict__, "manifest_hash": manifest_hash(good_b)},
            ],
        },
        {
            "id": "physics_missing_keff",
            "title": "Missing keff stays missing",
            "question": "A physics result without keff must fail validation — not store 0.0.",
            "theme": "Oklo reactor data integrity",
            "compare": compare_runs(good_a, missing),
            "results": [
                {**good_a.__dict__, "manifest_hash": manifest_hash(good_a)},
                {**missing.__dict__, "manifest_hash": manifest_hash(missing)},
            ],
        },
        {
            "id": "physics_code_drift",
            "title": "Code revision drift",
            "question": "Different git_sha is not an A/A — flag as non-reproducible comparison.",
            "theme": "Oklo multiphysics CI/CD",
            "compare": compare_runs(good_a, drifted),
            "results": [
                {**good_a.__dict__, "manifest_hash": manifest_hash(good_a)},
                {**drifted.__dict__, "manifest_hash": manifest_hash(drifted)},
            ],
        },
    ]
