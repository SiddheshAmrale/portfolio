import { Circuit, Op, qubitsOf } from './statevector';

const EPS = 1e-10;

function inversePair(a: Op, b: Op): boolean {
  if (a.t === 'H' && b.t === 'H' && a.q === b.q) return true;
  if (a.t === 'X' && b.t === 'X' && a.q === b.q) return true;
  if (a.t === 'Y' && b.t === 'Y' && a.q === b.q) return true;
  if (a.t === 'Z' && b.t === 'Z' && a.q === b.q) return true;
  if (a.t === 'S' && b.t === 'SDG' && a.q === b.q) return true;
  if (a.t === 'SDG' && b.t === 'S' && a.q === b.q) return true;
  if (a.t === 'T' && b.t === 'TDG' && a.q === b.q) return true;
  if (a.t === 'TDG' && b.t === 'T' && a.q === b.q) return true;
  if (a.t === 'CX' && b.t === 'CX' && a.q === b.q && a.c === b.c) return true;
  if (a.t === 'SWAP' && b.t === 'SWAP') {
    const as = [a.a, a.b].slice().sort();
    const bs = [b.a, b.b].slice().sort();
    return as[0] === bs[0] && as[1] === bs[1];
  }
  return false;
}

function sameAxisMerge(a: Op, b: Op): Op | null {
  if (a.q !== b.q) return null;
  if ((a.t === 'RZ' && b.t === 'RZ') || (a.t === 'RX' && b.t === 'RX') || (a.t === 'RY' && b.t === 'RY')) {
    const theta = (a.theta || 0) + (b.theta || 0);
    return { t: a.t, q: a.q, theta: theta };
  }
  if (a.t === 'S' && b.t === 'S' && a.q === b.q) return { t: 'Z', q: a.q };
  if (a.t === 'SDG' && b.t === 'SDG' && a.q === b.q) return { t: 'Z', q: a.q };
  return null;
}

function nearZeroRotation(op: Op): boolean {
  if (op.t !== 'RX' && op.t !== 'RY' && op.t !== 'RZ') return false;
  const t = ((op.theta || 0) + Math.PI * 8) % (2 * Math.PI);
  return Math.abs(t) < EPS || Math.abs(t - 2 * Math.PI) < EPS;
}

function disjoint(a: Op, b: Op): boolean {
  const qa = qubitsOf(a);
  const qb = qubitsOf(b);
  for (let i = 0; i < qa.length; i++) {
    for (let j = 0; j < qb.length; j++) {
      if (qa[i] === qb[j]) return false;
    }
  }
  return true;
}

function commutes(a: Op, b: Op): boolean {
  if (disjoint(a, b)) return true;
  if (a.t === 'RZ' && b.t === 'RZ' && a.q === b.q) return true;
  if (a.t === 'Z' && b.t === 'RZ' && a.q === b.q) return true;
  if (a.t === 'RZ' && b.t === 'Z' && a.q === b.q) return true;
  if (a.t === 'Z' && b.t === 'Z' && a.q === b.q) return true;
  if (a.t === 'CX' && b.t === 'RZ' && b.q === a.c) return true;
  if (b.t === 'CX' && a.t === 'RZ' && a.q === b.c) return true;
  if (a.t === 'CX' && b.t === 'Z' && b.q === a.c) return true;
  if (b.t === 'CX' && a.t === 'Z' && a.q === b.c) return true;
  if (a.t === 'CX' && b.t === 'X' && b.q === a.q) return true;
  if (b.t === 'CX' && a.t === 'X' && a.q === b.q) return true;
  return false;
}

function cancelPass(ops: Op[]): Op[] {
  const out: Op[] = [];
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (nearZeroRotation(op)) continue;
    if (out.length && inversePair(out[out.length - 1], op)) {
      out.pop();
      continue;
    }
    if (out.length) {
      const merged = sameAxisMerge(out[out.length - 1], op);
      if (merged) {
        out.pop();
        if (!nearZeroRotation(merged) && merged.t) out.push(merged);
        continue;
      }
    }
    out.push(op);
  }
  return out;
}

