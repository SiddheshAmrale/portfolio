# SMR Instrumentation Integrity

Teaching package aligned with **Oklo-style** themes:

- Instrumentation & controls: missing samples must never become zero
- Trip setpoints on trusted `ok` samples only (coolant temperature + neutron flux)
- Stale / failed channel status
- Physics-result store: design_id + code + git_sha identity, missing keff stays null, A/A reproducibility vs code drift

**Honesty:** this is not a nuclear plant, not NQA-1 qualified software, and not Oklo IP. It demonstrates data-integrity invariants that matter when software meets safety-critical sensors and multiphysics CI.

```bash
pip install -e "./smr[dev]"
python -m pytest -q
python -m smr build-cases --out public/smr
```
