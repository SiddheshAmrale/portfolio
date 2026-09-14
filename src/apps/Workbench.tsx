import React from 'react';
import { Link } from 'react-router-dom';

export interface WorkbenchView {
  id: string;
  label: string;
}

interface WorkbenchProps {
  product: string;
  domain: string;
  accent: string;
  views: WorkbenchView[];
  view: string;
  onView: (id: string) => void;
  statusLeft: string;
  statusRight: string;
  children: React.ReactNode;
}

const Workbench: React.FC<WorkbenchProps> = function (props) {
  React.useEffect(function () {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="app-workbench flex flex-col" style={{ ['--wb-accent' as string]: props.accent }}>
      <header className="flex items-center gap-4 px-4 h-12 border-b border-white/10 bg-[#0b0e14] shrink-0">
        <Link to="/#projects" className="text-[11px] uppercase tracking-wider text-white/50 hover:text-white">
          Portfolio
        </Link>
        <div className="h-4 w-px bg-white/10" />
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/40">{props.domain}</div>
          <div className="text-sm font-semibold text-white leading-none mt-0.5">{props.product}</div>
        </div>
        <div className="ml-auto flex items-center gap-2 overflow-x-auto">
          {props.views.map(function (v) {
            const on = props.view === v.id;
            return (
              <button
                key={v.id}
                onClick={function () { props.onView(v.id); }}
                className={'text-xs px-3 py-1.5 rounded-md whitespace-nowrap ' + (on ? 'text-black font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5')}
                style={on ? { background: props.accent } : undefined}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        {props.children}
      </div>
      <footer className="h-8 px-4 flex items-center justify-between text-[11px] text-white/45 border-t border-white/10 bg-[#0b0e14] shrink-0 font-mono">
        <span>{props.statusLeft}</span>
        <span>{props.statusRight}</span>
      </footer>
    </div>
  );
};

export default Workbench;