function commutePass(ops: Op[]): Op[] {
  const a = ops.slice();
  for (let i = 0; i < a.length - 1; i++) {
    if (!commutes(a[i], a[i + 1])) continue;
    if (inversePair(a[i], a[i + 1]) || sameAxisMerge(a[i], a[i + 1]) || inversePair(a[i + 1], a[i])) {
      const tmp = a[i];
      a[i] = a[i + 1];
      a[i + 1] = tmp;
    }
  }
  return a;
}

function buggySwapPass(ops: Op[]): Op[] {
  const a = ops.slice();
  for (let i = 0; i < a.length - 1; i += 2) {
    const tmp = a[i];
    a[i] = a[i + 1];
    a[i + 1] = tmp;
  }
  return a;
}

export interface CompileResult {
  circuit: Circuit;
  passes: string[];
}

export function compileCircuit(input: Circuit, opts: { commute: boolean; cancel: boolean; buggy: boolean }): CompileResult {
  let ops = input.ops.slice();
  const passes: string[] = ['copy'];
  if (opts.buggy) {
    ops = buggySwapPass(ops);
    passes.push('buggy-adjacent-swap');
  }
  for (let k = 0; k < 8; k++) {
    const before = ops.length;
    if (opts.commute) {
      ops = commutePass(ops);
      passes.push('commute');
    }
    if (opts.cancel) {
      ops = cancelPass(ops);
      passes.push('cancel-merge');
    }
    if (ops.length === before) break;
  }
  return { circuit: { n: input.n, ops: ops }, passes: passes };
}

export const sampleCircuits: { id: string; name: string; note: string; circuit: Circuit }[] = [
  {
    id: 'redundant',
    name: 'Redundant 3-qubit',
    note: 'HH, XX and inverse CX pairs that a correct pass must delete without changing the unitary.',
    circuit: {
      n: 3,
      ops: [
        { t: 'H', q: 0 }, { t: 'H', q: 0 },
        { t: 'X', q: 1 }, { t: 'X', q: 1 },
        { t: 'H', q: 2 },
        { t: 'CX', c: 0, q: 1 }, { t: 'CX', c: 0, q: 1 },
        { t: 'RZ', q: 2, theta: Math.PI / 3 }, { t: 'RZ', q: 2, theta: -Math.PI / 3 },
        { t: 'H', q: 2 }
      ]
    }
  },
  {
    id: 'qft3',
    name: 'QFT-ish 3-qubit',
    note: 'Hadamards and controlled phases with extra identities inserted for the compiler to eat.',
    circuit: {
      n: 3,
      ops: [
        { t: 'H', q: 0 },
        { t: 'RZ', q: 1, theta: Math.PI / 2 }, { t: 'CX', c: 1, q: 0 }, { t: 'RZ', q: 0, theta: -Math.PI / 2 }, { t: 'CX', c: 1, q: 0 },
        { t: 'H', q: 1 }, { t: 'H', q: 1 }, { t: 'H', q: 1 },
        { t: 'RZ', q: 2, theta: Math.PI / 4 }, { t: 'CX', c: 2, q: 0 }, { t: 'RZ', q: 0, theta: -Math.PI / 4 }, { t: 'CX', c: 2, q: 0 },
        { t: 'S', q: 2 }, { t: 'SDG', q: 2 },
        { t: 'H', q: 2 }
      ]
    }
  },
  {
    id: 'bv',
    name: 'Bernstein–Vazirani oracle',
    note: 'Secret 101 on 3 data qubits plus one ancilla. Compiler must preserve the oracle unitary.',
    circuit: {
      n: 4,
      ops: [
        { t: 'H', q: 0 }, { t: 'H', q: 1 }, { t: 'H', q: 2 }, { t: 'X', q: 3 }, { t: 'H', q: 3 },
        { t: 'CX', c: 0, q: 3 }, { t: 'CX', c: 2, q: 3 },
        { t: 'H', q: 0 }, { t: 'H', q: 0 }, { t: 'H', q: 0 },
        { t: 'H', q: 1 }, { t: 'H', q: 2 }
      ]
    }
  }
];
