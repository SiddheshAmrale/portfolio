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

**Stack:** React 18 + TypeScript + Tailwind on Vite. Type: Barlow (DIN-style, SIL OFL), black / warm-white / gold palette. The home page is
prerendered to static HTML at build time (`scripts/prerender.mjs`), so it
paints before any JavaScript runs, then hydrates. Every lab is its own lazy
chunk; the home page never downloads lab code.

**Motion, on a budget:**

- Every continuous animation is compositor-only (`transform` / `opacity` on
  HTML layers): the hero aurora (drifting gradient blobs), the floating agents,
  the beams firing, the command core. A WebGL shader and SVG-internal
  animations were measured and removed: both cost main-thread time per frame.
- Below-the-fold sections use `content-visibility: auto`; animated regions
  pause while off screen (`[data-motion]`).
- Scroll reveals via one IntersectionObserver; cursor spotlight via one
  delegated, rAF-throttled pointer listener. `prefers-reduced-motion` is honoured.

**Performance** (Lighthouse mobile, simulated throttling, same compressing
server, median of 3):

| | Before (CRA, Netflix theme) | After |
|---|---|---|
| Performance | 71 | **96** |
| Total Blocking Time | 1602 ms | **45 ms** |
| Largest Contentful Paint | 2.36 s | **2.49 s** |
| Accessibility | 82 | **97** |
| Best Practices | 96 | **100** |
| Home-page JS (gzip) | 140 KB (everything) | ~71 KB (labs lazy) |

**Portrait:** a head-and-shoulders 3D avatar at
`src/assets/me/avatar-face.webp` sits in the command core at the centre of the
agent scene. Remove it and the core shows the SA monogram instead.

```bash
npm run dev        # http://localhost:5173
npm run build      # typecheck, client + SSR build, prerender -> build/
npm run preview    # serve build/
```

Deployed by Azure Static Web Apps (`.github/workflows/`), output `build/`.
`public/staticwebapp.config.json` serves `app.html` as the SPA fallback for
`/labs/*` and `/learn`, and long-caches hashed `/assets/*`.
