import React, { useMemo, useState } from 'react';
import Workbench from '../../apps/Workbench';
import { Btn, Kpi, Panel, TestList } from '../../apps/ui';
import { downloadJson, fmtNum } from '../shared/stats';
import { mulberry32 } from '../shared/rng';
import { compileCircuit, sampleCircuits } from './compiler';
import {
  Circuit,
  formatOp,
  gateCount,
  measureShots,
  minBasisFidelity,
  Op,
  runCircuit,
  toQasm
} from './statevector';
import { HybridJob, OrchestratorResult, Recovery, runOrchestrator } from './orchestrator';
import { QuantumTest, runQuantumTests } from './tests';

const ACCENT = '#a78bfa';
const VIEWS = [
  { id: 'compiler', label: 'Compiler' },
  { id: 'editor', label: 'Circuit' },
  { id: 'simulate', label: 'Simulate' },
  { id: 'orchestrate', label: 'Hybrid jobs' },
  { id: 'tests', label: 'Tests' }
];

function OpList(props: { ops: Op[] }) {
  if (!props.ops.length) {
    return <div className="text-xs font-mono text-emerald-300 bg-black/40 rounded p-3">(identity — all ops cancelled)</div>;
  }
  return (
    <ol className="text-xs font-mono text-white/70 space-y-1 max-h-72 overflow-auto bg-black/40 rounded p-3">
      {props.ops.map(function (op, i) {
        return <li key={i}>{String(i + 1).padStart(2, '0')}  {formatOp(op)}</li>;
      })}
    </ol>
  );
}

const GATE_BUTTONS: { label: string; make: (n: number) => Op }[] = [
  { label: 'H', make: function () { return { t: 'H', q: 0 }; } },
  { label: 'X', make: function () { return { t: 'X', q: 0 }; } },
  { label: 'Z', make: function () { return { t: 'Z', q: 0 }; } },
  { label: 'S', make: function () { return { t: 'S', q: 0 }; } },
  { label: 'SDG', make: function () { return { t: 'SDG', q: 0 }; } },
  { label: 'T', make: function () { return { t: 'T', q: 0 }; } },
  { label: 'RZ(π/2)', make: function () { return { t: 'RZ', q: 0, theta: Math.PI / 2 }; } },
  { label: 'RZ(−π/2)', make: function () { return { t: 'RZ', q: 0, theta: -Math.PI / 2 }; } },
  { label: 'CX 0→1', make: function (n) { return { t: 'CX', c: 0, q: Math.min(1, n - 1) }; } },
  { label: 'SWAP 0,1', make: function (n) { return { t: 'SWAP', a: 0, b: Math.min(1, n - 1), q: 0 }; } }
];

