import { useState } from 'react';
import { SectionHead } from './Sections';
import { credentials, profile, stack } from './data';
import { ArrowUpRight, Check, Copy, Download, GitHub, LinkedIn, Mail, Phone, Pin, Shield } from './icons';

export function Stack() {
  const all = stack.flatMap((g) => g.items);
  return (
    <section id="stack" className="relative overflow-hidden py-24 sm:py-28">
      <div className="shell">
        <SectionHead index="03" kicker="Toolchain" title={<>The stack, <span className="text-fog-500">chosen per problem.</span></>}>
          Comfortable from the GPU pipeline to the boardroom slide: systems languages, data engines, model tooling and the
          clouds they run on.
        </SectionHead>
      </div>

      <div className="marquee reveal relative mb-16 border-y border-line py-5 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]" data-motion>
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap">
          {[...all, ...all].map((t, i) => (
            <span key={i} className="flex items-center gap-10 text-2xl font-medium tracking-tight text-fog-700 sm:text-3xl" aria-hidden={i >= all.length}>
              {t}
              <span className="h-1.5 w-1.5 rounded-full bg-signal-cyan/50" />
            </span>
          ))}
        </div>
      </div>

      <div className="shell">
      <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {stack.map((g, k) => (
          <div key={g.group} className="reveal bg-ink-950 p-7" style={{ ['--d' as string]: `${k * 0.05}s` }}>
            <h3 className="eyebrow mb-5 text-fog-300">{g.group}</h3>
            <ul className="flex flex-wrap gap-2">
              {g.items.map((t) => (
                <li key={t} className="rounded-lg border border-line bg-white/[0.02] px-3 py-1.5 text-[13px] text-fog-300 transition-colors hover:border-fog-500/40 hover:text-white">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}

export function Credentials() {
  return (
    <section id="credentials" className="relative py-24 sm:py-28">
      <div className="shell">
        <SectionHead index="04" kicker="Credentials" title={<>Verified by Microsoft, <span className="text-fog-500">three times over.</span></>}>
          Each credential links to its public verification record.
        </SectionHead>

        <ol className="relative grid gap-4 lg:grid-cols-3">
          {credentials.map((c, k) => (
            <li key={c.id} className="reveal" style={{ ['--d' as string]: `${k * 0.08}s` }}>
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className={'spot panel group flex h-full flex-col p-7 transition-colors duration-500 hover:border-fog-500/30' + (k === 0 ? ' beam' : '')}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-gradient-to-br from-signal-sky/15 to-signal-indigo/10 text-signal-sky">
                    <Shield size={20} />
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.16em] text-fog-500">{c.code}</span>
                </div>
                <p className="eyebrow mt-7">Microsoft Certified</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">{c.title}</h3>
                <p className="mt-1 text-[13px] text-fog-500">Earned {c.issued}</p>
                <div className="mb-6 mt-5 flex flex-wrap gap-1.5">
                  {c.focus.map((f) => (
                    <span key={f} className="chip">
                      {f}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-line pt-5">
                  <span className="font-mono text-[10px] tracking-[0.1em] text-fog-700">ID {c.id}</span>
                  <span className="inline-flex items-center gap-1 text-[13px] text-fog-300 transition-colors group-hover:text-white">
                    Verify <ArrowUpRight size={14} />
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Contact() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };
  return (
    <section id="contact" className="relative overflow-hidden py-24 sm:py-32">
      <div aria-hidden className="absolute left-1/2 top-1/2 -z-10 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(94,234,212,.10),rgba(129,140,248,.08),transparent)]" />
      <div className="shell text-center">
        <p className="eyebrow reveal mb-6">
          <span className="text-signal-cyan">05</span> · Contact
        </p>
        <h2 className="reveal mx-auto max-w-4xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-7xl">
          Let&apos;s build something <span className="grad-text">measurably better.</span>
        </h2>
        <p className="reveal mx-auto mt-6 max-w-xl text-fog-500" style={{ ['--d' as string]: '.08s' }}>
          Open to roles and collaborations across AI, data, cloud, performance engineering and robotics AI.
        </p>

        <div className="reveal mx-auto mt-12 flex max-w-xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center" style={{ ['--d' as string]: '.14s' }}>
          <a href={`mailto:${profile.email}`} className="btn-primary justify-center px-7 py-3.5 text-base">
            <Mail size={18} /> {profile.email}
          </a>
          <button type="button" onClick={copy} className="btn-ghost justify-center py-3.5" aria-live="polite">
            {copied ? <Check /> : <Copy />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="reveal mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-fog-500" style={{ ['--d' as string]: '.2s' }}>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-white">
            <LinkedIn size={16} /> LinkedIn
          </a>
          <a href={profile.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-white">
            <GitHub size={16} /> GitHub
          </a>
          <a href={profile.resume} download className="inline-flex items-center gap-2 transition-colors hover:text-white">
            <Download size={16} /> Résumé
          </a>
          <a href={profile.phoneHref} className="inline-flex items-center gap-2 transition-colors hover:text-white">
            <Phone size={16} /> {profile.phone}
          </a>
          <span className="inline-flex items-center gap-2">
            <Pin size={16} /> {profile.location}
          </span>
        </div>
      </div>
    </section>
  );
}
