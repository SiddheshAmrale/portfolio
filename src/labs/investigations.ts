import {
  defaultInferenceConfig,
  heldOutConfig,
  runInferenceCorrectnessSuite,
  runSimulation,
  runTrials,
  summarize
} from './inference/engine';
import { compileCircuit, sampleCircuits } from './quantum/compiler';
import { gateCount, minBasisFidelity, toQasm } from './quantum/statevector';
import { runOrchestrator } from './quantum/orchestrator';
import { runQuantumTests } from './quantum/tests';
import {
  compatibilityGrid,
  defaultServices,
  migrateService,
  runPqcTests,
  runTraffic
} from './pqc/model';
import { act, createFleet, fleetSelfTest, probeGpu, tick } from './fleet/model';
import { mulberry32 } from './shared/rng';

export interface LabCheck {
  name: string;
  pass: boolean;
  detail: string;
}

export interface InvestigationReport {
  id: string;
  title: string;
  disclaimer: string;
  checks: LabCheck[];
  findings: Record<string, string | number | boolean>;
  notes: string[];
}

const DISCLAIMER =
  'Browser/Node model with pinned seeds. Not a cluster measurement, hardware result, or claim of upstream adoption.';

export function noisyNeighborConfig() {
  return Object.assign({}, defaultInferenceConfig, {
    seed: 42,
    gpus: 2,
    slotsPerGpu: 4,
    rps: 18,
    interactiveRatio: 0.55,
    abandonRate: 0.12,
    retryOnTimeout: true,
    interactiveReserve: 0.35,
    cancelCheckOverheadMs: 0.4
  });
}

export function runInferenceInvestigation(): InvestigationReport {
  const cfg = noisyNeighborConfig();
  const trials = 5;
  const baseline = runTrials(Object.assign({}, cfg, { mode: 'baseline', interactiveReserve: 0, cancelCheckOverheadMs: 0 }), trials);
  const intervention = runTrials(Object.assign({}, cfg, { mode: 'intervention' }), trials);
  const ho = heldOutConfig(cfg);
  const heldBase = summarize(runSimulation(Object.assign({}, ho, { mode: 'baseline', interactiveReserve: 0, cancelCheckOverheadMs: 0 })));
  const heldInt = summarize(runSimulation(Object.assign({}, ho, { mode: 'intervention' })));
  const leakDelta = 1 - intervention.mean.leakedSlotMs / Math.max(baseline.mean.leakedSlotMs, 1e-6);

  return {
    id: 'inference',
    title: 'Inference runtime — cancel/retry slot leak',
    disclaimer: DISCLAIMER,
    checks: runInferenceCorrectnessSuite(),
    findings: {
      trials: trials,
      seed: cfg.seed,
      baselineLeakedSlotMs: Number(baseline.mean.leakedSlotMs.toFixed(2)),
      interventionLeakedSlotMs: Number(intervention.mean.leakedSlotMs.toFixed(2)),
      leakReduction: Number(leakDelta.toFixed(4)),
      baselineInteractiveSuccess: Number(baseline.mean.successRate.toFixed(4)),
      interventionInteractiveSuccess: Number(intervention.mean.successRate.toFixed(4)),
      baselineP95Ms: Number(baseline.mean.p95.toFixed(2)),
      interventionP95Ms: Number(intervention.mean.p95.toFixed(2)),
      isolationIdleMs: Number(intervention.mean.isolationIdleMs.toFixed(2)),
      heldOutBaselineLeakMs: Number(heldBase.leakedSlotMs.toFixed(2)),
      heldOutInterventionLeakMs: Number(heldInt.leakedSlotMs.toFixed(2))
    },
    notes: [
      'Baseline retries on timeout without cancelling the original decode.',
      'Intervention cancels at the next kernel boundary, then retries, with interactive slot reserve.',
      'p95 among completed interactive requests can rise when success rate rises (survivor mix).'
    ]
  };
}

export function runQuantumInvestigation(): InvestigationReport {
  const compiled = sampleCircuits.map(function (src) {
    const out = compileCircuit(src.circuit, { commute: true, cancel: true, buggy: false });
    return {
      id: src.id,
      name: src.name,
      fidelity: minBasisFidelity(src.circuit, out.circuit),
      gatesBefore: src.circuit.ops.length,
      gatesAfter: out.circuit.ops.length,
      twoQBefore: gateCount(src.circuit.ops).twoQ,
      twoQAfter: gateCount(out.circuit.ops).twoQ,
      qasm: toQasm(out.circuit)
    };
  });
  const jobs = sampleCircuits.map(function (src, i) {
    return { id: i + 1, circuit: src.circuit, classicalWrites: 1 };
  });
  const naive = runOrchestrator({ jobs: jobs, recovery: 'naive', failProb: 0.35, seed: 7 });
  const exact = runOrchestrator({ jobs: jobs, recovery: 'exactly-once', failProb: 0.35, seed: 7 });

  return {
    id: 'quantum',
    title: 'Quantum compiler + hybrid orchestrator',
    disclaimer: DISCLAIMER,
    checks: runQuantumTests(),
    findings: {
      redundantFidelity: compiled[0].fidelity,
      redundantGatesBefore: compiled[0].gatesBefore,
      redundantGatesAfter: compiled[0].gatesAfter,
      naiveDuplicatePublishes: naive.duplicatePublishes,
      exactlyOnceDuplicatePublishes: exact.duplicatePublishes,
      exactlyOncePublished: exact.published.length,
      exactlyOnceSuccesses: exact.successes
    },
    notes: [
      'Fidelity is the minimum overlap over every computational-basis input, not |0…0⟩.',
      'Naive recovery re-applies classical writes after zombie retries; exactly-once skips them.',
      compiled[0].qasm
    ]
  };
}

