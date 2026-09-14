# Portfolio project recommendations

Analysis date: 14 September 2026  
Source: `research/career-research-audit.md`

## What the audit actually asks the portfolio to do

The audit is not asking for four more domain demos. It rejects recruiter-score checklists and generic assembly work (deploy a serving stack, run stock benchmarks, draw a healthcare dashboard, invent optical telemetry). The correct unit of progress is a **difficult problem investigated with a pinned baseline, root-cause evidence, an intervention, held-out checks, and cases where the change fails**.

It also separates:

1. **Deep AI systems** (runtime, GPU performance, communication, fleet reliability) as the primary exploration.
2. **Quantum compiler / control / hybrid HPC software** as the serious comparison track, not a tutorial circuit.
3. **PQC migration** as a security-engineering alternative, not a “quantum” label.
4. **Power / industrial operations** only if the work is diagnostics, repair, or safe automation with realistic delays — not a synthetic scheduler.

Healthcare and optical-emulator ideas are deferred.

## Projects to remove

Remove the current portfolio entries (e-commerce, task app, API gateway, analytics dashboard, ML API, GPT wrappers, RAG chatbot, CV system, game engine, and similar). They do not demonstrate the specialization the audit recommends, and several over-claim production ML systems that are not playable from this site.

## Projects to add (playable labs in this repo)

Each card on the portfolio opens an in-browser lab. These are **independent technical investigations at demonstration scale**: discrete-event and mathematical models with documented assumptions. They are not cluster measurements, upstream commits, or production ownership.

| Lab | Route | Audit mapping | What a visitor can do |
|---|---|---|---|
| Inference Runtime Investigation | `/labs/inference` | Primary experiment: cancellation/retry leak, noisy-neighbor tail latency, isolation overhead | Pin a baseline, run the intervention, inspect slot timelines and attribution, run correctness tests, see a case where isolation hurts batch jobs |
| Quantum Compiler + Hybrid Orchestration | `/labs/quantum` | Quantum comparison: compiler transformation with semantic checks; execution/recovery semantics | Apply real passes, verify statevector fidelity, break correctness with a buggy pass, submit hybrid jobs and compare naive vs exactly-once recovery |
| PQC Migration Compatibility | `/labs/pqc` | Security branch: inventory, hybrid migration, rotation, rollback, performance | Scan services, choose classical/hybrid/PQC-only, generate mixed client traffic, rotate/rollback, observe oversized-handshake failures |
| GPU Fleet Reliability Diagnostics | `/labs/fleet` | Power/ops retained as diagnostics and repair, not a novel scheduler | Watch telemetry, distinguish GPU watts from lagged facility energy, run probes, drain/reset/isolate, compare reboot-storm vs diagnose-then-act |

## Why not the original four learning ideas

- Recreating vLLM / llm-d / Dynamo serving features is useful practice and weak evidence.
- A simulated power scheduler without operator review or real measurements over-claims.
- A healthcare demo and an optical emulator were explicitly deferred unless a target team supplies a real problem.

## Honesty constraints baked into the labs

- Multi-GPU *network-scaling* claims are not made from a browser model.
- Quantum work is compiler/orchestrator software, not a claim of hardware research qualification.
- PQC uses published algorithm sizes and handshake-cost ratios; it does not invent primitives.
- Evidence level is **learning / independent investigation**, not external validation or sustained ownership.
