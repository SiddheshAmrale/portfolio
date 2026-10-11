import { useEffect, useRef } from 'react';
import { Core, CoreDefs } from './Core';

// Drop a generated 3D portrait at src/assets/me/avatar-3d.(webp|png|jpg) and
// the scene uses it (hashed, long-cached asset); otherwise a command core
// sits at the centre of the agents.
const found = import.meta.glob('../assets/me/avatar-3d.{webp,png,jpg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const PORTRAIT: string | undefined = Object.values(found)[0];

// Illustrated, animated "me orchestrating AI agents" scene. One inline SVG:
// every motion is a CSS keyframe on transform/opacity (paused off screen via
// [data-motion]); the only script is a rAF-throttled pointer handler that lets
// the eyes and head follow the cursor through two CSS variables.

const AGENTS = [
  { x: 70, y: 96, label: 'RAG', d: 0 },
  { x: 410, y: 92, label: 'DATA', d: 0.6 },
  { x: 46, y: 262, label: 'CLOUD', d: 1.2 },
  { x: 434, y: 258, label: 'PERF', d: 1.8 },
  { x: 92, y: 420, label: 'EVAL', d: 2.4 },
  { x: 392, y: 424, label: 'ROBOTICS', d: 3 },
];
const HUB = PORTRAIT ? { x: 240, y: 330 } : { x: 240, y: 236 };

function Agent({ x, y, label, d }: (typeof AGENTS)[number]) {
  const w = 16 + label.length * 6.2;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="bot-float" style={{ animationDelay: `${-d}s` }}>
        <ellipse cx="0" cy="34" rx="14" ry="3" fill="#000" opacity=".35" className="bot-shadow" style={{ animationDelay: `${-d}s` }} />
        <line x1="0" y1="-22" x2="0" y2="-13" stroke="#5b6377" strokeWidth="2" />
        <circle cx="0" cy="-24" r="3" fill="#5eead4" className="glyph-pulse" style={{ animationDelay: `${d * 0.5}s` }} />
        <rect x="-19" y="-14" width="38" height="30" rx="13" fill="url(#botBody)" stroke="#2c3550" />
        <rect x="-13" y="-7" width="26" height="14" rx="7" fill="#05070d" />
        <g className="bot-eyes" style={{ animationDelay: `${d}s` }}>
          <rect x="-8" y="-3" width="5" height="6" rx="2" fill="#5eead4" />
          <rect x="3" y="-3" width="5" height="6" rx="2" fill="#5eead4" />
        </g>
        <rect x="-22" y="-2" width="4" height="9" rx="2" fill="#2c3550" />
        <rect x="18" y="-2" width="4" height="9" rx="2" fill="#2c3550" />
      </g>
      <g transform="translate(0 44)">
        <rect x={-w / 2} y="-8" width={w} height="16" rx="8" fill="#0a0d16" stroke="rgba(94,234,212,.45)" />
        <circle cx={-w / 2 + 8} cy="0" r="2.2" fill="#34d399" className="glyph-pulse" style={{ animationDelay: `${d}s` }} />
        <text x={-w / 2 + 14} y="3" className="bot-label">
          {label}
        </text>
      </g>
    </g>
  );
}

function Beams() {
  return (
    <g>
      {AGENTS.map((a, i) => {
        const mx = (a.x + HUB.x) / 2;
        const my = Math.min(a.y, HUB.y) - 30;
        const d = `M${HUB.x} ${HUB.y} Q${mx} ${my} ${a.x} ${a.y + 4}`;
        return (
          <g key={a.label}>
            <path d={d} fill="none" stroke="rgba(94,234,212,.14)" strokeWidth="1.2" />
            <path d={d} fill="none" stroke="#5eead4" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="5 60" className="beam-out" style={{ animationDelay: `${-i * 0.55}s` }} />
            <path d={d} fill="none" stroke="#fbbf24" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="3 90" className="beam-back" style={{ animationDelay: `${-i * 0.8 - 1}s` }} />
          </g>
        );
      })}
    </g>
  );
}

function Room() {
  return (
    <g>
      <rect width="480" height="520" fill="url(#room)" />
      {/* window light + shelf glow */}
      <rect x="318" y="40" width="130" height="150" rx="10" fill="url(#window)" opacity=".55" />
      <rect x="320" y="200" width="140" height="6" rx="3" fill="#1b2340" />
      <rect x="320" y="206" width="140" height="22" fill="url(#shelfGlow)" opacity=".7" />
      <rect x="336" y="178" width="18" height="22" rx="3" fill="#2b3557" />
      <rect x="358" y="170" width="12" height="30" rx="3" fill="#3a2f63" />
      {/* plants */}
      <g fill="#123b33">
        <path d="M30 520 C20 440 40 380 70 350 C64 400 70 450 80 520Z" />
        <path d="M60 520 C70 430 110 390 140 380 C118 420 100 470 96 520Z" fill="#165046" />
        <path d="M20 470 C0 420 10 380 30 360 C34 400 36 430 44 470Z" fill="#0f3029" />
      </g>
      <rect x="40" y="488" width="56" height="32" rx="6" fill="#2a2f42" />
      {/* floor */}
      <rect y="470" width="480" height="50" fill="#060814" opacity=".7" />
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

  return (
    <div ref={ref} className="agent-scene relative" data-motion>
      <svg viewBox="0 0 480 520" className="block h-auto w-full" role="img" aria-label={PORTRAIT ? 'Siddhesh orchestrating a team of AI agents' : 'A command core orchestrating a team of AI agents'}>
        <defs>
          <CoreDefs />
          <linearGradient id="room" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d1638" />
            <stop offset="1" stopColor="#070a18" />
          </linearGradient>
          <linearGradient id="window" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1e3a8a" />
            <stop offset="1" stopColor="#0b1230" />
          </linearGradient>
          <linearGradient id="shelfGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fbbf24" stopOpacity=".55" />
            <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="lamp">
            <stop offset="0" stopColor="#fbbf24" stopOpacity=".18" />
            <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
          
          
          
          <linearGradient id="botBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#222a40" />
            <stop offset="1" stopColor="#11162a" />
          </linearGradient>
          <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset=".35" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#a5f3fc" stopOpacity=".12" />
            <stop offset=".65" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="hubGlow">
            <stop offset="0" stopColor="#5eead4" stopOpacity=".55" />
            <stop offset="1" stopColor="#5eead4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <Room />
        <Beams />
        {PORTRAIT ? (
          <g className="portrait-3d">
            <image href={PORTRAIT} x="40" y="60" width="400" height="460" preserveAspectRatio="xMidYMax meet" />
            <rect x="40" y="60" width="400" height="460" fill="url(#sweep)" className="light-sweep" />
          </g>
        ) : (
          <Core x={HUB.x} y={HUB.y} />
        )}
        {PORTRAIT ? <circle cx={HUB.x} cy={HUB.y} r="34" fill="url(#hubGlow)" className="hub-glow" /> : null}
        {AGENTS.map((a) => (
          <Agent key={a.label} {...a} />
        ))}
      </svg>
    </div>
  );
}
