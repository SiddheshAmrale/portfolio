import React, { useEffect, useRef, useState } from 'react';
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
  unit?: string;
  channel?: string;
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
  physics?: {
    compare: {
      reproducible: boolean;
      same_design: boolean;
      same_code_revision: boolean;
      delta_keff: number | null;
      keff_tol: number;
      a: { ok: boolean; missing_fields: string[]; manifest_hash: string };
      b: { ok: boolean; missing_fields: string[]; manifest_hash: string };
      notes: string;
    };
    results: { run_id: string; design_id: string; git_sha: string; keff: number | null; peak_temp_c: number | null; status: string; manifest_hash: string }[];
  };
};

type LogLine = { msg: string; kind?: 'ok' | 'bad' | 'info' };

const SmrLab: React.FC = function () {
  const { data, error, loading } = usePilotJson<SmrCase[]>('/smr/cases.json');
  const [idx, setIdx] = useState(0);
  const [view, setView] = useState('case');
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);
  const timerRef = useRef<number | null>(null);
  const selected = data && data[idx] ? data[idx] : null;

  useEffect(function () {
    return function () {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  useEffect(function () {
    setDone(false);
    setRunning(false);
    setLog([]);
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [idx]);

  const runCheck = function () {
    if (!selected || running) return;
    setDone(false);
    setLog([]);
    setRunning(true);
    const steps: LogLine[] = [];
    if (selected.physics) {
      steps.push({ msg: 'load physics manifests A/B', kind: 'info' });
      steps.push({ msg: 'same design? ' + selected.physics.compare.same_design, kind: selected.physics.compare.same_design ? 'ok' : 'bad' });
      steps.push({ msg: 'same git sha? ' + selected.physics.compare.same_code_revision, kind: selected.physics.compare.same_code_revision ? 'ok' : 'bad' });
      steps.push({ msg: 'A ok=' + selected.physics.compare.a.ok + ' missing=[' + selected.physics.compare.a.missing_fields.join(',') + ']', kind: selected.physics.compare.a.ok ? 'ok' : 'bad' });
      steps.push({ msg: 'B ok=' + selected.physics.compare.b.ok + ' missing=[' + selected.physics.compare.b.missing_fields.join(',') + ']', kind: selected.physics.compare.b.ok ? 'ok' : 'bad' });
      steps.push({ msg: 'Δkeff=' + String(selected.physics.compare.delta_keff) + ' tol=' + selected.physics.compare.keff_tol, kind: 'info' });
      steps.push({ msg: 'reproducible → ' + selected.physics.compare.reproducible, kind: selected.physics.compare.reproducible ? 'ok' : 'bad' });
    } else {
      steps.push({ msg: 'scan channel ' + (selected.channel || 'series') + ' statuses', kind: 'info' });
      steps.push({ msg: 'missing visible (null)? ' + selected.integrity.missing_visible, kind: selected.integrity.missing_visible ? 'ok' : 'info' });
      steps.push({ msg: 'zero-fill suspicion? ' + selected.integrity.zero_filled_suspicion, kind: selected.integrity.zero_filled_suspicion ? 'bad' : 'ok' });
      steps.push({ msg: 'safe mean=' + String(selected.integrity.safe_mean) + ' · naive mean=' + String(selected.integrity.naive_mean), kind: 'info' });
      steps.push({ msg: 'stale=' + selected.integrity.stale_count + ' failed=' + selected.integrity.failed_count, kind: 'info' });
      selected.trips.forEach(function (t) {
        steps.push({ msg: 'trip ' + t.channel + ' high=' + t.high + ' → ' + (t.fired ? 'FIRED @ ' + t.at_ms : 'quiet'), kind: t.fired ? 'bad' : 'ok' });
      });
    }
    steps.push({ msg: 'done', kind: 'ok' });
    let i = 0;
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(function () {
      if (i >= steps.length) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        timerRef.current = null;
        setRunning(false);
        setDone(true);
        return;
      }
      const line = steps[i];
      i += 1;
      setLog(function (prev) { return prev.concat([line]); });
    }, 260);
  };

  if (loading) return <div className="app-workbench flex items-center justify-center text-white/50">Loading SMR cases…</div>;
  if (error || !data || !selected) return <div className="app-workbench p-8 text-rose-300">Could not load /smr/cases.json. {error}</div>;

  const spark = selected.series.map(function (p) { return p.v === null ? 0 : p.v; });

  return (
    <Workbench
      product="SMR Instrumentation Integrity"
      domain="Process data · trips · reproducibility"
      accent={ACCENT}
      views={[
        { id: 'case', label: 'Run' },
        { id: 'trips', label: 'Trips' },
        { id: 'physics', label: 'Physics store' },
        { id: 'reproduce', label: 'Reproduce' }
      ]}
      view={view}
      onView={setView}
      statusLeft={selected.software}
      statusRight={running ? 'checking…' : (done ? selected.title : 'idle')}
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
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Btn accent={ACCENT} disabled={running} onClick={runCheck}>
            {running ? 'Running…' : (done ? 'Re-run check' : 'Run integrity check')}
          </Btn>
          <Btn kind="ghost" onClick={function () { downloadJson('smr-' + selected.id + '.json', selected); }}>Download case JSON</Btn>
          <span className="text-xs text-white/40">Results stay empty until you run the check.</span>
        </div>
        <p className="text-xs text-white/45">{selected.disclaimer}</p>

        {view === 'case' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Panel title="Question"><p className="text-sm text-white/80">{selected.question}</p></Panel>
              {selected.series && selected.series.length ? (
                <Panel title={'Series (' + (selected.unit || '') + ')'}>
                  <Spark values={spark} color={ACCENT} height={72} />
                </Panel>
              ) : null}
              <Panel title="Check log">
                {!log.length && !running ? (
                  <p className="text-sm text-white/45">Click Run integrity check to walk missing≠zero / trips / physics gates.</p>
                ) : (
                  <ul className="font-mono text-xs space-y-1 max-h-64 overflow-auto">
                    {log.map(function (line, i) {
                      const color = line.kind === 'bad' ? 'text-rose-300' : (line.kind === 'ok' ? 'text-emerald-300' : 'text-white/65');
                      return <li key={i} className={color}>{line.msg}</li>;
                    })}
                    {running ? <li className="text-white/35 animate-pulse">…</li> : null}
                  </ul>
                )}
              </Panel>
              {done ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Kpi label="Missing visible" value={selected.integrity.missing_visible ? 'yes' : 'no'} tone={selected.integrity.missing_visible ? 'ok' : 'muted'} />
                  <Kpi label="Zero-fill bug" value={selected.integrity.zero_filled_suspicion ? 'SUSPECT' : 'clean'} tone={selected.integrity.zero_filled_suspicion ? 'bad' : 'ok'} />
                  <Kpi label="Safe mean" value={fmtOpt(selected.integrity.safe_mean, 1)} />
                  <Kpi label="Naive mean" value={fmtOpt(selected.integrity.naive_mean, 1)} tone={selected.integrity.zero_filled_suspicion ? 'bad' : 'muted'} />
                </div>
              ) : null}
              {done && selected.physics ? (
                <Panel title="Physics compare">
                  <ul className="text-sm font-mono space-y-1">
                    <li className="text-white/70">reproducible: {selected.physics.compare.reproducible ? 'yes' : 'no'}</li>
                    <li className="text-white/70">same design: {selected.physics.compare.same_design ? 'yes' : 'no'} · same sha: {selected.physics.compare.same_code_revision ? 'yes' : 'no'}</li>
                    <li className="text-white/70">Δkeff: {selected.physics.compare.delta_keff === null ? '—' : selected.physics.compare.delta_keff} (tol {selected.physics.compare.keff_tol})</li>
                  </ul>
                </Panel>
              ) : null}
            </div>
            <Panel title="Integrity notes">
              <p className="text-sm text-white/65">{done ? selected.integrity.notes : 'Run the check to unlock notes and KPIs.'}</p>
              {done ? <p className="text-xs text-white/40 mt-3">stale={selected.integrity.stale_count} failed={selected.integrity.failed_count}</p> : null}
            </Panel>
          </div>
        ) : null}

        {view === 'trips' ? (
          done ? (
            <Panel title="Trip setpoints">
              <ul className="text-sm font-mono space-y-2">
                {selected.trips.length ? selected.trips.map(function (t) {
                  return (
                    <li key={t.channel} className={t.fired ? 'text-rose-300' : 'text-emerald-300/90'}>
                      {t.channel} high={t.high} → {t.fired ? 'FIRED @ ' + t.at_ms : 'quiet'}
                    </li>
                  );
                }) : <li className="text-white/45">No trips on this case (physics-store cases use the Physics tab).</li>}
              </ul>
            </Panel>
          ) : (
            <Panel title="Trip setpoints"><p className="text-sm text-white/45">Run the check first.</p></Panel>
          )
        ) : null}

        {view === 'physics' ? (
          done && selected.physics ? (
            <Panel title="Reactor physics-result store">
              <div className="space-y-3">
                <p className="text-sm text-white/65">{selected.physics.compare.notes}</p>
                <ul className="text-xs font-mono space-y-2">
                  {selected.physics.results.map(function (r) {
                    return (
                      <li key={r.run_id} className="border-b border-white/5 pb-2 text-white/70">
                        {r.run_id} · {r.design_id} · sha {r.git_sha} · keff={r.keff === null ? 'null' : r.keff} · {r.status} · hash {r.manifest_hash}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Panel>
          ) : (
            <Panel title="Physics store">
              <p className="text-sm text-white/45">{selected.physics ? 'Run the check first.' : 'Pick a physics-store case, then Run.'}</p>
            </Panel>
          )
        ) : null}

        {view === 'reproduce' ? (
          <Panel title="Reproduce (real backend)">
            <pre className="text-xs text-emerald-200/90 bg-black/40 p-3 rounded overflow-x-auto">{
`pip install -e "./smr[dev]"
python -m pytest -q smr/tests
python -m smr build-cases --out public/smr
`}</pre>
            <p className="text-xs text-white/45 mt-3">Static site viewer. Logic lives in the Python package.</p>
          </Panel>
        ) : null}
      </div>
    </Workbench>
  );
};

export default SmrLab;
