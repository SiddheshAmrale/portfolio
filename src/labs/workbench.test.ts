import {
  allChecksPassed,
  InvestigationReport,
  runAllInvestigations,
  runInferenceInvestigation,
  runQuantumInvestigation
} from './investigations';
import { compileCircuit, sampleCircuits } from './quantum/compiler';
import { minBasisFidelity } from './quantum/statevector';

jest.setTimeout(30000);

describe('systems workbench (headless)', function () {
  let reports: InvestigationReport[];

  beforeAll(function () {
    reports = runAllInvestigations();
  });

  test('every investigation check passes', function () {
    const failed: string[] = [];
    for (let i = 0; i < reports.length; i++) {
      for (let j = 0; j < reports[i].checks.length; j++) {
        const c = reports[i].checks[j];
        if (!c.pass) failed.push(reports[i].id + ': ' + c.name + ' — ' + c.detail);
      }
    }
    expect(failed).toEqual([]);
    expect(allChecksPassed(reports)).toBe(true);
  });

  test('inference leak reduction is material on the pinned noisy-neighbor seed', function () {
    const inf = reports.find(function (r) { return r.id === 'inference'; });
    expect(inf).toBeTruthy();
    const reduction = Number(inf!.findings.leakReduction);
    expect(reduction).toBeGreaterThan(0.5);
    expect(Number(inf!.findings.interventionLeakedSlotMs)).toBeLessThan(Number(inf!.findings.baselineLeakedSlotMs));
  });

  test('held-out inference leak also falls', function () {
    const inf = runInferenceInvestigation();
    expect(Number(inf.findings.heldOutInterventionLeakMs)).toBeLessThan(Number(inf.findings.heldOutBaselineLeakMs));
  });

  test('quantum compiler preserves the unitary on every sample circuit', function () {
    for (let i = 0; i < sampleCircuits.length; i++) {
      const src = sampleCircuits[i];
      const compiled = compileCircuit(src.circuit, { commute: true, cancel: true, buggy: false });
      expect(minBasisFidelity(src.circuit, compiled.circuit)).toBeGreaterThanOrEqual(0.999);
    }
  });

  test('exactly-once hybrid recovery has zero duplicate publishes on the pinned seed', function () {
    const q = runQuantumInvestigation();
    expect(Number(q.findings.naiveDuplicatePublishes)).toBeGreaterThan(0);
    expect(q.findings.exactlyOnceDuplicatePublishes).toBe(0);
  });

  test('PQC hybrid WAF inspection fails while most mixed traffic succeeds', function () {
    const pqc = reports.find(function (r) { return r.id === 'pqc'; });
    expect(pqc).toBeTruthy();
    expect(pqc!.findings.wafMiddleboxOk).toBe(false);
    expect(Number(pqc!.findings.wafHelloBytes)).toBeGreaterThan(Number(pqc!.findings.wafInspectLimit));
    expect(Number(pqc!.findings.trafficOk)).toBeGreaterThan(Number(pqc!.findings.trafficFail));
  });

  test('fleet facility energy exceeds GPU energy and isolate zeroes util', function () {
    const fleet = reports.find(function (r) { return r.id === 'fleet'; });
    expect(fleet).toBeTruthy();
    expect(fleet!.findings.facilityExceedsGpu).toBe(true);
    expect(fleet!.findings.isolateUtil).toBe(0);
    expect(fleet!.findings.isolateFlag).toBe(true);
  });
});
