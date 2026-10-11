import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { profile } from './data';
import { Close, Download, GitHub, LinkedIn, Menu } from './icons';

const links = [
  { href: '/#disciplines', label: 'Disciplines' },
  { href: '/#work', label: 'Work' },
  { href: '/#stack', label: 'Stack' },
  { href: '/#credentials', label: 'Credentials' },
  { href: '/#contact', label: 'Contact' },
];

function Monogram() {
  const id = useId().replace(/:/g, '');
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd978" />
          <stop offset="1" stopColor="#d99a1e" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#0a0d16" stroke={`url(#${id})`} strokeOpacity=".7" />
      <path d="M11.5 19.6c.7 1.1 2 1.8 3.6 1.8 2 0 3.3-1 3.3-2.6 0-1.7-1.3-2.2-3.2-2.7-1.8-.5-3.1-1.1-3.1-2.8 0-1.5 1.3-2.6 3.1-2.6 1.4 0 2.5.6 3.1 1.6" stroke={`url(#${id})`} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="22.5" cy="20.5" r="1.4" fill="#ffd978" />
    </svg>
  );
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // A 1px sentinel at the top instead of a scroll listener.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }, [open]);

  return (
    <>
      <div ref={sentinel} aria-hidden className="absolute left-0 top-0 h-px w-px" />
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:pt-4">
        <nav
          aria-label="Primary"
          className={
            'flex w-full max-w-shell items-center justify-between rounded-2xl border px-3 py-2 transition-[background-color,border-color,box-shadow] duration-500 sm:px-4 ' +
            (scrolled || open
              ? 'border-line bg-ink-950/75 shadow-[0_10px_40px_-12px_rgba(0,0,0,.7)] backdrop-blur-xl'
              : 'border-transparent bg-transparent')
          }
        >
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)} aria-label={`${profile.name} — home`}>
            <Monogram />
            <span className="text-[15px] font-semibold tracking-tight">{profile.name}</span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="rounded-full px-3.5 py-2 text-[13px] text-fog-300 transition-colors hover:bg-white/[0.05] hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            <Link to="/learn" className="hidden rounded-full px-3.5 py-2 text-[13px] text-fog-300 transition-colors hover:text-white lg:block">
              Labs
            </Link>
            <a href={profile.resume} download className="btn-ghost hidden py-2 text-[13px] sm:inline-flex">
              <Download size={14} /> Résumé
            </a>
            <button
              type="button"
              className="rounded-full p-2.5 text-fog-100 md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <Close /> : <Menu />}
            </button>
          </div>
        </nav>
      </header>

      <div
        id="mobile-menu"
        className={
          'fixed inset-0 z-40 bg-ink-950/95 backdrop-blur-xl transition-opacity duration-500 md:hidden ' +
          (open ? 'opacity-100' : 'pointer-events-none opacity-0')
        }
        aria-hidden={!open}
      >
        <ul className="shell flex h-full flex-col justify-center gap-2">
          {links.map((l, k) => (
            <li key={l.href} style={{ transition: `transform .6s ${k * 0.05}s var(--ease-out), opacity .6s ${k * 0.05}s` }} className={open ? '' : 'translate-y-4 opacity-0'}>
              <a href={l.href} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} className="block py-2 text-4xl font-semibold tracking-tight">
                {l.label}
              </a>
            </li>
          ))}
          <li className="mt-8 flex gap-3">
            <a href={profile.resume} download tabIndex={open ? 0 : -1} className="btn-primary">
              <Download /> Résumé
            </a>
            <Link to="/learn" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} className="btn-ghost">
              Labs
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}

// Fixed at build time (the page is prerendered), so server and client agree.
const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="shell flex flex-col gap-6 py-10 text-[13px] text-fog-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Monogram />
          <span>
            © {YEAR} {profile.name} · {profile.location}
          </span>
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fog-700">Prerendered · Zero trackers · React + Vite</p>
        <div className="flex items-center gap-1">
          <a href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="rounded-full p-2 transition-colors hover:text-white">
            <GitHub size={17} />
          </a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="rounded-full p-2 transition-colors hover:text-white">
            <LinkedIn size={17} />
          </a>
          <a href="#top" className="ml-2 rounded-full border border-line px-3 py-1.5 transition-colors hover:text-white">
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
