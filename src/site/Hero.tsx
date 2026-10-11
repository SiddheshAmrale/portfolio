import { useEffect, useState } from 'react';
import Aurora from './Aurora';
import AgentScene from './AgentScene';
import { metrics, profile, roles } from './data';
import { ArrowRight, Download, GitHub, LinkedIn } from './icons';

function RoleCycler() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setI((v) => (v + 1) % roles.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span className="relative inline-flex overflow-hidden align-bottom">
      <span key={i} className="role-word grad-text">
        {roles[i]}
      </span>
      <span aria-hidden className="ml-0.5 inline-block w-[2px] self-stretch bg-signal-cyan/80" style={{ animation: 'blink 1s steps(1) infinite' }} />
    </span>
  );
}

const LOG = [
  ['rag', 'retrieve → ground → answer'],
  ['data', 'validate contracts · quarantine'],
  ['cloud', 'plan → apply → verify'],
  ['perf', 'profile → fix hot path'],
  ['robotics', 'perceive → plan → act'],
  ['eval', 'score · guardrails · ship'],
];

function Stage() {
  return (
    <figure className="relative mx-auto w-full max-w-[460px]">
      <div className="relative overflow-hidden rounded-[28px] border border-line bg-ink-900 shadow-[0_40px_120px_-40px_rgba(94,234,212,.25)]">
        <AgentScene />
        <div aria-hidden className="pointer-events-none absolute inset-3 font-mono text-[10px] tracking-[0.16em] text-fog-500">
          <span className="absolute left-0 top-0 h-4 w-4 border-l border-t border-signal-cyan/60" />
          <span className="absolute right-0 top-0 h-4 w-4 border-r border-t border-signal-cyan/60" />
          <span className="absolute bottom-0 left-0 h-4 w-4 border-b border-l border-signal-cyan/60" />
          <span className="absolute bottom-0 right-0 h-4 w-4 border-b border-r border-signal-cyan/60" />
          <span className="absolute left-6 top-1 text-fog-300">ORCHESTRATOR · S.AMRALE</span>
          <span className="absolute right-6 top-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse-dot 1.8s infinite' }} />6 AGENTS
          </span>
        </div>
      </div>
      {/* Task log: a CSS-only ticker cycling through the agents' jobs */}
      <figcaption className="mt-3 flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-ink-950/90 px-4 py-3 font-mono text-[12px]" data-motion>
        <span className="text-signal-cyan">❯</span>
        <span className="relative h-[18px] flex-1 overflow-hidden">
          <span className="log-ticker absolute inset-x-0 top-0">
            {[...LOG, LOG[0]].map(([who, what], i) => (
              <span key={i} className="block h-[18px] truncate leading-[18px] text-fog-300">
                <span className="text-signal-indigo">{who}-agent</span> {what}
                <span className="ml-2 text-emerald-400">✓</span>
              </span>
            ))}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

export default function Hero() {
  const [first, last] = profile.name.split(' ');
  return (
    <section id="top" className="relative isolate overflow-hidden">
      {/* Static gradient under the shader: what you see before / without WebGL */}
      <div aria-hidden className="absolute inset-0 -z-20 bg-[radial-gradient(80%_60%_at_70%_20%,rgba(56,189,248,.10),transparent_60%),radial-gradient(60%_50%_at_10%_80%,rgba(129,140,248,.10),transparent_60%)]" />
      <Aurora />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-ink-950" />

      <div className="shell grid min-h-[100svh] items-center gap-14 pb-16 pt-28 lg:grid-cols-[1.15fr_.85fr] lg:gap-10 lg:pt-24">
        <div className="intro">
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-line bg-white/[0.03] py-1.5 pl-2 pr-3.5 font-mono text-[11px] tracking-[0.14em] text-fog-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/60" style={{ animation: 'pulse-dot 2s infinite' }} />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            OPEN TO ROLES · {profile.location.toUpperCase()}
          </div>

          <h1 className="text-[clamp(3.1rem,9.5vw,7.4rem)] font-semibold leading-[0.92] tracking-[-0.045em]">
            <span className="split-word">
              <span>{first}</span>
            </span>{' '}
            <br />
            <span className="split-word">
              <span className="grad-text" style={{ animationDelay: '.12s' }}>
                {last}
              </span>
            </span>
          </h1>

          <p className="mt-7 text-xl font-medium tracking-tight text-fog-100 sm:text-2xl">
            Engineering <RoleCycler />
          </p>

          <p className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-fog-300 sm:text-base">
            {profile.role} building data platforms, AI services and cloud infrastructure where every claim has a
            benchmark behind it — from a 2.2&nbsp;MB native media player to runnable labs for telemetry, lakehouse data
            and GPU fleets.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#work" className="btn-primary group">
              View selected work
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
            <a href={profile.resume} download className="btn-ghost">
              <Download /> Résumé
            </a>
            <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
            <a href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="rounded-full p-2.5 text-fog-300 transition-colors hover:bg-white/5 hover:text-white">
              <GitHub />
            </a>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="rounded-full p-2.5 text-fog-300 transition-colors hover:bg-white/5 hover:text-white">
              <LinkedIn />
            </a>
          </div>

          <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="flex flex-col-reverse justify-end bg-ink-950/90 px-4 py-4">
                <dt className="mt-1 text-[11px] leading-snug text-fog-500">{m.label}</dt>
                <dd className="text-2xl font-semibold tracking-tight text-fog-100">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="sm:px-14 lg:px-4" style={{ animation: 'rise 1.2s .2s var(--ease-out) both' }}>
          <Stage />
        </div>
      </div>

      <a href="#disciplines" aria-label="Scroll to content" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-fog-500 transition-colors hover:text-fog-300 md:flex">
        SCROLL
        <span className="relative h-10 w-px overflow-hidden bg-line">
          <span className="absolute inset-x-0 top-0 h-1/2 bg-signal-cyan" style={{ animation: 'scan 2.2s var(--ease-in-out) infinite' }} />
        </span>
      </a>
    </section>
  );
}
