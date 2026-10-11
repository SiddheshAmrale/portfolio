import { useEffect, useRef } from 'react';
import { CoreOverlay, CorePanel } from './Core';

// Drop a generated 3D portrait at src/assets/me/avatar-3d.(webp|png|jpg) and
// the scene uses it (hashed, long-cached asset); otherwise a command core
// sits at the centre of the agents.
const found = import.meta.glob('../assets/me/avatar-3d.{webp,png,jpg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const PORTRAIT: string | undefined = Object.values(found)[0];

// "Orchestrator" scene: the agents, the beams that connect them to the centre
// and the centre itself (3D portrait or command core).
//
// Every continuous animation here is compositor-only (transform / opacity on
// HTML layers). Animations of SVG children run on the main thread every frame,
// which showed up as long tasks, so the SVG parts are static: the room, the
// faint beam lines and the terminal panel. Beams "fire" by fading a bright
// overlay layer per beam; agents float as HTML layers.

const AGENTS = [
  { x: 70, y: 96, label: 'RAG', d: 0 },
  { x: 410, y: 92, label: 'DATA', d: 0.6 },
  { x: 46, y: 262, label: 'CLOUD', d: 1.2 },
  { x: 434, y: 258, label: 'PERF', d: 1.8 },
  { x: 92, y: 420, label: 'EVAL', d: 2.4 },
  { x: 392, y: 424, label: 'ROBOTICS', d: 3 },
];
const HUB = PORTRAIT ? { x: 240, y: 330 } : { x: 240, y: 236 };

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

function beamPath(a: (typeof AGENTS)[number]) {
  const mx = (a.x + HUB.x) / 2;
  const my = Math.min(a.y, HUB.y) - 30;
  return `M${HUB.x} ${HUB.y} Q${mx} ${my} ${a.x} ${a.y + 4}`;
}

function Agent({ x, y, label, d }: (typeof AGENTS)[number]) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pct(x, 480), top: pct(y + 12, 520), width: '15%' }}>
      <div className="bot-float flex flex-col items-center" style={{ animationDelay: `${-d}s` }}>
        <span className="bot-antenna relative block h-[9%] w-full">
          <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_10px_#F2B530]" style={{ animationDelay: `${d * 0.5}s` }} />
        </span>
        <svg viewBox="-24 -20 48 40" className="w-[64%]" aria-hidden>
          <line x1="0" y1="-20" x2="0" y2="-13" stroke="#5b6377" strokeWidth="2" />
          <rect x="-19" y="-14" width="38" height="30" rx="13" fill="url(#botBody)" stroke="#33363f" />
          <rect x="-13" y="-7" width="26" height="14" rx="7" fill="#05070d" />
          <rect x="-8" y="-3" width="5" height="6" rx="2" fill="#F2B530" />
          <rect x="3" y="-3" width="5" height="6" rx="2" fill="#F2B530" />
          <rect x="-22" y="-2" width="4" height="9" rx="2" fill="#33363f" />
          <rect x="18" y="-2" width="4" height="9" rx="2" fill="#33363f" />
        </svg>
      </div>
      <div className="mt-[6%] flex justify-center">
        <span className="flex items-center gap-1 whitespace-nowrap rounded-full border border-gold/40 bg-ink-850 px-[0.6em] py-[0.25em] font-mono text-[clamp(7px,1.6vw,10px)] font-semibold tracking-[0.12em] text-fog-300">
          <span className="bot-status h-[0.55em] w-[0.55em] rounded-full bg-emerald-400" style={{ animationDelay: `${d}s` }} />
          {label}
        </span>
      </div>
    </div>
  );
}

function BeamLines() {
  return (
    <g>
      {AGENTS.map((a) => (
        <path key={a.label} d={beamPath(a)} fill="none" stroke="rgba(242,181,48,.16)" strokeWidth="1.2" strokeDasharray="3 5" />
      ))}
    </g>
  );
}

/** One bright overlay per beam; its opacity pulses in sequence. */
function BeamFire() {
  return (
    <>
      {AGENTS.map((a, i) => (
        <svg key={a.label} viewBox="0 0 480 520" className="beam-fire absolute inset-0 h-full w-full" style={{ animationDelay: `${i * 0.6}s` }} aria-hidden>
          <path d={beamPath(a)} fill="none" stroke={i % 2 ? '#5eead4' : '#F2B530'} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx={a.x} cy={a.y + 4} r="4" fill={i % 2 ? '#5eead4' : '#F2B530'} />
        </svg>
      ))}
    </>
  );
}

