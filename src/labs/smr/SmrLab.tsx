import React, { useState } from 'react';
import Workbench from '../../apps/Workbench';
import { Btn, Kpi, Panel, Spark } from '../../apps/ui';
import { downloadJson } from '../shared/stats';
import { fmtOpt, usePilotJson } from '../pilot/load';

const ACCENT = '#a3e635';

type SmrCase = {
  id: string;
  title: string;
  question: string;
  software: string;
  disclaimer: string;
  series: { t: number; v: number | null; status: string }[];
  integrity: {
    missing_visible: boolean;
    safe_mean: number | null;
    naive_mean: number | null;
    zero_filled_suspicion: boolean;
    stale_count: number;
    failed_count: number;
    notes: string;
  };
  trips: { channel: string; fired: boolean; at_ms: number | null; high: number | null }[];
};

const SmrLab: React.FC = function () {
  const { data, error, loading } = usePilotJson<SmrCase[]>('/smr/cases.json');
  const [idx, setIdx] = useState(0);
  const [view, setView] = useState('case');
  const selected = data && data[idx] ? data[idx] : null;

  if (loading) return <div className="app-workbench flex items-center justify-center text-white/50">Loading SMR cases…</div>;
  if (error || !data || !selected) return <div className="app-workbench p-8 text-rose-300">Could not load /smr/cases.json. {error}</div>;

  const spark = selected.series.map(function (p) { return p.v === null ? 0 : p.v; });

  return (
    <Workbench
      product="SMR Instrumentation Integrity"
      domain="Oklo · advanced fission I&C"
      accent={ACCENT}
      views={[
        { id: 'case', label: 'Case' },
        { id: 'trips', label: 'Trips' },
        { id: 'reproduce', label: 'Reproduce' }
      ]}
      view={view}
      onView={setView}
      statusLeft={selected.software}
      statusRight={selected.title}
    >
      <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap gap-2">
          {data.map(function (c, i) {
            return (
              <Btn key={c.id} kind={i === idx ? 'primary' : 'ghost'} accent={ACCENT} onClick={function () { setIdx(i); setView('case'); }}>
                {c.title}
              </Btn>
            );
          })}
          <Btn kind="ghost" onClick={function () { downloadJson('smr-' + selected.id + '.json', selected); }}>Download</Btn>
        </div>
        <p className="text-xs text-white/45">{selected.disclaimer}</p>

        {view === 'case' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Missing visible" value={selected.integrity.missing_visible ? 'yes' : 'no'} tone={selected.integrity.missing_visible ? 'ok' : 'muted'} />
                <Kpi label="Zero-fill bug" value={selected.integrity.zero_filled_suspicion ? 'SUSPECT' : 'clean'} tone={selected.integrity.zero_filled_suspicion ? 'bad' : 'ok'} />
                <Kpi label="Safe mean" value={fmtOpt(selected.integrity.safe_mean, 1)} />
                <Kpi label="Naive mean" value={fmtOpt(selected.integrity.naive_mean, 1)} tone={selected.integrity.zero_filled_suspicion ? 'bad' : 'muted'} />
              </div>
              <Panel title="Coolant temperature (missing plotted as 0 only for spark — status is source of truth)">
                <Spark values={spark} color={ACCENT} height={72} />
              </Panel>
              <Panel title="Question"><p className="text-sm text-white/80">{selected.question}</p></Panel>
            </div>
            <Panel title="Integrity notes">
              <p className="text-sm text-white/65">{selected.integrity.notes}</p>
              <p className="text-xs text-white/40 mt-3">stale={selected.integrity.stale_count} failed={selected.integrity.failed_count}</p>
            </Panel>
          </div>
        ) : null}

        {view === 'trips' ? (
          <Panel title="Trip setpoints">
            <ul className="text-sm font-mono space-y-2">
              {selected.trips.map(function (t) {
                return (
                  <li key={t.channel} className={t.fired ? 'text-rose-300' : 'text-emerald-300/90'}>
                    {t.channel} high={t.high} → {t.fired ? 'FIRED @ ' + t.at_ms : 'quiet'}
                  </li>
                );
              })}
            </ul>
          </Panel>
        ) : null}

        {view === 'reproduce' ? (
          <Panel title="Reproduce">
            <pre className="text-xs text-emerald-200/90 bg-black/40 p-3 rounded overflow-x-auto">{
`pip install -e "./smr[dev]"
python -m pytest -q smr/tests
python -m smr build-cases --out public/smr
`}</pre>
          </Panel>
        ) : null}
      </div>
    </Workbench>
  );
};

export default SmrLab;