export function runPqcInvestigation(): InvestigationReport {
  const services = defaultServices().map(function (s) { return migrateService(s, 'hybrid'); });
  const traffic = runTraffic(services, { modern: 0.55, legacy: 0.25, middlebox: 0.2 }, 120, 21);
  const grid = compatibilityGrid(services);
  const waf = grid.find(function (row) { return row.service.id === 'waf'; });

  return {
    id: 'pqc',
    title: 'PQC migration compatibility',
    disclaimer: DISCLAIMER + ' Handshake CPU is order-of-magnitude, not a cycle-accurate benchmark.',
    checks: runPqcTests(),
    findings: {
      trafficOk: traffic.ok,
      trafficFail: traffic.fail,
      avgHelloBytes: Number(traffic.avgHello.toFixed(1)),
      wafHelloBytes: waf ? waf.modern.clientHelloBytes : 0,
      wafMiddleboxOk: waf ? waf.middlebox.ok : false,
      wafInspectLimit: waf ? waf.service.inspectLimit : 0
    },
    notes: [
      'Sizes follow FIPS 203/204 (ML-KEM-768 public 1184 B, ML-DSA-65 sig 3309 B).',
      'Hybrid ClientHello inflation is a documented middlebox failure class, modeled on a 1500 B inspector.'
    ]
  };
}

export function runFleetInvestigation(): InvestigationReport {
  const rand = mulberry32(11);
  let state = createFleet(11);
  for (let i = 0; i < 16; i++) state = tick(state, 1, rand);
  const xid = state.gpus.find(function (g) { return g.xid > 0 || g.hidden === 'xid'; }) || state.gpus[0];
  const rec = probeGpu(xid);
  const isolated = act(state, xid.id, 'isolate');
  const g = isolated.gpus.find(function (x) { return x.id === xid.id; });
  const gpuEnergy = state.gpuEnergyKj;
  const facilityEnergy = state.facilityEnergyKj;

  return {
    id: 'fleet',
    title: 'GPU fleet diagnostics and repair',
    disclaimer: DISCLAIMER + ' Facility watts use PUE 1.32 plus lag; this is not a data-center measurement.',
    checks: fleetSelfTest(),
    findings: {
      ticks: state.t,
      gpuEnergyKj: Number(gpuEnergy.toFixed(3)),
      facilityEnergyKj: Number(facilityEnergy.toFixed(3)),
      facilityExceedsGpu: facilityEnergy > gpuEnergy,
      probedGpu: xid.id,
      probeRecommended: rec.recommended,
      isolateUtil: g ? g.util : -1,
      isolateFlag: g ? g.isolated : false
    },
    notes: [
      'Reboot-storm vs diagnose-then-act is an ops policy comparison.',
      'Uncorrectable ECC / some Xids recommend isolate, not another reset.'
    ]
  };
}

export function runAllInvestigations(): InvestigationReport[] {
  return [
    runInferenceInvestigation(),
    runQuantumInvestigation(),
    runPqcInvestigation(),
    runFleetInvestigation()
  ];
}

export function allChecksPassed(reports: InvestigationReport[]): boolean {
  for (let i = 0; i < reports.length; i++) {
    const checks = reports[i].checks;
    for (let j = 0; j < checks.length; j++) {
      if (!checks[j].pass) return false;
    }
  }
  return true;
}

export function formatReportMarkdown(reports: InvestigationReport[]): string {
  const lines: string[] = [
    '# Systems workbench reports',
    '',
    'Generated from the engines in `src/labs`. Run `npm run workbench` to reproduce.',
    ''
  ];
  for (let i = 0; i < reports.length; i++) {
    const r = reports[i];
    const passed = r.checks.filter(function (c) { return c.pass; }).length;
    lines.push('## ' + r.title);
    lines.push('');
    lines.push(r.disclaimer);
    lines.push('');
    lines.push('Checks: **' + passed + '/' + r.checks.length + ' passed**.');
    lines.push('');
    lines.push('### Findings');
    lines.push('');
    const keys = Object.keys(r.findings);
    for (let k = 0; k < keys.length; k++) {
      lines.push('- `' + keys[k] + '`: ' + String(r.findings[keys[k]]));
    }
    lines.push('');
    lines.push('### Checks');
    lines.push('');
    for (let c = 0; c < r.checks.length; c++) {
      const t = r.checks[c];
      lines.push('- ' + (t.pass ? 'PASS' : 'FAIL') + ' — ' + t.name + ' — ' + t.detail);
    }
    lines.push('');
    if (r.notes.length) {
      lines.push('### Notes');
      lines.push('');
      for (let n = 0; n < r.notes.length; n++) {
        if (r.notes[n].indexOf('OPENQASM') === 0) {
          lines.push('```');
          lines.push(r.notes[n]);
          lines.push('```');
        } else {
          lines.push('- ' + r.notes[n]);
        }
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}