function Room() {
  return (
    <g>
      <rect width="480" height="520" fill="url(#room)" />
      {/* window light + shelf glow */}
      <rect x="318" y="40" width="130" height="150" rx="10" fill="url(#window)" opacity=".55" />
      <rect x="320" y="200" width="140" height="6" rx="3" fill="#22252c" />
      <rect x="320" y="206" width="140" height="22" fill="url(#shelfGlow)" opacity=".7" />
      <rect x="336" y="178" width="18" height="22" rx="3" fill="#2a2d36" />
      <rect x="358" y="170" width="12" height="30" rx="3" fill="#3a3326" />
      {/* plants */}
      <g fill="#1a2a24">
        <path d="M30 520 C20 440 40 380 70 350 C64 400 70 450 80 520Z" />
        <path d="M60 520 C70 430 110 390 140 380 C118 420 100 470 96 520Z" fill="#1f3a30" />
        <path d="M20 470 C0 420 10 380 30 360 C34 400 36 430 44 470Z" fill="#15211c" />
      </g>
      <rect x="40" y="488" width="56" height="32" rx="6" fill="#2a2c33" />
      {/* floor */}
      <rect y="470" width="480" height="50" fill="#050506" opacity=".7" />
      {/* lamp warm spill */}
      <circle cx="440" cy="30" r="140" fill="url(#lamp)" />
    </g>
  );
}

export default function AgentScene() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const onMove = (e: PointerEvent) => {
      const b = el.getBoundingClientRect();
      x = Math.max(-1, Math.min(1, (e.clientX - (b.left + b.width / 2)) / (b.width * 0.8)));
      y = Math.max(-1, Math.min(1, (e.clientY - (b.top + b.height * 0.3)) / (b.height * 0.8)));
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          el.style.setProperty('--lx', x.toFixed(3));
          el.style.setProperty('--ly', y.toFixed(3));
        });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const label = PORTRAIT ? 'Siddhesh orchestrating a team of AI agents' : 'A command core orchestrating a team of AI agents';
  // Layers, back to front: the static room (painted once), the portrait (an
  // <img>, composited), the beams + agents (own promoted layer), and the core
  // (HTML layers, composited). Keeping animated parts out of the room's SVG
  // stops Chrome from repainting the whole scene every frame.
  return (
    <div ref={ref} className="agent-scene relative" data-motion role="img" aria-label={label}>
      <div className="scene-tilt relative">
        <svg viewBox="0 0 480 520" className="block h-auto w-full" aria-hidden>
          <defs>
            <linearGradient id="room" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#12141b" />
              <stop offset="1" stopColor="#08090c" />
            </linearGradient>
            <linearGradient id="window" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1d2230" />
              <stop offset="1" stopColor="#0c0e14" />
            </linearGradient>
            <linearGradient id="shelfGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fbbf24" stopOpacity=".55" />
              <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="lamp">
              <stop offset="0" stopColor="#fbbf24" stopOpacity=".18" />
              <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>
          </defs>
          <Room />
          <BeamLines />
          {PORTRAIT ? null : <CorePanel x={HUB.x} y={HUB.y} />}
        </svg>

        {PORTRAIT ? (
          <div className="absolute overflow-hidden" style={{ left: '8.3%', top: '11.5%', width: '83.4%', height: '88.5%' }}>
            <img src={PORTRAIT} alt="" decoding="async" className="portrait-3d absolute inset-0 h-full w-full object-contain object-bottom" />
            <div className="light-sweep absolute inset-y-0 left-0 w-full bg-[linear-gradient(100deg,transparent_35%,rgba(165,243,252,.12)_50%,transparent_65%)]" />
          </div>
        ) : null}

        <BeamFire />
        <svg width="0" height="0" className="absolute" aria-hidden>
          <defs>
            <linearGradient id="botBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#262830" />
              <stop offset="1" stopColor="#131418" />
            </linearGradient>
          </defs>
        </svg>
        {AGENTS.map((a) => (
          <Agent key={a.label} {...a} />
        ))}

        {PORTRAIT ? (
          <div
            aria-hidden
            className="core-glow pointer-events-none absolute rounded-full bg-[radial-gradient(closest-side,rgba(242,181,48,.5),transparent)]"
            style={{ left: `${(HUB.x / 480) * 100}%`, top: `${(HUB.y / 520) * 100}%`, width: '14%', aspectRatio: '1', transform: 'translate(-50%,-50%)' }}
          />
        ) : (
          <CoreOverlay x={HUB.x} y={HUB.y} viewW={480} viewH={520} />
        )}
      </div>
    </div>
  );
}
