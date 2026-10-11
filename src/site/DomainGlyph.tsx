import type { DomainId } from './data';

// Small looping motion graphics, one per discipline. Pure SVG + CSS keyframes
// (see index.css "glyph" section): no JavaScript runs per frame, and the
// enclosing [data-motion] region pauses them while off screen.

const stroke = 'rgba(148,163,196,.28)';

function DataGlyph() {
  const lanes = [
    { y: 26, c: '#fbbf24', label: 'BRONZE' },
    { y: 50, c: '#c4cad8', label: 'SILVER' },
    { y: 74, c: '#fde68a', label: 'GOLD' },
  ];
  return (
    <svg viewBox="0 0 220 100" className="h-full w-full">
      {lanes.map((l, i) => (
        <g key={l.y}>
          <line x1="58" y1={l.y} x2="210" y2={l.y} stroke={stroke} strokeDasharray="2 4" />
          <text x="6" y={l.y + 3} className="glyph-label">
            {l.label}
          </text>
          {[0, 1, 2].map((k) => (
            <rect
              key={k}
              x="58"
              y={l.y - 3}
              width="10"
              height="6"
              rx="1.5"
              fill={l.c}
              className="glyph-flow"
              style={{ animationDelay: `${-(k * 1.1 + i * 0.37)}s`, opacity: 0.9 - i * 0.12 }}
            />
          ))}
        </g>
      ))}
      <path d="M200 26 C214 26 214 50 200 50 M200 50 C214 50 214 74 200 74" stroke={stroke} fill="none" />
    </svg>
  );
}

function AiGlyph() {
  const layers = [
    [22, 50, 78],
    [14, 38, 62, 86],
    [32, 68],
  ];
  const xs = [30, 110, 190];
  const edges: [number, number, number, number][] = [];
  for (let l = 0; l < layers.length - 1; l++)
    for (const a of layers[l]) for (const b of layers[l + 1]) edges.push([xs[l], a, xs[l + 1], b]);
  return (
    <svg viewBox="0 0 220 100" className="h-full w-full">
      {edges.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} />
      ))}
      {edges.map(([x1, y1, x2, y2], i) => (
        <line
          key={'s' + i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#5eead4"
          strokeWidth="1.2"
          strokeDasharray="6 34"
          className="glyph-signal"
          style={{ animationDelay: `${-((i * 0.29) % 2)}s` }}
        />
      ))}
      {layers.map((ys, l) =>
        ys.map((y, k) => (
          <circle
            key={`${l}-${k}`}
            cx={xs[l]}
            cy={y}
            r={l === 2 ? 5 : 4}
            fill={l === 2 ? '#818cf8' : '#0e121d'}
            stroke={l === 2 ? '#a5b4fc' : '#5eead4'}
            className={l === 2 ? 'glyph-pulse' : undefined}
            style={l === 2 ? { animationDelay: `${k * 0.6}s` } : undefined}
          />
        )),
      )}
    </svg>
  );
}

function PerfGlyph() {
  // Frame times: noisy and over budget on the left, flat and under on the right.
  const pts = [
    38, 30, 44, 26, 48, 34, 22, 40, 28, 36, 30, 52, 32, 56, 60, 61, 60, 62, 61, 60, 62, 61, 61, 60, 62, 61,
  ];
  const d = pts.map((y, i) => `${i ? 'L' : 'M'}${10 + i * 8} ${y + 10}`).join(' ');
  return (
    <svg viewBox="0 0 220 100" className="h-full w-full">
      <line x1="10" y1="52" x2="212" y2="52" stroke="#fbbf24" strokeOpacity=".55" strokeDasharray="3 3" />
      <text x="168" y="46" className="glyph-label" fill="#fbbf24">
        16.6 ms
      </text>
      <path d={d} fill="none" stroke="rgba(94,234,212,.14)" strokeWidth="1.6" />
      <path d={d} fill="none" stroke="#5eead4" strokeWidth="1.6" pathLength={100} className="glyph-draw" />
      <circle cx="210" cy="71" r="3" fill="#a5f3fc" className="glyph-pulse" />
    </svg>
  );
}

function CloudGlyph() {
  const hex = (cx: number, cy: number, r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(' ');
  const cells = [
    [110, 50],
    [80, 33],
    [140, 33],
    [80, 67],
    [140, 67],
    [50, 50],
    [170, 50],
  ];
  return (
    <svg viewBox="0 0 220 100" className="h-full w-full">
      {cells.map(([x, y], i) => (
        <polygon
          key={i}
          points={hex(x, y, 17)}
          fill="#818cf8"
          stroke="#a5b4fc"
          strokeOpacity=".5"
          className="glyph-cell"
          style={{ animationDelay: `${i * 0.42}s` }}
        />
      ))}
      {cells.slice(1).map(([x, y], i) => (
        <circle key={'n' + i} cx={x} cy={y} r="2" fill="#5eead4" className="glyph-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
      ))}
    </svg>
  );
}

function RoboticsGlyph() {
  return (
    <svg viewBox="0 0 220 100" className="h-full w-full">
      <line x1="20" y1="92" x2="200" y2="92" stroke={stroke} />
      <rect x="92" y="82" width="36" height="10" rx="2" fill="#151a28" stroke="#5eead4" strokeOpacity=".6" />
      <g className="arm-1">
        <line x1="110" y1="82" x2="110" y2="46" stroke="#c4cad8" strokeWidth="5" strokeLinecap="round" />
        <g className="arm-2">
          <line x1="110" y1="46" x2="146" y2="40" stroke="#818cf8" strokeWidth="4" strokeLinecap="round" />
          <path d="M146 40 l8 -5 M146 40 l8 5" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" />
          <circle cx="110" cy="46" r="4" fill="#0e121d" stroke="#a5b4fc" />
        </g>
        <circle cx="110" cy="82" r="4.5" fill="#0e121d" stroke="#5eead4" />
      </g>
      <circle cx="166" cy="60" r="5" fill="none" stroke="#fbbf24" className="glyph-pulse" />
      <circle cx="58" cy="54" r="5" fill="none" stroke="#fbbf24" strokeOpacity=".4" />
      <text x="20" y="18" className="glyph-label">
        PERCEIVE → PLAN → ACT
      </text>
    </svg>
  );
}

export default function DomainGlyph({ id }: { id: DomainId }) {
  switch (id) {
    case 'data':
      return <DataGlyph />;
    case 'ai':
      return <AiGlyph />;
    case 'performance':
      return <PerfGlyph />;
    case 'cloud':
      return <CloudGlyph />;
    case 'robotics':
      return <RoboticsGlyph />;
  }
}
