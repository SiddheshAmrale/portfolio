// Centre of the agent scene: a holographic command core showing either the
// face portrait (src/assets/me/avatar-face.*) or the SA monogram. Built from HTML layers (each ring is its own small SVG) so the
// rotations and the glow pulse are pure compositor work: animating these
// inside the main SVG made Chrome repaint the whole scene every frame.

export function CoreOverlay({ x, y, viewW, viewH, face }: { x: number; y: number; viewW: number; viewH: number; face?: string }) {
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
      <div className="core-glow absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(242,181,48,.42),rgba(94,234,212,.14)_45%,transparent)]" />
      <svg viewBox="-130 -130 260 260" className="core-spin absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="coreRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F2B530" />
            <stop offset="1" stopColor="#5eead4" />
          </linearGradient>
        </defs>
        <circle r="92" fill="none" stroke="url(#coreRing)" strokeOpacity=".5" strokeWidth="1.2" strokeDasharray="2 7" />
        <path d="M-92 0 A92 92 0 0 1 0 -92" fill="none" stroke="#F2B530" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <svg viewBox="-130 -130 260 260" className="core-spin-rev absolute inset-0 h-full w-full">
        <circle r="70" fill="none" stroke="#5eead4" strokeOpacity=".35" strokeWidth="1" />
        <path d="M70 0 A70 70 0 0 1 -35 60.6" fill="none" stroke="#99f6e4" strokeWidth="2" strokeLinecap="round" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <circle key={a} cx={70 * Math.cos((a * Math.PI) / 180)} cy={70 * Math.sin((a * Math.PI) / 180)} r="2.6" fill="#F2B530" />
        ))}
      </svg>
      {face ? (
        // Face disc: r=62 of the 260-unit core, inside the inner ring (r=70).
        <div
          className="absolute overflow-hidden rounded-full border-2 border-gold/70 bg-[radial-gradient(circle_at_50%_35%,#2a2418,#0c0c0e_70%)] shadow-[0_0_40px_-6px_rgba(242,181,48,.55)]"
          style={{ left: `${((130 - 62) / 260) * 100}%`, top: `${((130 - 62) / 260) * 100}%`, width: `${(124 / 260) * 100}%`, aspectRatio: '1' }}
        >
          <img src={face} alt="" decoding="async" className="h-full w-full object-cover" />
        </div>
      ) : (
        <svg viewBox="-130 -130 260 260" className="absolute inset-0 h-full w-full">
          <circle r="48" fill="#0a0d16" stroke="url(#coreRing)" strokeWidth="1.5" />
          <text x="0" y="12" textAnchor="middle" fill="url(#coreRing)" fontFamily="Barlow, Bahnschrift, Arial, sans-serif" fontWeight="700" fontSize="34" letterSpacing="1">
            SA
          </text>
        </svg>
      )}
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
        <tspan fill="#F2B530">❯</tspan> orchestrate --agents 6
      </text>
      <text x="12" y="46" className="core-code" fill="#8b93a7">
        dispatch · verify · ship
      </text>
    </g>
  );
}
