# Systems workbench

Independent investigations for inference runtime behavior, a quantum compiler plus hybrid-job recovery, PQC TLS migration, and GPU fleet diagnostics.

This package is the source of truth. The portfolio UI at `/labs/*` is a viewer over the same engines. You do not need the website to reproduce the results.

These are **pinned-seed models**, not cluster measurements, hardware compiler results, or a claim that anyone else has adopted the code.

## Reproduce without the site

Requires Node 20+.

```bash
git clone <this-repo>
cd portfolio
npm install
npm run workbench:test
npm run workbench
```

`npm run workbench:test` runs the Jest suite (occupancy invariants, unitary fidelity, FIPS sizes, isolate/PUE checks).

`npm run workbench` re-runs the four investigations, prints a lab-notebook report, and writes:

- `reports/latest.md`
- `reports/latest.json`

Exit code is 1 if any check fails.

## Library

```ts
import {
  runAllInvestigations,
  runSimulation,
  compileCircuit,
  minBasisFidelity,
  runPqcTests,
  fleetSelfTest
} from './src/labs';
```

| Investigation | What is pinned | What would falsify it |
|---|---|---|
| Inference runtime | Discrete-event GPU slots, cancel at kernel boundary vs timeout retry without cancel | Occupancy above capacity, late delivery after client-gone, intervention leak not below baseline on the fixture |
| Quantum compiler | Statevector fidelity over **all** 2ⁿ basis states; naive vs exactly-once classical publish | Fidelity drop after cancel/merge, buggy adjacent-swap not caught, exactly-once still duplicating writes |
| PQC migration | FIPS 203/204 sizes, hybrid ClientHello vs 1500 B inspector, dual-publish/rollback | Hybrid hello ≤ 1500 B still “failing” the WAF, invented primitive sizes |
| GPU fleet | Lagged facility power (PUE 1.32), drain/reset/isolate | Facility energy identical to GPU energy, ECC DBE recommending blind reboot |

## What this is not

- Not vLLM / Triton / a production scheduler
- Not Qiskit, Cirq, or a hardware ISA compiler
- Not a TLS stack or a NIST submission
- Not DCGM on a real rack

Those are the elite bar. This repo is the investigation method plus code other people can run. Hardware results require a machine with the relevant devices and a separate measurement log.
