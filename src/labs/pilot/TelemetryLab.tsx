import React, { useMemo, useState } from 'react';
import Workbench from '../../apps/Workbench';
import { Btn, Kpi, Panel, Spark } from '../../apps/ui';
import { downloadJson } from '../shared/stats';
import { fmtOpt, usePilotJson } from './load';
import { ObsRow, QualityCase, RateRow } from './types';

const ACCENT = '#38bdf8';
const VIEWS = [
  { id: 'case', label: 'Case' },
  { id: 'records', label: 'Records' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'calc', label: 'Calculation' },
  { id: 'reproduce', label: 'Reproduce' }
];

function metricRows(rows: ObsRow[], metric: string): ObsRow[] {
  return rows.filter(function (r) { return r.metric === metric; }).slice().sort(function (a, b) {
    return a.arrival_time_ms - b.arrival_time_ms;
  });
}

function rateValues(rates: RateRow[], key: 'naive_per_s' | 'pilot_per_s' | 'prom_per_s' | 'naive_arrival_per_s'): number[] {
  return rates.map(function (r) { return r[key]; }).filter(function (v): v is number { return v !== null && isFinite(v); });
}

const TelemetryLab: React.FC = function () {
  const { data, error, loading } = usePilotJson<QualityCase[]>('/pilot/quality.json');
  const [view, setView] = useState('case');
  const [caseId, setCaseId] = useState('late_samples_after_restart');
  const [order, setOrder] = useState<'arrival' | 'observation'>('arrival');

  const selected = useMemo(function () {
    if (!data || !data.length) return null;
    return data.find(function (c) { return c.id === caseId; }) || data[0];
  }, [data, caseId]);

  if (loading) {
    return <div className="app-workbench flex items-center justify-center text-white/50">Loading pinned cases…</div>;
  }
  if (error || !selected || !data) {
    return <div className="app-workbench p-8 text-rose-300">Could not load /pilot/quality.json. Run <code>python -m pilot build-cases</code>. {error}</div>;
  }

  const rx = metricRows(selected.rows, 'rx_bytes');
  const obsSorted = rx.slice().sort(function (a, b) { return a.observation_time_ms - b.observation_time_ms; });
  const shown = order === 'arrival' ? rx : obsSorted;
  const naiveSpark = rateValues(selected.rates_rx_bytes, 'naive_per_s');
  const arrivalSpark = rateValues(selected.rates_rx_bytes, 'naive_arrival_per_s');
  const pilotSpark = rateValues(selected.rates_rx_bytes, 'pilot_per_s');

  return (
    <Workbench
      product="Telemetry Data Quality Lab"
      domain="Ingestion · measurement semantics"
      accent={ACCENT}
      views={VIEWS}
      view={view}
      onView={setView}
      statusLeft={selected.software + ' · /proc available ' + String(selected.linux_proc_available)}
      statusRight={selected.n_raw + ' raw rows · ' + selected.withheld + ' withheld rates'}
    >
      <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap gap-2 items-center">
          {data.map(function (c) {
            return (
              <Btn
                key={c.id}
                kind={c.id === selected.id ? 'primary' : 'ghost'}
                accent={ACCENT}
                onClick={function () { setCaseId(c.id); setView('case'); }}
              >
                {c.title}
              </Btn>
            );
          })}
          <Btn kind="ghost" onClick={function () { downloadJson('pilot-quality-' + selected.id + '.json', selected); }}>Download case</Btn>
        </div>

        {view === 'case' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Naive alert" value={selected.alert.naive_alert ? 'FIRE' : 'quiet'} tone={selected.alert.naive_alert ? 'bad' : 'ok'} hint={'peak |Δ| ' + fmtOpt(selected.alert.naive_peak_abs, 0)} />
                <Kpi label="Pilot alert" value={selected.alert.pilot_alert ? 'FIRE' : 'quiet'} tone={selected.alert.pilot_alert ? 'bad' : 'ok'} hint={'peak |Δ| ' + fmtOpt(selected.alert.pilot_peak_abs, 0)} />
                <Kpi label="Conclusion changed" value={selected.alert.conclusion_changed ? 'yes' : 'no'} tone={selected.alert.conclusion_changed ? 'bad' : 'muted'} />
                <Kpi label="Missing stays missing" value={selected.missing_rx_visible ? 'visible' : 'none'} />
              </div>
              <Panel title="Question">
                <p className="text-sm text-white/80">{selected.question}</p>
                <p className="text-xs text-white/45 mt-3 leading-relaxed">{selected.disclaimer}</p>
              </Panel>
            </div>
            <Panel title="Assumptions">
              <ul className="text-sm text-white/65 space-y-2 leading-relaxed">
                <li>Rates use observation_time, not arrival_time.</li>
                <li>Duplicates are dropped by (run, source, iface, metric, seq, epoch, value).</li>
                <li>Prometheus increase() treats a decrease as a reset; this lab classifies wrap / restart / reorder / identity / ambiguous and withholds an invented rate when the class is ambiguous.</li>
                <li>Alert threshold {selected.alert.threshold_per_s.toLocaleString()} B/s on any rx_bytes rate point — not the window mean.</li>
              </ul>
            </Panel>
          </div>
        ) : null}

        {view === 'records' ? (
          <Panel
            title={order === 'arrival' ? 'rx_bytes in arrival order' : 'rx_bytes in observation-time order'}
            action={
              <div className="flex gap-2">
                <Btn kind={order === 'arrival' ? 'primary' : 'ghost'} accent={ACCENT} onClick={function () { setOrder('arrival'); }}>Arrival</Btn>
                <Btn kind={order === 'observation' ? 'primary' : 'ghost'} accent={ACCENT} onClick={function () { setOrder('observation'); }}>Observation</Btn>
              </div>
            }
          >
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-xs font-mono">
                <thead className="text-white/40 sticky top-0 bg-[#0f141c]">
                  <tr>
                    <th className="text-left p-2">seq</th>
                    <th className="text-left p-2">epoch</th>
                    <th className="text-left p-2">status</th>
                    <th className="text-left p-2">value</th>
                    <th className="text-left p-2">unit</th>
                    <th className="text-left p-2">t_obs</th>
                    <th className="text-left p-2">t_arr</th>
                    <th className="text-left p-2">transform</th>
                    <th className="text-left p-2">source_ref</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(function (r, i) {
                    return (
                      <tr key={i} className="border-t border-white/5 text-white/75">
                        <td className="p-2">{r.scrape_seq}</td>
                        <td className="p-2">{r.collector_epoch}</td>
                        <td className={'p-2 ' + (r.collection_status === 'ok' ? 'text-emerald-300' : 'text-amber-300')}>{r.collection_status}</td>
                        <td className="p-2">{r.value === null ? 'null' : fmtOpt(r.value, 1)}</td>
                        <td className="p-2">{r.unit}</td>
                        <td className="p-2">{r.observation_time_ms}</td>
                        <td className="p-2">{r.arrival_time_ms}</td>
                        <td className="p-2 text-sky-300">{r.transform}</td>
                        <td className="p-2 text-white/40">{r.source_ref}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-white/40 mt-3">collection_status missing/unsupported/failed is distinct from value 0. Original pinned dataset is preserved in original_rows of the download.</p>
          </Panel>
        ) : null}

        {view === 'timeline' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Naive (observation clock, no classification)">
              <Spark values={naiveSpark} color="#f43f5e" height={72} />
              <p className="text-xs text-white/40 mt-2">mean {fmtOpt(selected.means.naive_obs, 1)} B/s</p>
            </Panel>
            <Panel title="Naive (arrival clock)">
              <Spark values={arrivalSpark} color="#f59e0b" height={72} />
              <p className="text-xs text-white/40 mt-2">mean {fmtOpt(selected.means.naive_arrival, 1)} B/s — late delivery stretches this interval</p>
            </Panel>
            <Panel title="Pilot (observation clock + withheld classes)">
              <Spark values={pilotSpark} color={ACCENT} height={72} />
              <p className="text-xs text-white/40 mt-2">mean {fmtOpt(selected.means.pilot, 1)} B/s · {selected.withheld} points withheld</p>
            </Panel>
          </div>
        ) : null}

        {view === 'calc' ? (
          <Panel title="Per-interval rx_bytes rates">
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-xs font-mono">
                <thead className="text-white/40 sticky top-0 bg-[#0f141c]">
                  <tr>
                    <th className="text-left p-2">seq</th>
                    <th className="text-left p-2">Δt_obs ms</th>
                    <th className="text-left p-2">naive obs</th>
                    <th className="text-left p-2">naive arr</th>
                    <th className="text-left p-2">prom increase</th>
                    <th className="text-left p-2">pilot</th>
                    <th className="text-left p-2">class</th>
                    <th className="text-left p-2">detail</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.rates_rx_bytes.map(function (p, i) {
                    return (
                      <tr key={i} className="border-t border-white/5 text-white/75">
                        <td className="p-2">{p.scrape_seq}</td>
                        <td className="p-2">{p.interval_ms}</td>
                        <td className="p-2">{fmtOpt(p.naive_per_s, 1)}</td>
                        <td className="p-2">{fmtOpt(p.naive_arrival_per_s, 1)}</td>
                        <td className="p-2">{fmtOpt(p.prom_per_s, 1)}</td>
                        <td className={'p-2 ' + (p.pilot_per_s === null ? 'text-amber-300' : '')}>{fmtOpt(p.pilot_per_s, 1)}</td>
                        <td className="p-2 text-sky-300">{p.classification}</td>
                        <td className="p-2 text-white/45 whitespace-nowrap">{p.detail}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : null}

        {view === 'reproduce' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Reproduction">
              <pre className="text-xs text-emerald-200/90 bg-black/40 p-3 rounded overflow-x-auto">{
`pip install -e "./pilot[dev]"
python -m pytest -q
python -m pilot build-cases --out public/pilot
python -m pilot reproduce ${selected.id}
`}</pre>
              <p className="text-sm text-white/60 mt-3">Pinned software {selected.software}. Raw Parquet: <code>/pilot/raw_quality_baseline.parquet</code>.</p>
            </Panel>
            <Panel title="What this case proves">
              <ul className="text-sm text-white/70 space-y-2">
                <li>Raw rows {selected.n_raw} vs unique (metric, seq, epoch) {selected.n_unique_seq}.</li>
                <li>Missing rx_bytes visible: {String(selected.missing_rx_visible)}.</li>
                <li>Naive vs pilot alert: {String(selected.alert.naive_alert)} vs {String(selected.alert.pilot_alert)}.</li>
              </ul>
            </Panel>
          </div>
        ) : null}
      </div>
    </Workbench>
  );
};

export default TelemetryLab;
