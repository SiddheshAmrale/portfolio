import React from 'react';
import { Link } from 'react-router-dom';

interface LabShellProps {
  eyebrow: string;
  title: string;
  evidence: string;
  children: React.ReactNode;
}

const LabShell: React.FC<LabShellProps> = ({ eyebrow, title, evidence, children }) => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-ink-950 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <Link
            to="/"
            className="text-fog-300 hover:text-white transition-colors"
          >
            Home
          </Link>
          <span className="text-fog-700">/</span>
          <Link
            to="/#work"
            className="text-fog-300 hover:text-white transition-colors"
          >
            Work
          </Link>
          <span className="text-fog-700">/</span>
          <span className="text-white">{title}</span>
        </div>

        <div className="mb-8">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase mb-3 text-signal-cyan">
            {eyebrow}
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-3">{title}</h1>
          <p className="text-fog-300 max-w-4xl">{evidence}</p>
          <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100/90">
            Browser-scale model with pinned assumptions. This is an independent investigation
            method, not a cluster measurement, production result, or claim of upstream adoption.
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

export default LabShell;
