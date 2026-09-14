import { compileCircuit, sampleCircuits } from './compiler';
import { minBasisFidelity } from './statevector';
import { HybridJob, runOrchestrator } from './orchestrator';

export interface QuantumTest {
  name: string;
  pass: boolean;
  detail: string;
}

export function runQuantumTests(): QuantumTest[] {
  const tests: QuantumTest[] = [];
  for (let i = 0; i < sampleCircuits.length; i++) {
    const src = sampleCircuits[i];
    const compiled = compileCircuit(src.circuit, { commute: true, cancel: true, buggy: false });
    const f = minBasisFidelity(src.circuit, compiled.circuit);
    tests.push({
      name: 'Semantic fidelity ≥ 0.999 on ' + src.name,
      pass: f >= 0.999,
      detail: 'min basis fidelity=' + f.toFixed(12) + ' gates ' + src.circuit.ops.length + '→' + compiled.circuit.ops.length
    });
  }
  const buggy = compileCircuit(sampleCircuits[1].circuit, { commute: false, cancel: false, buggy: true });
  const bf = minBasisFidelity(sampleCircuits[1].circuit, buggy.circuit);
  tests.push({
    name: 'Buggy adjacent-swap pass is caught by the fidelity check',
    pass: bf < 0.999,
    detail: 'fidelity=' + bf.toFixed(6)
  });
  const red = compileCircuit(sampleCircuits[0].circuit, { commute: true, cancel: true, buggy: false });
  tests.push({
    name: 'Redundant identities are removed',
    pass: red.circuit.ops.length < sampleCircuits[0].circuit.ops.length,
    detail: sampleCircuits[0].circuit.ops.length + ' → ' + red.circuit.ops.length + ' ops'
  });

  const jobs: HybridJob[] = [
    { id: 1, circuit: sampleCircuits[0].circuit, classicalWrites: 1 },
    { id: 2, circuit: sampleCircuits[1].circuit, classicalWrites: 1 },
    { id: 3, circuit: sampleCircuits[2].circuit, classicalWrites: 1 }
  ];
  const naive = runOrchestrator({ jobs: jobs, recovery: 'naive', failProb: 0.35, seed: 7 });
  const exact = runOrchestrator({ jobs: jobs, recovery: 'exactly-once', failProb: 0.35, seed: 7 });
  tests.push({
    name: 'Naive recovery can duplicate classical publishes',
    pass: naive.duplicatePublishes > 0,
    detail: 'duplicates=' + naive.duplicatePublishes + ' published=' + naive.published.length
  });
  tests.push({
    name: 'Exactly-once recovery publishes one row per successful job',
    pass: exact.duplicatePublishes === 0 && exact.published.length === exact.successes,
    detail: 'duplicates=' + exact.duplicatePublishes + ' published=' + exact.published.length + ' successes=' + exact.successes
  });
  return tests;
}
