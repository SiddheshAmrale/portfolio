// Centre of the agent scene when no 3D portrait is present: a holographic
// command core. Built from HTML layers (each ring is its own small SVG) so the
// rotations and the glow pulse are pure compositor work: animating these
// inside the main SVG made Chrome repaint the whole scene every frame.

const ring = (r: number) => `${(r * 2 * 100) / 260}%`;

export function CoreOverlay({ x, y, viewW, viewH }: { x: number; y: number; viewW: number; viewH: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: `${(x / viewW) * 100}%`,
        top: `${(y / viewH) * 100}%`,
        width: `${(260 / viewW) * 100}%`,
        aspectRatio: '1',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="core-glow absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(94,234,212,.42),rgba(129,140,248,.14)_45%,transparent)]" />
      <svg viewBox="-130 -130 260 260" className="core-spin absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="coreRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5eead4" />
            <stop offset="1" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        <circle r="92" fill="none" stroke="url(#coreRing)" strokeOpacity=".5" strokeWidth="1.2" strokeDasharray="2 7" />
        <path d="M-92 0 A92 92 0 0 1 0 -92" fill="none" stroke="#5eead4" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <svg viewBox="-130 -130 260 260" className="core-spin-rev absolute inset-0 h-full w-full">
        <circle r="70" fill="none" stroke="#818cf8" strokeOpacity=".35" strokeWidth="1" />
        <path d="M70 0 A70 70 0 0 1 -35 60.6" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <circle key={a} cx={70 * Math.cos((a * Math.PI) / 180)} cy={70 * Math.sin((a * Math.PI) / 180)} r="2.6" fill="#5eead4" />
        ))}
      </svg>
      <svg viewBox="-130 -130 260 260" className="absolute inset-0 h-full w-full" style={{ width: '100%' }}>
        <circle r="48" fill="#0a0d16" stroke="url(#coreRing)" strokeWidth="1.5" />
        <path
          d="M-11 9.6c1.6 2.6 4.6 4.2 8.4 4.2 4.6 0 7.7-2.3 7.7-6 0-4-3-5.1-7.4-6.3-4.2-1.2-7.2-2.6-7.2-6.5 0-3.5 3-6 7.2-6 3.3 0 5.8 1.4 7.2 3.7"
          fill="none"
          stroke="url(#coreRing)"
          strokeWidth="4"
          strokeLinecap="round"
          transform="translate(-2 -1)"
        />
        <circle cx="14" cy="11" r="3.4" fill="#5eead4" />
      </svg>
      <span className="core-dot absolute rounded-full bg-signal-cyan" style={{ left: '55.4%', top: '54.2%', width: ring(3.4), height: ring(3.4), translate: '-50% -50%' }} />
    </div>
  );
}

/** The terminal panel under the core: static, drawn inside the main SVG. */
export function CorePanel({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x - 84} ${y + 112})`}>
      <rect width="168" height="58" rx="10" fill="#0a0d16" stroke="rgba(148,163,196,.22)" />
      <circle cx="12" cy="11" r="2.4" fill="#f87171" />
      <circle cx="20" cy="11" r="2.4" fill="#fbbf24" />
      <circle cx="28" cy="11" r="2.4" fill="#34d399" />
      <text x="12" y="31" className="core-code">
        <tspan fill="#5eead4">❯</tspan> orchestrate --agents 6
      </text>
      <text x="12" y="46" className="core-code" fill="#8b93a7">
        dispatch · verify · ship
      </text>
    </g>
  );
}
