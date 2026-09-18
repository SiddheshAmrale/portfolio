# Link Integrity Lab

Teaching models for **Credo PILOT / Broadcom / Marvell / silicon-photonics** vocabulary:

- Per-lane BER vs application packet loss (they are not the same)
- FEC coding gain (approximate RS model)
- Eye quality / SNR proxies
- Link flaps vs steady degradation
- Electrical path vs optical path impairments

**Honesty:** these are mathematical teaching models with pinned seeds. They are **not** post-silicon measurements from a BERT, DCA, or PIC. Do not claim optical BER from software `netem`.

```bash
pip install -e "./link[dev]"
python -m pytest -q
python -m link build-cases --out public/link
```
