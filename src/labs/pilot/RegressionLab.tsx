import React, { useState } from 'react';
import Workbench from '../../apps/Workbench';
import { Btn, Kpi, Panel, Spark } from '../../apps/ui';
import { downloadJson, fmtNum } from '../shared/stats';
import { fmtOpt, usePilotJson } from './load';
import { Comparison, RegressionPayload } from './types';

const ACCENT = '#c084fc';
const VIEWS = [
  { id: 'aa', label: 'A vs A' },
  { id: 'collector', label: 'Collector change' },
  { id: 'deliberate', label: 'Deliberate regression' },
  { id: 'reproduce', label: 'Reproduce' }
];

function Dist(props: { c: Comparison }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Panel title={props.c.a.name + ' · n=' + props.c.a.n}>
        <Spark values={props.c.a.values} color="#38bdf8" height={72} />
        <p className="text-xs text-white/45 mt-2">median {fmtOpt(props.c.a.median, 3)} · mean {fmtOpt(props.c.a.mean, 3)}</p>
      </Panel>
      <Panel title={props.c.b.name + ' · n=' + props.c.b.n}>
        <Spark values={props.c.b.values} color={ACCENT} height={72} />
        <p className="text-xs text-white/45 mt-2">median {fmtOpt(props.c.b.median, 3)} · mean {fmtOpt(props.c.b.mean, 3)}</p>
      </Panel>
    </div>
  );
}

function Decision(props: { c: Comparison }) {
  const tone = props.c.decision === 'regression_supported' || props.c.decision === 'false_alarm' ? 'bad' : props.c.decision === 'improvement_supported' ? 'ok' : 'muted';
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Kpi label="Primary metric" value={props.c.primary_metric} />
      <Kpi label="Meaningful Δ" value={fmtNum(props.c.meaningful_delta, 2)} />
      <Kpi label="Effect (median B−A)" value={fmtOpt(props.c.effect, 3)} />
      <Kpi label="Decision" value={props.c.decision.replace(/_/g, ' ')} tone={tone as 'ok' | 'bad' | 'muted'} />
    </div>
  );
}

const RegressionLab: React.FC = function () {
  const { data, error, loading } = usePilotJson<RegressionPayload>('/pilot/regression.json');
  const [view, setView] = useState('aa');

  if (loading) {
    return <div className="app-workbench flex items-center justify-center text-white/50">Loading pinned comparisons…</div>;
  }
  if (error || !data) {
    return <div className="app-workbench p-8 text-rose-300">Could not load /pilot/regression.json. {error}</div>;
  }

  const current = view === 'collector' ? data.collector_naive_vs_pilot : view === 'deliberate' ? data.deliberate_regression : data.aa;

  return (
    <Workbench
      product="Release Regression Analyzer"
      domain="Change evaluation"
      accent={ACCENT}
      views={VIEWS}
      view={view}
      onView={setView}
      statusLeft={data.software + ' · repeated independent runs'}
      statusRight={current.decision.replace(/_/g, ' ')}
    >
      <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap gap-2">
          <Btn kind="ghost" onClick={function () { downloadJson('pilot-regression.json', data); }}>Download results</Btn>
        </div>
        <p className="text-xs text-white/45 leading-relaxed">{data.disclaimer}</p>

        {view === 'aa' ? (
          <div className="space-y-4">
            <Decision c={data.aa} />
            <Panel title="What changed">
              <p className="text-sm text-white/70">Nothing. Same seed, same workload, same analysis. A-versus-A measures the false-alarm rate of the decision rule. False alarm: {String(data.aa.aa_false_alarm)}.</p>
            </Panel>
            <Dist c={data.aa} />
            <p className="text-xs text-white/40 font-mono">{data.aa.detail}</p>
          </div>
        ) : null}

        {view === 'collector' ? (
          <div className="space-y-4">
            <Decision c={data.collector_naive_vs_pilot} />
            <Panel title="What changed">
              <p className="text-sm text-white/70">
                Same traces with collector restart, delayed delivery, and duplicates. Primary metric is peak |rx_bytes/s|. Group A uses naive rates (no classification). Group B uses the pilot rate that withholds restart/ambiguous intervals. Lower peak means fewer invented spikes — an analysis-version comparison, not firmware.
              </p>
            </Panel>
            <Dist c={data.collector_naive_vs_pilot} />
            <p className="text-xs text-white/40 font-mono">{data.collector_naive_vs_pilot.detail}</p>
          </div>
        ) : null}

        {view === 'deliberate' ? (
          <div className="space-y-4">
            <Decision c={data.deliberate_regression} />
            <Panel title="What changed">
              <p className="text-sm text-white/70">
                Group B adds 40 ms to every app_latency_ms gauge — a planted regression. The decision rule was declared before the runs: primary metric app_latency_ms, meaningful delta 10 ms, repeated independent seeds.
              </p>
            </Panel>
            <Dist c={data.deliberate_regression} />
            <p className="text-xs text-white/40 font-mono">{data.deliberate_regression.detail}</p>
          </div>
        ) : null}

        {view === 'reproduce' ? (
          <Panel title="Reproduction">
            <pre className="text-xs text-emerald-200/90 bg-black/40 p-3 rounded overflow-x-auto">{
`pip install -e "./pilot[dev]"
python -m pytest -q
python -m pilot reproduce regression
`}</pre>
            <p className="text-sm text-white/55 mt-3">A large number of samples inside one run does not replace repeated independent runs. Workloads and environment ids are in the downloaded JSON.</p>
          </Panel>
        ) : null}
      </div>
    </Workbench>
  );
};

export default RegressionLab;