const QuantumLab: React.FC = function () {
  const [view, setView] = useState('compiler');
  const [sampleId, setSampleId] = useState(sampleCircuits[0].id);
  const [commute, setCommute] = useState(true);
  const [cancel, setCancel] = useState(true);
  const [buggy, setBuggy] = useState(false);
  const [editor, setEditor] = useState<Circuit>(sampleCircuits[0].circuit);
  const [targetQ, setTargetQ] = useState(0);
  const [shots, setShots] = useState(256);
  const [recovery, setRecovery] = useState<Recovery>('naive');
  const [failProb, setFailProb] = useState(0.35);
  const [orch, setOrch] = useState<OrchestratorResult | null>(null);
  const [tests, setTests] = useState<QuantumTest[] | null>(null);

  const compiled = useMemo(function () {
    return compileCircuit(editor, { commute: commute, cancel: cancel, buggy: buggy });
  }, [editor, commute, cancel, buggy]);
  const fidelity = useMemo(function () {
    return minBasisFidelity(editor, compiled.circuit);
  }, [editor, compiled]);
  const before = gateCount(editor.ops);
  const after = gateCount(compiled.circuit.ops);
  const hist = useMemo(function () {
    const state = runCircuit(compiled.circuit);
    return measureShots(state, shots, mulberry32(19));
  }, [compiled, shots]);

  function loadSample(id: string) {
    const s = sampleCircuits.find(function (x) { return x.id === id; }) || sampleCircuits[0];
    setSampleId(id);
    setEditor({ n: s.circuit.n, ops: s.circuit.ops.slice() });
  }

  function addGate(make: (n: number) => Op) {
    setEditor(function (prev) {
      const op = make(prev.n);
      if (op.t === 'CX' || op.t === 'H' || op.t === 'X' || op.t === 'Z' || op.t === 'S' || op.t === 'SDG' || op.t === 'T' || op.t === 'TDG' || op.t === 'RX' || op.t === 'RY' || op.t === 'RZ') {
        op.q = Math.min(Math.max(targetQ, 0), prev.n - 1);
        if (op.t === 'CX') op.c = op.c === op.q ? (op.q + 1) % prev.n : op.c;
      }
      return { n: prev.n, ops: prev.ops.concat([op]) };
    });
  }

  function runJobs() {
    const jobs: HybridJob[] = [
      { id: 1, circuit: compiled.circuit, classicalWrites: 1 },
      { id: 2, circuit: sampleCircuits[1].circuit, classicalWrites: 1 },
      { id: 3, circuit: sampleCircuits[2].circuit, classicalWrites: 1 }
    ];
    setOrch(runOrchestrator({ jobs: jobs, recovery: recovery, failProb: failProb, seed: 7 }));
  }

  const maxCount = hist.length ? hist[0].count : 1;

  return (
    <Workbench
      product="Quantum Compiler Workbench"
      domain="Compilers · hybrid orchestration"
      accent={ACCENT}
      views={VIEWS}
      view={view}
      onView={setView}
      statusLeft={buggy ? 'Buggy pass enabled — fidelity expected to drop' : 'Statevector fidelity over all 2ⁿ basis states'}
      statusRight={editor.n + ' qubits · ' + editor.ops.length + ' → ' + compiled.circuit.ops.length + ' ops · F=' + fidelity.toFixed(8)}
    >
      <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
        {view === 'compiler' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Input circuit">
              <div className="flex flex-col gap-2 mb-4">
                {sampleCircuits.map(function (s) {
                  return (
                    <button key={s.id} onClick={function () { loadSample(s.id); }} className={'text-left text-sm px-3 py-2 rounded border ' + (sampleId === s.id ? 'border-violet-400 bg-violet-400/10 text-white' : 'border-white/10 text-white/70')}>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-[11px] text-white/45 mt-0.5">{s.note}</div>
                    </button>
                  );
                })}
              </div>
              <label className="flex items-center gap-2 text-sm text-white/70 mb-2">
                <input type="checkbox" checked={commute} onChange={function (e) { setCommute(e.target.checked); }} />
                Commute pass
              </label>
              <label className="flex items-center gap-2 text-sm text-white/70 mb-2">
                <input type="checkbox" checked={cancel} onChange={function (e) { setCancel(e.target.checked); }} />
                Cancel / merge
              </label>
              <label className="flex items-center gap-2 text-sm text-amber-200 mb-4">
                <input type="checkbox" checked={buggy} onChange={function (e) { setBuggy(e.target.checked); }} />
                Inject adjacent-swap bug
              </label>
              <Btn kind="ghost" onClick={function () { setTests(runQuantumTests()); setView('tests'); }}>Run tests</Btn>
            </Panel>
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Min basis fidelity" value={fmtNum(fidelity, 8)} tone={fidelity >= 0.999 ? 'ok' : 'bad'} />
                <Kpi label="Gate count" value={before.total + ' → ' + after.total} />
                <Kpi label="Two-qubit ops" value={String(before.twoQ) + ' → ' + String(after.twoQ)} />
                <Kpi label="Depth" value={String(before.depth) + ' → ' + String(after.depth)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Panel title="Before">
                  <OpList ops={editor.ops} />
                </Panel>
                <Panel title="After" action={<span className="text-[11px] font-mono text-white/40">{compiled.passes.join(' · ')}</span>}>
                  <OpList ops={compiled.circuit.ops} />
                </Panel>
              </div>
              <Panel title="What is being claimed">
                <p className="text-sm text-white/70 leading-relaxed">
                  Fidelity is the minimum overlap of the compiled unitary against the original on every computational-basis input, not a demo on |0…0⟩. The buggy pass exists so a broken rewrite fails that check. This is a browser statevector, not a hardware compiler or a claim of Qiskit/Cirq adoption.
                </p>
              </Panel>
            </div>
          </div>
        ) : null}

        {view === 'editor' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Append gates">
              <label className="block text-[11px] text-white/50 mb-3">
                Target qubit <span className="text-white font-mono">{targetQ}</span>
                <input type="range" className="w-full accent-violet-400" min={0} max={Math.max(editor.n - 1, 0)} value={targetQ} onChange={function (e) { setTargetQ(Number(e.target.value)); }} />
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {GATE_BUTTONS.map(function (g) {
                  return <Btn key={g.label} kind="ghost" onClick={function () { addGate(g.make); }}>{g.label}</Btn>;
                })}
              </div>
              <div className="flex gap-2">
                <Btn kind="ghost" onClick={function () { setEditor(function (p) { return { n: p.n, ops: p.ops.slice(0, -1) }; }); }}>Undo</Btn>
                <Btn kind="ghost" onClick={function () { setEditor({ n: editor.n, ops: [] }); }}>Clear</Btn>
                <Btn kind="ghost" onClick={function () { loadSample(sampleId); }}>Reload sample</Btn>
              </div>
            </Panel>
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Edited fidelity vs source" value={fmtNum(fidelity, 6)} tone={fidelity >= 0.999 ? 'ok' : 'muted'} hint="after current passes" />
                <Kpi label="Ops" value={String(editor.ops.length)} />
                <Kpi label="Compiled ops" value={String(compiled.circuit.ops.length)} />
                <Kpi label="Qubits" value={String(editor.n)} />
              </div>
              <Panel title="Working circuit">
                <OpList ops={editor.ops} />
              </Panel>
              <Panel title="OpenQASM 2.0 (compiled)" action={<Btn kind="ghost" onClick={function () { downloadJson('circuit-qasm.json', { qasm: toQasm(compiled.circuit), ops: compiled.circuit.ops }); }}>Export</Btn>}>
                <pre className="text-xs font-mono text-violet-200 bg-black/50 rounded p-3 overflow-auto max-h-56 whitespace-pre">{toQasm(compiled.circuit)}</pre>
              </Panel>
            </div>
          </div>
        ) : null}

        {view === 'simulate' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="Shots" value={String(shots)} />
              <Kpi label="Distinct outcomes" value={String(hist.length)} />
              <Kpi label="Fidelity" value={fmtNum(fidelity, 8)} />
              <Kpi label="Hilbert dim" value={String(1 << editor.n)} />
            </div>
            <Panel title="Measurement histogram (compiled circuit from |0…0⟩)">
              <label className="block text-[11px] text-white/50 mb-4 max-w-sm">
                Shots {shots}
                <input type="range" className="w-full accent-violet-400" min={32} max={1024} step={32} value={shots} onChange={function (e) { setShots(Number(e.target.value)); }} />
              </label>
              <div className="space-y-1">
                {hist.slice(0, 16).map(function (h) {
                  return (
                    <div key={h.bitstring} className="flex items-center gap-3 text-xs font-mono">
                      <span className="w-24 text-white/70">{h.bitstring}</span>
                      <div className="flex-1 h-3 bg-white/10 rounded overflow-hidden">
                        <div className="h-full bg-violet-400" style={{ width: ((h.count / maxCount) * 100) + '%' }} />
                      </div>
                      <span className="w-16 text-right text-white/80">{h.count}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-white/40 mt-3">Histogram is a |0…0⟩ sampling check. Semantic correctness is still the all-basis fidelity, not this plot.</p>
            </Panel>
          </div>
        ) : null}

        {view === 'orchestrate' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Recovery policy">
              <label className="block text-sm text-white/70 mb-3">
                Mode
                <select className="mt-1 w-full bg-black border border-white/15 rounded px-2 py-1.5 text-white" value={recovery} onChange={function (e) { setRecovery(e.target.value as Recovery); }}>
                  <option value="naive">Naive at-least-once</option>
                  <option value="exactly-once">Exactly-once (idempotency key)</option>
                </select>
              </label>
              <label className="block text-[11px] text-white/50 mb-4">
                Device fail probability {Math.round(failProb * 100)}%
                <input type="range" className="w-full accent-violet-400" min={0} max={0.8} step={0.05} value={failProb} onChange={function (e) { setFailProb(Number(e.target.value)); }} />
              </label>
              <Btn accent={ACCENT} onClick={runJobs}>Run hybrid batch</Btn>
            </Panel>
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Successes" value={orch ? String(orch.successes) : '—'} />
                <Kpi label="Failures" value={orch ? String(orch.failures) : '—'} />
                <Kpi label="Quantum retries" value={orch ? String(orch.quantumRetries) : '—'} />
                <Kpi label="Duplicate publishes" value={orch ? String(orch.duplicatePublishes) : '—'} tone={orch && orch.duplicatePublishes > 0 ? 'bad' : 'ok'} />
              </div>
              <Panel title="Job log">
                {orch ? (
                  <ol className="text-xs font-mono text-white/65 space-y-1 max-h-80 overflow-auto">
                    {orch.events.map(function (e, i) {
                      return <li key={i}>t={e.t} job-{e.jobId} {e.stage} — {e.detail}</li>;
                    })}
                  </ol>
                ) : <p className="text-sm text-white/40">Run the batch. Naive recovery will re-apply classical writes after zombie retries; exactly-once skips them.</p>}
              </Panel>
            </div>
          </div>
        ) : null}

        {view === 'tests' ? (
          <Panel title="Compiler and orchestrator invariants" action={<Btn accent={ACCENT} onClick={function () { setTests(runQuantumTests()); }}>Run suite</Btn>}>
            <TestList tests={tests} empty="Fidelity on every sample, buggy-pass detection, identity cancellation, naive duplicates vs exactly-once." />
          </Panel>
        ) : null}
      </div>
    </Workbench>
  );
};

export default QuantumLab;
