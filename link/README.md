# Link Integrity Lab

Teaching models for **Credo PILOT / Broadcom / Marvell / silicon-photonics** vocabulary:

- Per-lane BER vs application packet loss (they are not the same)
- FEC coding gain + uncorrectable histogram bins
- Eye quality / SNR / jitter proxies
- Composite Link Health Score (didactic weights)
- Link flaps vs SNR fade vs jitter-limited eye closure
- Electrical path vs optical (OMA/TDECQ-style) impairments

**Honesty:** these are mathematical teaching models with pinned seeds. They are **not** post-silicon measurements from a BERT, DCA, or PIC. Do not claim optical BER from software `netem`.

```bash
pip install -e "./link[dev]"
python -m pytest -q
python -m link build-cases --out public/link
```
