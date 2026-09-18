import React, { useMemo, useState } from 'react';
import Workbench from '../../apps/Workbench';
import { Btn, Kpi, Panel, Spark } from '../../apps/ui';
import { downloadJson, fmtPct } from '../shared/stats';
import { fmtOpt, usePilotJson } from './load';
import { IncidentCase, IncidentPayload } from './types';

const ACCENT = '#fb7185';
const VIEWS = [
  { id: 'investigate', label: 'Investigate' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'reveal', label: 'Reveal' },
  { id: 'repair', label: 'Intervention' },
  { id: 'score', label: 'Held-out' },
  { id: 'reproduce', label: 'Reproduce' }
];

const IncidentLab: React.FC = function () {
  const { data, error, loading } = usePilotJson<IncidentPayload>('/pilot/incident.json');
  const [view, setView] = useState('investigate');
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const selected: IncidentCase | null = data && data.cases[idx] ? data.cases[idx] : null;
  const intervention = useMemo(function () {
    if (!data || !selected) return null;
    const key = selected.id.replace(/^linux-/, '');
    return data.interventions.find(function (i) { return i.condition === selected.id || i.condition === key; }) || null;
  }, [data, selected]);

  if (loading) {
    return <div className="app-workbench flex items-center justify-center text-white/50">Loading pinned incidents…</div>;
  }
  if (error || !data || !selected) {
    return <div className="app-workbench p-8 text-rose-300">Could not load /pilot/incident.json. {error}</div>;
  }

  const lat = selected.app_latency.map(function (p) { return p.v; });
  const cpu = selected.cpu.map(function (p) { return p.v; });
  const retrans = selected.retrans_rates.map(function (p) { return p.pilot_per_s; }).filter(function (v): v is number { return v !== null; });

  return (
    <Workbench
      product="Network Incident Diagnosis Lab"
      domain="Reliability · evidence"
      accent={ACCENT}
      views={VIEWS}
      view={view}
      onView={setView}
      statusLeft={data.software + ' · rules frozen on calibration'}
      statusRight={(revealed ? selected.title : selected.blind_label) + ' · ' + selected.diagnosis.label}
    >
      <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap gap-2 items-center">
          {data.cases.map(function (c, i) {
            return (
              <Btn
                key={c.id}
                kind={i === idx ? 'primary' : 'ghost'}
                accent={ACCENT}
                onClick={function () { setIdx(i); setRevealed(false); setView('investigate'); }}
              >
                {revealed && i === idx ? c.title : c.blind_label}
                {c.source === 'linux-live' ? ' · live' : ''}
              </Btn>
            );
          })}
          <Btn kind="ghost" onClick={function () { downloadJson('pilot-incident-' + selected.id + '.json', selected); }}>Download experiment</Btn>
        </div>

        <p className="text-xs text-white/45 leading-relaxed">
          {data.disclaimer} Live Linux cases, when present, come from GitHub-hosted Ubuntu (netns + veth + netem + cgroup). Packets traverse the veth. Constructed fixtures stay for calibration. Software loss is not optical BER. diagnose() never receives the injector label.
        </p>

        {view === 'investigate' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Source" value={selected.source === 'linux-live' ? 'live Linux' : 'fixture'} />
                <Kpi label="Naive baseline" value={selected.baseline_diagnosis} hint="if app is slow, blame the network" tone={selected.baseline_diagnosis === 'network' ? 'bad' : 'ok'} />
                <Kpi label="Pilot diagnosis" value={selected.diagnosis.label} />
                <Kpi label="Time to detect" value={selected.time_to_detect_seq === null ? 'never' : 'seq ' + selected.time_to_detect_seq} />
              </div>
              {selected.source === 'linux-live' ? (
                <p className={'text-xs ' + (selected.impairment_confirmed === false ? 'text-amber-200/90' : 'text-white/45')}>
                  {selected.impairment_confirmed === false
                    ? 'Live run shown, excluded from accuracy: ' + (selected.confirm_detail || 'impairment not confirmed')
                    : 'Live netns veth path. ' + (selected.confirm_detail || 'impairment confirmed')}
                </p>
              ) : null}
              <Panel title="Application latency (ms)">
                <Spark values={lat} color={ACCENT} height={72} />
              </Panel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Panel title="Receiver CPU %">
                  <Spark values={cpu} color="#fbbf24" height={64} />
                </Panel>
                <Panel title="Pilot TcpRetransSegs / s">
                  <Spark values={retrans} color="#38bdf8" height={64} />
                </Panel>
              </div>
            </div>
            <Panel title="Why a baseline exists">
              <p className="text-sm text-white/65 leading-relaxed">
                The baseline is an operator heuristic: degraded application latency implies a network problem. It is not given the injector label either. Compare it with the evidence rules — especially on CPU restriction and interrupted telemetry.
              </p>
              <p className="text-sm text-white/50 mt-3">{selected.diagnosis.notes}</p>
            </Panel>
          </div>
        ) : null}

        {view === 'evidence' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Supporting and missing evidence">
              <ul className="space-y-2">
                {selected.diagnosis.evidence.map(function (e) {
                  return (
                    <li key={e.name} className="text-sm border-b border-white/5 pb-2">
                      <span className={'font-mono text-xs mr-2 ' + (e.present ? 'text-emerald-400' : 'text-white/35')}>{e.present ? 'PRESENT' : 'ABSENT'}</span>
                      <span className="text-white">{e.name}</span>
                      <div className="text-xs text-white/45 font-mono mt-0.5">{e.detail}</div>
                    </li>
                  );
                })}
              </ul>
              {selected.diagnosis.missing_evidence.length ? (
                <p className="text-sm text-amber-200/80 mt-4">Missing for a call: {selected.diagnosis.missing_evidence.join('; ')}</p>
              ) : null}
            </Panel>
            <Panel title="Synchronized sample of records">
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full text-xs font-mono">
                  <thead className="text-white/40">
                    <tr>
                      <th className="text-left p-2">seq</th>
                      <th className="text-left p-2">metric</th>
                      <th className="text-left p-2">value</th>
                      <th className="text-left p-2">status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.rows.filter(function (r) {
                      return r.metric === 'app_latency_ms' || r.metric === 'proc_cpu_percent' || r.metric === 'TcpRetransSegs' || r.metric === 'rx_bytes' || r.metric === 'collector_lag_ms';
                    }).slice(0, 80).map(function (r, i) {
                      return (
                        <tr key={i} className="border-t border-white/5 text-white/70">
                          <td className="p-2">{r.scrape_seq}</td>
                          <td className="p-2">{r.metric}</td>
                          <td className="p-2">{r.value === null ? 'null' : fmtOpt(r.value, 1)}</td>
                          <td className="p-2">{r.collection_status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        ) : null}

        {view === 'reveal' ? (
          <Panel
            title="Experimental ground truth"
            action={<Btn accent={ACCENT} onClick={function () { setRevealed(true); }}>{revealed ? 'Shown' : 'Reveal condition'}</Btn>}
          >
            {revealed ? (
              <div className="space-y-3 text-sm text-white/75">
                <p>Condition: <span className="text-white font-semibold">{selected.title}</span> ({selected.ground_truth})</p>
                <p>Naive baseline called it <code>{selected.baseline_diagnosis}</code>. Frozen rules called it <code>{selected.diagnosis.label}</code>.</p>
                {selected.source === 'linux-live' ? (
                  <p>Impairment confirmed: {String(selected.impairment_confirmed)}{selected.confirm_detail ? ' — ' + selected.confirm_detail : ''}</p>
                ) : null}
                <p className="text-white/45">{selected.disclaimer}</p>
              </div>
            ) : (
              <p className="text-sm text-white/50">The injector label is stored only for evaluation. Reveal it after you have inspected the timelines and evidence.</p>
            )}
          </Panel>
        ) : null}

        {view === 'repair' ? (
          intervention ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Panel title={'Correct action: ' + intervention.correct_action}>
                <Spark values={(intervention.latency_correct || []).map(function (p) { return p.v; })} color="#34d399" height={72} />
                <p className="text-sm text-white/60 mt-2">Helped: {String(intervention.correct_action_helped)}. Predicted action {intervention.predicted_action} from diagnosis {intervention.predicted}.</p>
              </Panel>
              <Panel title={'Wrong action: ' + intervention.wrong_action}>
                <Spark values={(intervention.latency_wrong || []).map(function (p) { return p.v; })} color="#f43f5e" height={72} />
                <p className="text-sm text-white/60 mt-2">Helped: {String(intervention.wrong_action_helped)}. Removing an impairment that was never present is not credited.</p>
              </Panel>
            </div>
          ) : (
            <Panel title="No recorded intervention for this condition">
              <p className="text-sm text-white/55">Healthy, stale, and mixed cases are not given a repair trial. Insufficient evidence is the honest output when the traces cannot separate host vs network.</p>
            </Panel>
          )
        ) : null}

        {view === 'score' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="Held-out n" value={String(data.held_out.n)} />
              <Kpi label="Diagnosed" value={fmtPct(data.held_out.diagnosed_pct)} />
              <Kpi label="Accuracy when diagnosed" value={fmtPct(data.held_out.accuracy_when_diagnosed)} />
              <Kpi label="Network false attr." value={String(data.held_out.network_false_attr)} tone={data.held_out.network_false_attr ? 'bad' : 'ok'} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Kpi label="Missed impaired" value={String(data.held_out.missed_impaired)} />
              <Kpi label="Insufficient" value={String(data.held_out.insufficient)} />
              <Kpi label="Calibration accuracy" value={fmtPct(data.calibration.accuracy_when_diagnosed)} hint={'diagnosed ' + fmtPct(data.calibration.diagnosed_pct)} />
            </div>
            {data.linux_eval ? (
              <Panel title="Live Linux evaluation (ground truth sidecar only)">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <Kpi label="Live n" value={String(data.linux_eval.n)} />
                  <Kpi label="Diagnosed" value={fmtPct(data.linux_eval.diagnosed_pct)} />
                  <Kpi label="Accuracy when diagnosed" value={fmtPct(data.linux_eval.accuracy_when_diagnosed)} />
                  <Kpi label="Network false attr." value={String(data.linux_eval.network_false_attr)} tone={data.linux_eval.network_false_attr ? 'bad' : 'ok'} />
                </div>
                {typeof data.linux_eval.unconfirmed === 'number' && data.linux_eval.unconfirmed > 0 ? (
                  <p className="text-xs text-amber-200/80 mb-3">{data.linux_eval.unconfirmed} live runs excluded because the impairment did not move the workload.</p>
                ) : null}
                <ul className="text-sm font-mono space-y-1">
                  {data.linux_eval.rows.map(function (r) {
                    const ok = r.predicted === r.truth;
                    return (
                      <li key={r.run_id} className={ok ? 'text-emerald-300/90' : 'text-rose-300'}>
                        {r.run_id}: truth {r.truth} → {r.predicted}
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            ) : (
              <p className="text-sm text-white/45">No live Linux evaluation in this build. CI records it on ubuntu-latest.</p>
            )}
            <Panel title="Constructed held-out rows (ground truth applied only here)">
              <ul className="text-sm font-mono space-y-1">
                {data.held_out.rows.map(function (r) {
                  const ok = r.predicted === r.truth;
                  return (
                    <li key={r.run_id} className={ok ? 'text-emerald-300/90' : 'text-rose-300'}>
                      {r.run_id}: truth {r.truth} → {r.predicted}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>
        ) : null}

        {view === 'reproduce' ? (
          <Panel title="Reproduction">
            <pre className="text-xs text-emerald-200/90 bg-black/40 p-3 rounded overflow-x-auto">{
`pip install -e "./pilot[dev]"
python -m pytest -q
python -m pilot run-linux --out public/pilot/linux
python -m pilot eval-linux --dir public/pilot/linux
python -m pilot eval
python -m pilot reproduce incident:${selected.id}
`}</pre>
            <p className="text-sm text-white/55 mt-3">{data.disclaimer}</p>
          </Panel>
        ) : null}
      </div>
    </Workbench>
  );
};

export default IncidentLab;
