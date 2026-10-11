import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DomainGlyph from './DomainGlyph';
import { domains, filters, projects, type DomainId, type Project } from './data';
import { ArrowUpRight, GitHub, Play } from './icons';

export function SectionHead({ index, kicker, title, children }: { index: string; kicker: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="mb-14 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
      <div className="reveal">
        <p className="eyebrow mb-4 flex items-center gap-3">
          <span className="text-gold">{index}</span>
          <span className="h-px w-8 bg-line" />
          {kicker}
        </p>
        <h2 className="max-w-3xl text-balance text-4xl font-bold leading-[1] tracking-[-0.02em] sm:text-5xl md:text-6xl">{title}</h2>
      </div>
      {children ? (
        <div className="reveal max-w-sm text-[15px] leading-relaxed text-fog-500" style={{ ['--d' as string]: '.1s' }}>
          {children}
        </div>
      ) : null}
    </header>
  );
}

const domainLabel: Record<DomainId, string> = {
  data: 'Data',
  ai: 'AI',
  performance: 'Performance',
  cloud: 'Cloud',
  robotics: 'Robotics AI',
};

export function Disciplines() {
  return (
    <section id="disciplines" className="relative py-24 sm:py-28">
      <div className="shell">
        <SectionHead index="01" kicker="Disciplines" title={<>Five disciplines. <span className="text-fog-500">One standard: measure it.</span></>}>
          Each area below is backed by something you can run — a lab, a test suite or a shipped binary — not a buzzword.
        </SectionHead>

        <div className="grid gap-4 md:grid-cols-6" data-motion>
          {domains.map((d, k) => (
            <article
              key={d.id}
              className={
                'spot panel reveal group overflow-hidden p-6 transition-colors duration-500 hover:border-fog-500/30 ' +
                (k < 2 ? 'md:col-span-3' : 'md:col-span-2')
              }
              style={{ ['--d' as string]: `${k * 0.07}s` }}
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-[11px] tracking-[0.2em] text-fog-500">{d.index}</span>
                <span className="font-mono text-[10px] tracking-[0.2em] text-fog-700 transition-colors group-hover:text-gold">● ACTIVE</span>
              </div>
              <div className="my-6 h-28 sm:h-32">
                <DomainGlyph id={d.id} />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">{d.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-fog-300">{d.line}</p>
              <ul className="mt-5 space-y-2 border-t border-line pt-5">
                {d.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-[13px] text-fog-500">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold/70" />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectLink({ p, className }: { p: Project; className: string }) {
  if (p.href) {
    return (
      <a href={p.href} target="_blank" rel="noopener noreferrer" className={className}>
        <GitHub size={15} /> Source <ArrowUpRight size={14} />
      </a>
    );
  }
  return (
    <Link to={p.path ?? '/'} className={className}>
      <Play size={13} /> Launch lab <ArrowUpRight size={14} />
    </Link>
  );
}

function Featured({ p }: { p: Project }) {
  return (
    <article className="beam reveal grid overflow-hidden rounded-3xl bg-ink-900 lg:grid-cols-[1.2fr_1fr]" data-motion>
      <div className="relative min-h-[260px] overflow-hidden bg-ink-850">
        {p.image ? (
          <img
            src={p.image}
            alt={`${p.title} screenshot`}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-[1.4s] ease-out hover:scale-[1.03]"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-ink-900/90 max-lg:bg-gradient-to-t max-lg:from-ink-900" />
      </div>
      <div className="flex flex-col justify-center p-7 sm:p-10">
        <p className="eyebrow mb-4 text-gold">Featured · {p.evidence}</p>
        <h3 className="text-3xl font-semibold tracking-tight sm:text-4xl">{p.title}</h3>
        <p className="mt-4 text-[15px] leading-relaxed text-fog-300">{p.summary}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {p.tech.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-8">
          <ProjectLink p={p} className="btn-primary" />
        </div>
      </div>
    </article>
  );
}

export function Work() {
  const [filter, setFilter] = useState<'all' | DomainId>('all');
  const [touched, setTouched] = useState(false);
  const [featured, ...rest] = projects;
  const shown = useMemo(() => (filter === 'all' ? rest : rest.filter((p) => p.domains.includes(filter))), [filter, rest]);

  return (
    <section id="work" className="relative py-24 sm:py-28">
      <div className="shell">
        <SectionHead index="02" kicker="Selected work" title={<>Systems you can run, <span className="text-fog-500">not screenshots of dashboards.</span></>}>
          Every lab opens as its own full-screen app with pinned assumptions. Start with the{' '}
          <Link to="/learn" className="text-fog-100 underline decoration-line underline-offset-4 hover:decoration-fog-300">
            guided academy
          </Link>
          .
        </SectionHead>

        <Featured p={featured} />

        <div className="reveal mt-14 flex flex-wrap gap-2" role="tablist" aria-label="Filter projects by discipline">
          {filters.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setTouched(true);
                  setFilter(f.id);
                }}
                className={
                  'rounded-full border px-4 py-2 font-mono text-[11px] tracking-[0.14em] transition-all duration-300 ' +
                  (on ? 'border-fog-100 bg-fog-100 text-ink-950' : 'border-line text-fog-500 hover:border-fog-500/50 hover:text-fog-100')
                }
              >
                {f.label.toUpperCase()}
              </button>
            );
          })}
        </div>

        <div key={filter} className={(touched ? '' : 'reveal ') + 'mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
          {shown.map((p, k) => (
            <article
              key={p.id}
              className={(touched ? 'card-in ' : '') + 'spot panel group flex flex-col p-6 transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-fog-500/30'}
              style={{ animationDelay: `${Math.min(k, 8) * 0.04}s` }}
            >
              <div className="flex flex-wrap gap-1.5">
                {p.domains.map((d) => (
                  <span key={d} className="font-mono text-[10px] tracking-[0.16em] text-gold/80">
                    {domainLabel[d].toUpperCase()}
                  </span>
                ))}
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">{p.title}</h3>
              <p className="mt-3 line-clamp-4 text-[14px] leading-relaxed text-fog-500">{p.summary}</p>
              <div className="mb-6 mt-5 flex flex-wrap gap-1.5">
                {p.tech.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-line pt-5">
                <span className="font-mono text-[10px] tracking-[0.12em] text-fog-700">{p.evidence.toUpperCase()}</span>
                <ProjectLink
                  p={p}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-fog-300 transition-colors group-hover:text-white"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
