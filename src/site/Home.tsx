import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Hero from './Hero';
import { Disciplines, Work } from './Sections';
import { Contact, Credentials, Stack } from './MoreSections';

// Page-wide motion plumbing, installed once:
//  - .reveal elements fade up the first time they enter the viewport;
//  - [data-motion] regions get .in-view only while visible, which un-pauses
//    their CSS animations (see index.css);
//  - one delegated pointermove feeds the .spot cursor spotlight.
function useMotionPlumbing() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('hydrated');

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            reveal.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    const motion = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.classList.toggle('in-view', e.isIntersecting);
    });
    const scan = () => {
      document.querySelectorAll('.reveal:not(.is-in)').forEach((el) => reveal.observe(el));
      document.querySelectorAll('[data-motion]').forEach((el) => motion.observe(el));
    };
    scan();
    // Filtering the project grid adds nodes; pick them up cheaply.
    const mo = new MutationObserver(scan);
    const main = document.querySelector('main');
    if (main) mo.observe(main, { childList: true, subtree: true });

    let raf = 0;
    let lastEvt: PointerEvent | null = null;
    const onMove = (e: PointerEvent) => {
      lastEvt = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const ev = lastEvt;
        if (!ev) return;
        const card = (ev.target as Element | null)?.closest?.('.spot') as HTMLElement | null;
        if (!card) return;
        const b = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${ev.clientX - b.left}px`);
        card.style.setProperty('--my', `${ev.clientY - b.top}px`);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      reveal.disconnect();
      motion.disconnect();
      mo.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);
}

export default function Home() {
  const location = useLocation();
  useMotionPlumbing();

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
        return;
      }
    }
    if (!location.hash) window.scrollTo(0, 0);
  }, [location]);

  return (
    <>
      <Hero />
      <div className="hairline shell" />
      <Disciplines />
      <Work />
      <Stack />
      <Credentials />
      <Contact />
    </>
  );
}
