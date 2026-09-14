import React, { useMemo, useState } from 'react';
import Workbench from '../../apps/Workbench';
import { Btn, Kpi, Panel, Spark, TestList } from '../../apps/ui';
import { downloadJson, fmtInt, fmtMs, fmtPct, meanStdev } from '../shared/stats';
import {
  defaultInferenceConfig,
  EngineTest,
  heldOutConfig,
  OccupancySegment,
  runInferenceCorrectnessSuite,
  runSimulation,
  runTrials,
  SimConfig,
  SimResult,
  summarize,
  TrialSummary
} from './engine';

const ACCENT = '#22d3ee';
const VIEWS = [
  { id: 'run', label: 'Experiment' },
  { id: 'occupancy', label: 'Occupancy' },
  { id: 'requests', label: 'Requests' },
  { id: 'findings', label: 'Findings' },
  { id: 'tests', label: 'Tests' }
];

const SCENARIOS: { id: string; label: string; apply: (c: SimConfig) => SimConfig }[] = [
  {
    id: 'noisy',
    label: 'Noisy neighbor',
    apply: function (c) {
      return Object.assign({}, c, { interactiveRatio: 0.55, abandonRate: 0.12, retryOnTimeout: true, interactiveReserve: 0.35, cancelCheckOverheadMs: 0.4 });
    }
  },
  {
    id: 'cancel',
    label: 'Cancel / retry leak',
    apply: function (c) {
      return Object.assign({}, c, { interactiveRatio: 0.8, abandonRate: 0.08, clientTimeoutMs: 280, retryOnTimeout: true, meanOutput: 60, interactiveReserve: 0.2, cancelCheckOverheadMs: 0.4 });
    }
  },
  {
    id: 'starve',
    label: 'Isolation starvation',
    apply: function (c) {
      return Object.assign({}, c, { interactiveRatio: 0.12, abandonRate: 0, retryOnTimeout: false, interactiveReserve: 0.7, cancelCheckOverheadMs: 0.8 });
    }
  }
];

function Gantt(props: { result: SimResult | null }) {
  if (!props.result) return <p className="text-sm text-white/40">Run an experiment to draw occupancy.</p>;
  const result = props.result;
  const segs = result.segments.filter(function (s) { return s.end <= result.config.durationMs + 400; }).slice(0, 500);
  const width = 860;
  const rowH = 11;
  const rows = result.slotCapacity;
  const height = rows * rowH + 8;
  const t1 = result.config.durationMs;
  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="bg-black/40 rounded">
        {segs.map(function (s: OccupancySegment, i: number) {
          const idx = s.gpu * result.config.slotsPerGpu + s.slot;
          const x = (s.start / t1) * width;
          const w = Math.max(1, ((s.end - s.start) / t1) * width);
          const fill = s.kind === 'leaked' ? '#f43f5e' : s.kind === 'prefill' ? '#38bdf8' : s.interactive ? '#34d399' : '#a78bfa';
          return <rect key={i} x={x} y={idx * rowH + 1} width={w} height={rowH - 2} fill={fill} rx="1" />;
        })}
      </svg>
      <div className="flex gap-4 mt-2 text-[11px] text-white/50">
        <span>sky prefill</span><span>green interactive</span><span>violet batch</span><span className="text-rose-300">rose leaked</span>
      </div>
    </div>
  );
}

