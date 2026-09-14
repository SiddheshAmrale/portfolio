import React, { useEffect, useRef, useState } from 'react';
import Workbench from '../../apps/Workbench';
import { Btn, Kpi, Panel, Spark, TestList } from '../../apps/ui';
import { downloadJson, fmtNum } from '../shared/stats';
import { mulberry32 } from '../shared/rng';
import {
  act,
  createFleet,
  FleetState,
  fleetSelfTest,
  Gpu,
  Policy,
  probeGpu,
  tick
} from './model';

const ACCENT = '#fbbf24';
const VIEWS = [
  { id: 'rack', label: 'Rack' },
  { id: 'gpu', label: 'GPU' },
  { id: 'power', label: 'Power' },
  { id: 'log', label: 'Ops log' },
  { id: 'tests', label: 'Tests' }
];

function colorFor(g: Gpu): string {
  if (g.isolated) return '#475569';
  if (g.eccDbe > 0 || g.xid > 0) return '#b91c1c';
  if (g.tempC > 85 || g.nvlinkCrc > 12) return '#ea580c';
  if (g.hidden !== 'healthy') return '#a16207';
  return '#047857';
}

const FleetLab: React.FC = function () {
  const [view, setView] = useState('rack');
  const [state, setState] = useState<FleetState>(function () { return createFleet(11); });
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState('n0-g0');
  const [probe, setProbe] = useState<ReturnType<typeof probeGpu> | null>(null);
  const [tests, setTests] = useState<{ name: string; pass: boolean; detail: string }[] | null>(null);
  const randRef = useRef(mulberry32(11));

  useEffect(function () {
    if (!playing) return undefined;
    const id = window.setInterval(function () {
      setState(function (prev) { return tick(prev, 1, randRef.current); });
    }, 450);
    return function () { window.clearInterval(id); };
  }, [playing]);

  const gpu = state.gpus.find(function (g) { return g.id === selected; }) as Gpu;
  const gpuPower = state.gpus.reduce(function (s, g) { return s + g.powerW; }, 0);
  const alerts = state.gpus.filter(function (g) { return probeGpu(g).recommended !== 'none'; }).length;
  const isolated = state.gpus.filter(function (g) { return g.isolated; }).length;

  function resetFleet() {
    randRef.current = mulberry32(11);
    setState(createFleet(11));
    setProbe(null);
    setPlaying(false);
  }

  return (
    <Workbench
      product="GPU Fleet Operations Console"
      domain="Reliability · diagnostics"
      accent={ACCENT}
      views={VIEWS}
      view={view}
      onView={setView}
      statusLeft={(playing ? 'Live ' : 'Paused ') + 't=' + state.t.toFixed(0) + 's · policy ' + state.policy}
      statusRight={alerts + ' alerts · ' + isolated + ' isolated · PUE model 1.32'}
    >
      <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap gap-2 items-center">
          <Btn accent={ACCENT} onClick={function () { setPlaying(function (p) { return !p; }); }}>{playing ? 'Pause' : 'Play telemetry'}</Btn>
          <Btn kind="ghost" onClick={resetFleet}>Reset fleet</Btn>
          <label className="text-xs text-white/60 flex items-center gap-2">
            Policy
            <select
              className="bg-black border border-white/15 text-white rounded px-2 py-1"
              value={state.policy}
              onChange={function (e) { setState(function (p) { return Object.assign({}, p, { policy: e.target.value as Policy }); }); }}
            >
              <option value="diagnose-then-act">Diagnose then act</option>
              <option value="reboot-storm">Reboot storm</option>
            </select>
          </label>
          <label className="text-xs text-white/60 flex items-center gap-2">
            <input type="checkbox" checked={state.auto} onChange={function (e) { setState(function (p) { return Object.assign({}, p, { auto: e.target.checked }); }); }} />
            Auto-apply policy
          </label>
          <label className="text-xs text-white/60">
            Cooling {state.coolingSetpoint}°C
            <input
              type="range"
              min={18}
              max={32}
              value={state.coolingSetpoint}
              onChange={function (e) { setState(function (p) { return Object.assign({}, p, { coolingSetpoint: Number(e.target.value) }); }); }}
              className="ml-2 accent-amber-400 align-middle"
            />
          </label>
        </div>

        {view === 'rack' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="GPU IT power" value={fmtNum(gpuPower, 0) + ' W'} />
                <Kpi label="Facility (lagged)" value={fmtNum(state.facilityPowerW, 0) + ' W'} />
                <Kpi label="Open alerts" value={String(alerts)} tone={alerts ? 'bad' : 'ok'} />
                <Kpi label="Isolated GPUs" value={String(isolated)} />
              </div>
              <Panel title="Rack map — 4 nodes × 4 GPUs">
                <div className="grid grid-cols-4 gap-2">
                  {state.gpus.map(function (g) {
                    return (
                      <button
                        key={g.id}
                        onClick={function () { setSelected(g.id); setProbe(null); setView('gpu'); }}
                        className={'text-left p-3 rounded border ' + (selected === g.id ? 'border-white' : 'border-white/10')}
                        style={{ background: colorFor(g) }}
                      >
                        <div className="text-xs font-mono text-white">{g.id}</div>
                        <div className="text-[11px] text-white/90">{g.tempC.toFixed(0)}°C · {g.powerW.toFixed(0)}W</div>
                        <div className="text-[11px] text-white/80">util {(g.util * 100).toFixed(0)}%</div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-white/40 mt-3">Green healthy · yellow latent · orange thermal/link · red Xid/ECC · gray isolated</p>
              </Panel>
            </div>
            <Panel title="Why this is not a power scheduler">
              <p className="text-sm text-white/65 leading-relaxed">
                Facility watts lag GPU watts (PUE 1.32 plus cooling). Reboot-storm vs diagnose-then-act is an ops policy comparison. ECC DBE and some Xids recommend isolate, not another reset. This is a 16-GPU model, not a data-center measurement.
              </p>
            </Panel>
          </div>
        ) : null}

        {view === 'gpu' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title={gpu.id}>
              <ul className="text-sm text-white/70 space-y-1 mb-4">
                <li>Hidden fault class: {gpu.hidden}</li>
                <li>Temp {gpu.tempC.toFixed(1)}°C · {gpu.powerW.toFixed(0)} W · util {(gpu.util * 100).toFixed(0)}%</li>
                <li>ECC SBE {gpu.eccSbe} / DBE {gpu.eccDbe}</li>
                <li>Xid {gpu.xid || '—'} · NVLink CRC {gpu.nvlinkCrc}</li>
                <li>Action {gpu.lastAction}{gpu.draining ? ' (draining)' : ''}{gpu.isolated ? ' (isolated)' : ''}</li>
              </ul>
              <Btn accent={ACCENT} onClick={function () { setProbe(probeGpu(gpu)); }}>Run DCGM-style probe</Btn>
              {probe ? (
                <div className="text-xs text-white/65 mt-3 space-y-1">
                  {probe.findings.map(function (f) { return <div key={f}>• {f}</div>; })}
                  <div className="text-white mt-1">Recommended: {probe.recommended}</div>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <Btn kind="ghost" onClick={function () { setState(function (s) { return act(s, gpu.id, 'reset'); }); }}>Reset now</Btn>
                <Btn kind="ghost" onClick={function () { setState(function (s) { return act(s, gpu.id, 'drain-reset'); }); }}>Drain then reset</Btn>
                <Btn kind="ghost" onClick={function () { setState(function (s) { return act(s, gpu.id, 'isolate'); }); }}>Isolate + page</Btn>
                <Btn kind="ghost" onClick={function () { setState(function (s) { return act(s, gpu.id, 'ignore'); }); }}>Ignore</Btn>
              </div>
            </Panel>
            <div className="lg:col-span-2">
              <Panel title="Select another GPU">
                <div className="grid grid-cols-4 gap-2">
                  {state.gpus.map(function (g) {
                    return (
                      <button
                        key={g.id}
                        onClick={function () { setSelected(g.id); setProbe(null); }}
                        className={'text-left p-2 rounded border text-[11px] ' + (selected === g.id ? 'border-white' : 'border-white/10')}
                        style={{ background: colorFor(g) }}
                      >
                        <div className="font-mono">{g.id}</div>
                        <div>{g.tempC.toFixed(0)}°C</div>
                      </button>
                    );
                  })}
                </div>
              </Panel>
            </div>
          </div>
        ) : null}

        {view === 'power' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="GPU energy" value={fmtNum(state.gpuEnergyKj, 1) + ' kJ'} />
              <Kpi label="Facility energy" value={fmtNum(state.facilityEnergyKj, 1) + ' kJ'} />
              <Kpi label="Instant GPU" value={fmtNum(gpuPower, 0) + ' W'} />
              <Kpi label="Instant facility" value={fmtNum(state.facilityPowerW, 0) + ' W'} />
            </div>
            <Panel title="GPU watts vs lagged facility watts" action={<Btn kind="ghost" onClick={function () { downloadJson('fleet-power.json', state.samples); }}>Export series</Btn>}>
              <p className="text-[11px] text-white/40 mb-2">Amber = GPU IT · white = facility (lagged)</p>
              <Spark color="#fbbf24" values={state.samples.map(function (s) { return s.gpuW; })} height={72} />
              <Spark color="#e5e7eb" values={state.samples.map(function (s) { return s.facilityW; })} height={72} />
              <p className="text-xs text-white/40 mt-3">Play telemetry to grow the series. Facility is not a copy of GPU power: PUE 1.32 plus cooling, with lag.</p>
            </Panel>
          </div>
        ) : null}

        {view === 'log' ? (
          <Panel title="Ops log">
            <ol className="text-xs font-mono text-white/65 space-y-1 max-h-[28rem] overflow-auto">
              {state.events.map(function (e, i) {
                return <li key={i}>t={e.t.toFixed(0)} {e.gpuId} {e.msg}</li>;
              })}
            </ol>
            {!state.events.length ? <p className="text-sm text-white/40">No actions yet. Probe a GPU or enable auto-policy.</p> : null}
          </Panel>
        ) : null}

        {view === 'tests' ? (
          <Panel title="Ops model invariants" action={<Btn accent={ACCENT} onClick={function () { setTests(fleetSelfTest()); }}>Run suite</Btn>}>
            <TestList tests={tests} empty="Facility energy is lagged/PUE-scaled separately from GPU energy; isolate drains work; ECC DBE recommends isolate rather than reboot-storm." />
          </Panel>
        ) : null}
      </div>
    </Workbench>
  );
};

export default FleetLab;
