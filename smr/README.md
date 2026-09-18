# SMR Instrumentation Integrity

Teaching package aligned with **Oklo-style** themes: instrumentation & controls, process data integrity, missing samples must never become zero, trip setpoints, and reproducible analysis pipelines for reactor/test-platform telemetry.

**Honesty:** this is not a nuclear plant, not NQA-1 qualified software, and not Oklo IP. It demonstrates data-integrity invariants that matter when software meets safety-critical sensors.

```bash
pip install -e "./smr[dev]"
python -m pytest -q
python -m smr build-cases --out public/smr
```
