# Siddhesh Amrale — portfolio + systems workbench

The recruiter-facing site is a prerendered, motion-designed single page (see below). Technical substance for Credo / Broadcom / Marvell / Oklo / Databricks / Netflix DE:

| Package / route | Target theme | Reproduce |
|---|---|---|
| [`pilot/`](pilot/README.md) · `/labs/incident` | Credo PILOT telemetry + live Ubuntu netns | `npm run pilot:test` |
| [`forge/`](forge/README.md) · `/labs/forge` | Databricks medallion/CDC + Netflix allocation health (SRM, lag SLO) | `npm run labs:test` |
| [`link/`](link/README.md) · `/labs/link` | SerDes / photonics vocab + Link Health Score | `npm run labs:test` |
| [`smr/`](smr/README.md) · `/labs/smr` | Oklo-style I&C integrity (missing≠zero, multi-channel trips) | `npm run labs:test` |
| `/learn` | Guided practical academy (must-know → practice → self-check) | open the app |

```bash
git clone https://github.com/SiddheshAmrale/portfolio.git
cd portfolio
npm install
python -m pip install -e "./pilot[dev]" -e "./forge[dev]" -e "./link[dev]" -e "./smr[dev]"
npm run labs:test
npm run labs:cases
npm run workbench:test
npm run dev
```

**Honest elite bar:** interview-grade with reproducible failure modes and live Linux evidence — not ASIC silicon, Databricks Runtime, Netflix ExP, or NQA-1 plant software. See `/learn` → Scorecard.

The older TypeScript workbenches still live in [`src/labs`](src/labs/README.md) and [SiddheshAmrale/systems-workbench](https://github.com/SiddheshAmrale/systems-workbench).

---

# The site

**Stack:** React 18 + TypeScript + Tailwind on Vite. The home page is
prerendered to static HTML at build time (`scripts/prerender.mjs`), so it
paints before any JavaScript runs, then hydrates. Every lab is its own lazy
chunk; the home page never downloads lab code.

**Motion, on a budget:**

- Hero backdrop: one fragment shader (domain-warped aurora) at 35% resolution,
  30 fps, paused off screen / in background tabs, skipped on software GPUs.
- Agent scene: inline SVG + CSS keyframes (beams, floating agents, task log);
  all compositor-friendly and paused while off screen (`[data-motion]`).
- Scroll reveals via one IntersectionObserver; cursor spotlight via one
  delegated, rAF-throttled pointer listener. `prefers-reduced-motion` is honoured.

**Performance** (Lighthouse mobile, simulated throttling, same compressing
server, median of 3):

| | Before (CRA, Netflix theme) | After |
|---|---|---|
| Performance | 71 | **93** |
| Total Blocking Time | 1602 ms | **265 ms** |
| Largest Contentful Paint | 2.36 s | **1.96 s** |
| Accessibility | 82 | **97** |
| Best Practices | 96 | **100** |
| Home-page JS (gzip) | 140 KB (everything) | ~71 KB (labs lazy) |

**3D portrait:** put a generated portrait at
`src/assets/me/avatar-3d.webp` (or `.png` / `.jpg`, ideally a transparent
cut-out) and the hero places it at the centre of the agent scene with parallax
tilt, breathing and a light sweep. Without it, a holographic command core sits
at the centre.

```bash
npm run dev        # http://localhost:5173
npm run build      # typecheck, client + SSR build, prerender -> build/
npm run preview    # serve build/
```

Deployed by Azure Static Web Apps (`.github/workflows/`), output `build/`.
`public/staticwebapp.config.json` serves `app.html` as the SPA fallback for
`/labs/*` and `/learn`, and long-caches hashed `/assets/*`.
