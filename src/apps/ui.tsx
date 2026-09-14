import React from 'react';

export const Panel: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }> = function (props) {
  return (
    <section className={'rounded-lg border border-white/10 bg-[#0f141c] ' + (props.className || '')}>
      <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white/70">{props.title}</h2>
        {props.action}
      </div>
      <div className="p-4">{props.children}</div>
    </section>
  );
};

export const Kpi: React.FC<{ label: string; value: string; hint?: string; tone?: 'ok' | 'bad' | 'muted' }> = function (props) {
  const color = props.tone === 'ok' ? 'text-emerald-300' : props.tone === 'bad' ? 'text-rose-300' : 'text-white';
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{props.label}</div>
      <div className={'text-lg font-semibold font-mono mt-1 ' + color}>{props.value}</div>
      {props.hint ? <div className="text-[11px] text-white/40 mt-1">{props.hint}</div> : null}
    </div>
  );
};

export const Spark: React.FC<{ values: number[]; color: string; height?: number }> = function (props) {
  const h = props.height || 48;
  const w = 240;
  if (!props.values.length) return <div className="h-12 text-white/30 text-xs">No series yet</div>;
  let min = props.values[0];
  let max = props.values[0];
  for (let i = 1; i < props.values.length; i++) {
    if (props.values[i] < min) min = props.values[i];
    if (props.values[i] > max) max = props.values[i];
  }
  const span = max - min || 1;
  const pts = props.values.map(function (v, i) {
    const x = (i / Math.max(props.values.length - 1, 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  return (
    <svg width="100%" viewBox={'0 0 ' + w + ' ' + h} className="block">
      <polyline fill="none" stroke={props.color} strokeWidth="1.6" points={pts} />
    </svg>
  );
};

export const TestList: React.FC<{ tests: { name: string; pass: boolean; detail: string }[] | null; empty: string }> = function (props) {
  if (!props.tests) return <p className="text-sm text-white/50">{props.empty}</p>;
  return (
    <ul className="space-y-2">
      {props.tests.map(function (t) {
        return (
          <li key={t.name} className="text-sm border-b border-white/5 pb-2">
            <span className={'font-mono text-xs mr-2 ' + (t.pass ? 'text-emerald-400' : 'text-rose-400')}>{t.pass ? 'PASS' : 'FAIL'}</span>
            <span className="text-white">{t.name}</span>
            <div className="text-xs text-white/45 font-mono mt-0.5">{t.detail}</div>
          </li>
        );
      })}
    </ul>
  );
};

export const Btn: React.FC<{ onClick: () => void; children: React.ReactNode; kind?: 'primary' | 'ghost'; disabled?: boolean; accent?: string }> = function (props) {
  if (props.kind === 'ghost') {
    return (
      <button
        disabled={props.disabled}
        onClick={props.onClick}
        className="text-xs px-3 py-1.5 rounded border border-white/15 text-white/80 hover:bg-white/5 disabled:opacity-40"
      >
        {props.children}
      </button>
    );
  }
  return (
    <button
      disabled={props.disabled}
      onClick={props.onClick}
      className="text-xs px-3 py-1.5 rounded font-semibold text-black disabled:opacity-40"
      style={{ background: props.accent || '#22d3ee' }}
    >
      {props.children}
    </button>
  );
};