const InferenceLab: React.FC = function () {
  const [view, setView] = useState('run');
  const [scenario, setScenario] = useState('noisy');
  const [gpus, setGpus] = useState(2);
  const [slots, setSlots] = useState(4);
  const [rps, setRps] = useState(18);
  const [trials, setTrials] = useState(5);
  const [seed, setSeed] = useState(42);
  const [reserve, setReserve] = useState(0.35);
  const [busy, setBusy] = useState(false);
  const [baseMean, setBaseMean] = useState<TrialSummary | null>(null);
  const [intMean, setIntMean] = useState<TrialSummary | null>(null);
  const [baseLast, setBaseLast] = useState<SimResult | null>(null);
  const [intLast, setIntLast] = useState<SimResult | null>(null);
  const [intSummaries, setIntSummaries] = useState<TrialSummary[]>([]);
  const [held, setHeld] = useState<{ base: TrialSummary; inter: TrialSummary } | null>(null);
  const [tests, setTests] = useState<EngineTest[] | null>(null);

  const cfg = useMemo(function (): SimConfig {
    const sc = SCENARIOS.find(function (s) { return s.id === scenario; }) || SCENARIOS[0];
    return sc.apply(Object.assign({}, defaultInferenceConfig, {
      seed: seed, gpus: gpus, slotsPerGpu: slots, rps: rps, interactiveReserve: reserve
    }));
  }, [scenario, gpus, slots, rps, seed, reserve]);

  function runCompare() {
    setBusy(true);
    window.setTimeout(function () {
      const baseline = runTrials(Object.assign({}, cfg, { mode: 'baseline', interactiveReserve: 0, cancelCheckOverheadMs: 0 }), trials);
      const intervention = runTrials(Object.assign({}, cfg, { mode: 'intervention' }), trials);
      setBaseMean(baseline.mean);
      setIntMean(intervention.mean);
      setBaseLast(baseline.last);
      setIntLast(intervention.last);
      setIntSummaries(intervention.summaries);
      const ho = heldOutConfig(cfg);
      setHeld({
        base: summarize(runSimulation(Object.assign({}, ho, { mode: 'baseline', interactiveReserve: 0, cancelCheckOverheadMs: 0 }))),
        inter: summarize(runSimulation(Object.assign({}, ho, { mode: 'intervention' })))
      });
      setBusy(false);
      setView('occupancy');
    }, 20);
  }

  const leakDelta = baseMean && intMean ? (1 - intMean.leakedSlotMs / Math.max(baseMean.leakedSlotMs, 1e-6)) : 0;
  const successDelta = baseMean && intMean ? intMean.successRate - baseMean.successRate : 0;
  const p95s = intSummaries.map(function (s) { return s.p95; });
  const p95Spread = meanStdev(p95s);

  return (
    <Workbench
      product="Inference Runtime Workbench"
      domain="ML systems · serving"
      accent={ACCENT}
      views={VIEWS}
      view={view}
      onView={setView}
      statusLeft={busy ? 'Running discrete-event trials…' : (baseMean ? 'Baseline pinned · intervention compared' : 'Idle')}
      statusRight={cfg.gpus + ' GPU × ' + cfg.slotsPerGpu + ' slots · ' + trials + ' trials · seed ' + seed}
    >
      <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
        {view === 'run' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Workload">
              <div className="flex flex-col gap-2 mb-4">
                {SCENARIOS.map(function (s) {
                  return (
                    <button key={s.id} onClick={function () { setScenario(s.id); }} className={'text-left text-sm px-3 py-2 rounded border ' + (scenario === s.id ? 'border-cyan-400 bg-cyan-400/10 text-white' : 'border-white/10 text-white/70')}>
                      {s.label}
                    </button>
                  );
                })}
              </div>
              {[
                { l: 'GPUs', v: gpus, min: 1, max: 4, set: setGpus },
                { l: 'Slots / GPU', v: slots, min: 1, max: 8, set: setSlots },
                { l: 'Arrival rps', v: rps, min: 4, max: 40, set: setRps },
                { l: 'Trials', v: trials, min: 1, max: 8, set: setTrials },
                { l: 'Seed', v: seed, min: 1, max: 200, set: setSeed }
              ].map(function (row) {
                return (
                  <label key={row.l} className="block text-[11px] text-white/50 mb-2">
                    {row.l} <span className="text-white font-mono">{row.v}</span>
                    <input type="range" className="w-full accent-cyan-400" min={row.min} max={row.max} value={row.v} onChange={function (e) { row.set(Number(e.target.value)); }} />
                  </label>
                );
              })}
              <label className="block text-[11px] text-white/50 mb-4">
                Interactive reserve <span className="text-white font-mono">{Math.round(reserve * 100)}%</span>
                <input type="range" className="w-full accent-cyan-400" min={0} max={0.9} step={0.05} value={reserve} onChange={function (e) { setReserve(Number(e.target.value)); }} />
              </label>
              <div className="flex gap-2">
                <Btn accent={ACCENT} disabled={busy} onClick={runCompare}>{busy ? 'Running…' : 'Pin baseline + run intervention'}</Btn>
                <Btn kind="ghost" onClick={function () { setTests(runInferenceCorrectnessSuite()); setView('tests'); }}>Tests</Btn>
              </div>
            </Panel>
            <div className="lg:col-span-2 space-y-4">
              <Panel title="Policy under test">
                <ul className="text-sm text-white/70 space-y-2 list-disc list-inside">
                  <li>Baseline: timeout retry without cancelling the original decode. Slots leak.</li>
                  <li>Intervention: cancel at the next kernel boundary, then retry. Interactive slots reserved.</li>
                  <li>Honest failure: high reserve idles GPUs while batch waits. Cancel checks add kernel overhead.</li>
                  <li>Success-rate gains can raise p95 among survivors (selection effect). Read both metrics.</li>
                </ul>
              </Panel>
              {baseMean && intMean ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Kpi label="Leak reduction" value={fmtPct(leakDelta)} tone={leakDelta > 0.2 ? 'ok' : 'muted'} />
                  <Kpi label="Interactive success Δ" value={(successDelta >= 0 ? '+' : '') + fmtPct(successDelta)} tone={successDelta > 0 ? 'ok' : 'bad'} />
                  <Kpi label="Intervention p95" value={fmtMs(intMean.p95)} hint={'trial σ ' + fmtMs(p95Spread.stdev)} />
                  <Kpi label="Wasted tokens" value={fmtInt(intMean.wastedTokens)} hint={'was ' + fmtInt(baseMean.wastedTokens)} />
                </div>
              ) : (
                <Panel title="Awaiting run">
                  <p className="text-sm text-white/50">This is a discrete-event serving model, not vLLM on hardware. Pin the baseline, then inspect occupancy, the request log, and findings.</p>
                </Panel>
              )}
            </div>
          </div>
        ) : null}

        {view === 'occupancy' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="Baseline leak" value={baseMean ? fmtMs(baseMean.leakedSlotMs) : '—'} />
              <Kpi label="Intervention leak" value={intMean ? fmtMs(intMean.leakedSlotMs) : '—'} tone="ok" />
              <Kpi label="Isolation idle" value={intMean ? fmtMs(intMean.isolationIdleMs) : '—'} />
              <Kpi label="Held-out leak Δ" value={held ? fmtMs(held.base.leakedSlotMs - held.inter.leakedSlotMs) : '—'} />
            </div>
            <Panel title="Baseline occupancy">
              <Gantt result={baseLast} />
            </Panel>
            <Panel title="Intervention occupancy">
              <Gantt result={intLast} />
            </Panel>
            {intLast ? (
              <Panel title="Queue depth (intervention)">
                <Spark color={ACCENT} values={intLast.queueDepthSamples.map(function (s) { return s.depth; })} height={64} />
              </Panel>
            ) : null}
          </div>
        ) : null}

        {view === 'requests' ? (
          <Panel
            title="Intervention request log"
            action={intLast ? <Btn kind="ghost" onClick={function () { downloadJson('inference-intervention.json', { summary: intMean, held: held, requests: intLast.requests.slice(0, 200) }); }}>Export JSON</Btn> : null}
          >
            {intLast ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="text-white/40">
                    <tr>
                      <th className="py-1 pr-3">id</th>
                      <th className="py-1 pr-3">class</th>
                      <th className="py-1 pr-3">retry</th>
                      <th className="py-1 pr-3">start</th>
                      <th className="py-1 pr-3">end</th>
                      <th className="py-1 pr-3">delivered</th>
                      <th className="py-1 pr-3">wasted</th>
                      <th className="py-1 pr-3">status</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/80">
                    {intLast.requests.slice(0, 40).map(function (r) {
                      return (
                        <tr key={r.id} className="border-t border-white/5">
                          <td className="py-1 pr-3">{r.id}</td>
                          <td className="py-1 pr-3">{r.interactive ? 'interactive' : 'batch'}</td>
                          <td className="py-1 pr-3">{r.isRetry ? 'yes' : 'no'}</td>
                          <td className="py-1 pr-3">{r.start === null ? '—' : fmtMs(r.start)}</td>
                          <td className="py-1 pr-3">{r.end === null ? '—' : fmtMs(r.end)}</td>
                          <td className="py-1 pr-3">{r.delivered ? 'yes' : 'no'}</td>
                          <td className="py-1 pr-3">{r.wastedTokens}</td>
                          <td className="py-1 pr-3">{r.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-white/40">Run the experiment first.</p>}
          </Panel>
        ) : null}

        {view === 'findings' ? (
          <Panel title="Investigation note">
            {baseMean && intMean ? (
              <div className="text-sm text-white/75 space-y-3 leading-relaxed">
                <p>Cancel/retry without freeing the in-flight decode is the leak. On this pinned seed family, leaked slot-ms fell from {fmtMs(baseMean.leakedSlotMs)} to {fmtMs(intMean.leakedSlotMs)} ({fmtPct(leakDelta)} reduction). Wasted tokens {fmtInt(baseMean.wastedTokens)} → {fmtInt(intMean.wastedTokens)}.</p>
                <p>Interactive success {fmtPct(baseMean.successRate)} → {fmtPct(intMean.successRate)}. Intervention p95 is {fmtMs(intMean.p95)} versus baseline {fmtMs(baseMean.p95)}. If p95 rose while success rose, that is a survivor mix change, not proof the scheduler is slower for the same completed set.</p>
                <p>Isolation idle {fmtMs(intMean.isolationIdleMs)}. The starvation scenario exists to show the intervention is not free: reserved slots can sit empty while batch queues.</p>
                {held ? <p>Held-out (higher RPS, more abandons, not retuned): leak {fmtMs(held.base.leakedSlotMs)} → {fmtMs(held.inter.leakedSlotMs)}; p95 {fmtMs(held.base.p95)} → {fmtMs(held.inter.p95)}.</p> : null}
                <p className="text-white/45">Not a cluster result. Kernel windows are uninterruptible by construction. No RDMA/NCCL claim is made.</p>
              </div>
            ) : <p className="text-sm text-white/40">Run the experiment to fill the note.</p>}
          </Panel>
        ) : null}

        {view === 'tests' ? (
          <Panel title="Engine invariants" action={<Btn accent={ACCENT} onClick={function () { setTests(runInferenceCorrectnessSuite()); }}>Run suite</Btn>}>
            <TestList tests={tests} empty="Occupancy, leak fixture, delivery after cancel, percentile monotonicity, held-out, starvation." />
          </Panel>
        ) : null}
      </div>
    </Workbench>
  );
};

export default InferenceLab;
