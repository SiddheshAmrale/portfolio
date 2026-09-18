# Pilot

Python software for connectivity-telemetry investigations: **data quality**, **incident diagnosis**, and **release regression**. The website is a viewer over cases this package writes.

```bash
pip install -e "./pilot[dev]"
python -m pytest -q
python -m pilot run-linux --out public/pilot/linux      # Linux only: veth + netem + cgroup
python -m pilot eval-linux --dir public/pilot/linux
python -m pilot build-cases --out public/pilot
```

GitHub Actions runs the live experiments on `ubuntu-latest`. Constructed traces remain the unit-test fixture and the calibration split. Live runs are a separate evaluation. Software netem is **not** optical BER/FEC.

## What is in an observation

Run / source / interface identity, observation time vs arrival time, metric name/value/unit/type, scrape sequence, collector epoch, collection status (`ok|missing|unsupported|failed`), source record reference. Linux `/proc/net/dev` columns are never collapsed into a single “errors” series. `TcpRetransSegs` is not `rx_errs`.

Ground truth for live experiments is `public/pilot/linux/ground_truth.jsonl`. It is not a field on `Observation`. `diagnose()` does not read it.

## Experiments

| Condition | Injector | Must not be an input to `diagnose()` |
|---|---|---|
| healthy | none | yes |
| delay | `tc netem delay 80ms` on a veth pair | yes |
| loss | `tc netem loss 15%` | yes |
| cpu | cgroup v2 `cpu.max` on the server process | yes |
| stale | collector pauses network scrapes | yes |
| mixed | loss + cpu | yes |

A run is counted for accuracy only if the workload actually moved (`impairment_confirmed`). Frozen rules were not retuned on the live split.

Prometheus already handles counter resets. The quality path classifies wrap / restart / reorder / identity / **ambiguous (no invented rate)**.
