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
    <div className="min-h-screen bg-netflix-black pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <Link
            to="/"
            className="text-netflix-light-gray hover:text-white transition-colors"
          >
            Home
          </Link>
          <span className="text-netflix-gray">/</span>
          <Link
            to="/#projects"
            className="text-netflix-light-gray hover:text-white transition-colors"
          >
            Projects
          </Link>
          <span className="text-netflix-gray">/</span>
          <span className="text-white">{title}</span>
        </div>

        <div className="mb-8">
          <p className="text-netflix-red text-sm font-semibold tracking-wide uppercase mb-2">
            {eyebrow}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h1>
          <p className="text-netflix-light-gray max-w-4xl">{evidence}</p>
          <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
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
