export type GateName =
  | 'H' | 'X' | 'Y' | 'Z' | 'S' | 'SDG' | 'T' | 'TDG'
  | 'RX' | 'RY' | 'RZ'
  | 'CX' | 'SWAP';

export interface Op {
  t: GateName;
  q: number;
  c?: number;
  a?: number;
  b?: number;
  theta?: number;
}

export interface Circuit {
  n: number;
  ops: Op[];
}

export interface Complex {
  re: number;
  im: number;
}

const SQRT1_2 = 1 / Math.sqrt(2);

export function c(re: number, im = 0): Complex {
  return { re: re, im: im };
}

export function cadd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function csub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function cmul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

export function cscale(a: Complex, s: number): Complex {
  return { re: a.re * s, im: a.im * s };
}

export function cabs2(a: Complex): number {
  return a.re * a.re + a.im * a.im;
}

export function zeros(n: number): Complex[] {
  const dim = 1 << n;
  const st: Complex[] = [];
  for (let i = 0; i < dim; i++) st.push(c(0, 0));
  st[0] = c(1, 0);
  return st;
}

export function basis(n: number, index: number): Complex[] {
  const dim = 1 << n;
  const st: Complex[] = [];
  for (let i = 0; i < dim; i++) st.push(c(0, 0));
  st[index] = c(1, 0);
  return st;
}

function apply1(state: Complex[], n: number, q: number, m00: Complex, m01: Complex, m10: Complex, m11: Complex) {
  const dim = 1 << n;
  const bit = 1 << q;
  const next = state.slice();
  for (let i = 0; i < dim; i++) {
    if ((i & bit) !== 0) continue;
    const j = i | bit;
    const a = state[i];
    const b = state[j];
    next[i] = cadd(cmul(m00, a), cmul(m01, b));
    next[j] = cadd(cmul(m10, a), cmul(m11, b));
  }
  for (let i = 0; i < dim; i++) state[i] = next[i];
}

function applyX(state: Complex[], n: number, q: number) {
  apply1(state, n, q, c(0), c(1), c(1), c(0));
}

function applyZ(state: Complex[], n: number, q: number) {
  apply1(state, n, q, c(1), c(0), c(0), c(-1));
}

function applyY(state: Complex[], n: number, q: number) {
  apply1(state, n, q, c(0), c(0, -1), c(0, 1), c(0));
}

function applyH(state: Complex[], n: number, q: number) {
  apply1(state, n, q, c(SQRT1_2), c(SQRT1_2), c(SQRT1_2), c(-SQRT1_2));
}

function applyS(state: Complex[], n: number, q: number, dag: boolean) {
  apply1(state, n, q, c(1), c(0), c(0), dag ? c(0, -1) : c(0, 1));
}

function applyT(state: Complex[], n: number, q: number, dag: boolean) {
  const ang = (Math.PI / 4) * (dag ? -1 : 1);
  apply1(state, n, q, c(1), c(0), c(0), c(Math.cos(ang), Math.sin(ang)));
}

function applyRZ(state: Complex[], n: number, q: number, theta: number) {
  const a = theta / 2;
  apply1(state, n, q, c(Math.cos(-a), Math.sin(-a)), c(0), c(0), c(Math.cos(a), Math.sin(a)));
}

function applyRX(state: Complex[], n: number, q: number, theta: number) {
  const a = theta / 2;
  const c0 = c(Math.cos(a), 0);
  const s = c(0, -Math.sin(a));
  apply1(state, n, q, c0, s, s, c0);
}

function applyRY(state: Complex[], n: number, q: number, theta: number) {
  const a = theta / 2;
  apply1(state, n, q, c(Math.cos(a)), c(-Math.sin(a)), c(Math.sin(a)), c(Math.cos(a)));
}

function applyCX(state: Complex[], n: number, cbit: number, tbit: number) {
  const dim = 1 << n;
  const C = 1 << cbit;
  const T = 1 << tbit;
  const next = state.slice();
  for (let i = 0; i < dim; i++) {
    if ((i & C) !== 0 && (i & T) === 0) {
      const j = i | T;
      next[i] = state[j];
      next[j] = state[i];
    }
  }
  for (let i = 0; i < dim; i++) state[i] = next[i];
}

function applySWAP(state: Complex[], n: number, a: number, b: number) {
  applyCX(state, n, a, b);
  applyCX(state, n, b, a);
  applyCX(state, n, a, b);
}

export function applyOp(state: Complex[], n: number, op: Op) {
  switch (op.t) {
    case 'H': applyH(state, n, op.q); break;
    case 'X': applyX(state, n, op.q); break;
    case 'Y': applyY(state, n, op.q); break;
    case 'Z': applyZ(state, n, op.q); break;
    case 'S': applyS(state, n, op.q, false); break;
    case 'SDG': applyS(state, n, op.q, true); break;
    case 'T': applyT(state, n, op.q, false); break;
    case 'TDG': applyT(state, n, op.q, true); break;
    case 'RX': applyRX(state, n, op.q, op.theta || 0); break;
    case 'RY': applyRY(state, n, op.q, op.theta || 0); break;
    case 'RZ': applyRZ(state, n, op.q, op.theta || 0); break;
    case 'CX': applyCX(state, n, op.c as number, op.q); break;
    case 'SWAP': applySWAP(state, n, op.a as number, op.b as number); break;
    default: break;
  }
}

export function runCircuit(circ: Circuit, start?: Complex[]): Complex[] {
  const st = start ? start.map(function (x) { return { re: x.re, im: x.im }; }) : zeros(circ.n);
  for (let i = 0; i < circ.ops.length; i++) applyOp(st, circ.n, circ.ops[i]);
  return st;
}

export function innerAbs2(a: Complex[], b: Complex[]): number {
  let re = 0;
  let im = 0;
  for (let i = 0; i < a.length; i++) {
    re += a[i].re * b[i].re + a[i].im * b[i].im;
    im += a[i].re * b[i].im - a[i].im * b[i].re;
  }
  return re * re + im * im;
}

export function minBasisFidelity(a: Circuit, b: Circuit): number {
  const dim = 1 << a.n;
  let minF = 1;
  for (let i = 0; i < dim; i++) {
    const psi = runCircuit(a, basis(a.n, i));
    const phi = runCircuit(b, basis(b.n, i));
    const f = innerAbs2(psi, phi);
    if (f < minF) minF = f;
  }
  return minF;
}

export function gateCount(ops: Op[]): { total: number; twoQ: number; depth: number } {
  const busy: number[] = [];
  let depth = 0;
  let twoQ = 0;
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    const qs = qubitsOf(op);
    if (qs.length > 1) twoQ += op.t === 'SWAP' ? 3 : 1;
    let start = 0;
    for (let k = 0; k < qs.length; k++) start = Math.max(start, busy[qs[k]] || 0);
    const end = start + 1;
    for (let k = 0; k < qs.length; k++) busy[qs[k]] = end;
    if (end > depth) depth = end;
  }
  return { total: ops.length, twoQ: twoQ, depth: depth };
}

export function qubitsOf(op: Op): number[] {
  if (op.t === 'CX') return [op.c as number, op.q];
  if (op.t === 'SWAP') return [op.a as number, op.b as number];
  return [op.q];
}

export function formatOp(op: Op): string {
  if (op.t === 'CX') return 'CX q' + op.c + '→q' + op.q;
  if (op.t === 'SWAP') return 'SWAP q' + op.a + ',q' + op.b;
  if (op.theta !== undefined && (op.t === 'RX' || op.t === 'RY' || op.t === 'RZ')) {
    return op.t + '(π·' + (op.theta / Math.PI).toFixed(2) + ') q' + op.q;
  }
  return op.t + ' q' + op.q;
}

export function toQasm(circ: Circuit): string {
  const lines = [
    'OPENQASM 2.0;',
    'include "qelib1.inc";',
    'qreg q[' + circ.n + '];'
  ];
  for (let i = 0; i < circ.ops.length; i++) {
    const op = circ.ops[i];
    if (op.t === 'CX') lines.push('cx q[' + op.c + '],q[' + op.q + '];');
    else if (op.t === 'SWAP') lines.push('swap q[' + op.a + '],q[' + op.b + '];');
    else if (op.t === 'RZ') lines.push('rz(' + (op.theta || 0).toFixed(6) + ') q[' + op.q + '];');
    else if (op.t === 'RX') lines.push('rx(' + (op.theta || 0).toFixed(6) + ') q[' + op.q + '];');
    else if (op.t === 'RY') lines.push('ry(' + (op.theta || 0).toFixed(6) + ') q[' + op.q + '];');
    else if (op.t === 'SDG') lines.push('sdg q[' + op.q + '];');
    else if (op.t === 'TDG') lines.push('tdg q[' + op.q + '];');
    else lines.push(op.t.toLowerCase() + ' q[' + op.q + '];');
  }
  return lines.join('\n');
}

export function probabilities(state: Complex[]): number[] {
  return state.map(function (a) { return cabs2(a); });
}

export function measureShots(state: Complex[], shots: number, rand: () => number): { bitstring: string; count: number; nQubits: number }[] {
  const n = Math.round(Math.log(state.length) / Math.log(2));
  const p = probabilities(state);
  const counts: Record<number, number> = {};
  for (let s = 0; s < shots; s++) {
    let u = rand();
    let idx = p.length - 1;
    for (let i = 0; i < p.length; i++) {
      u -= p[i];
      if (u <= 0) {
        idx = i;
        break;
      }
    }
    counts[idx] = (counts[idx] || 0) + 1;
  }
  return Object.keys(counts).map(function (k) {
    const i = Number(k);
    let bits = i.toString(2);
    while (bits.length < n) bits = '0' + bits;
    return { bitstring: bits, count: counts[i], nQubits: n };
  }).sort(function (a, b) { return b.count - a.count; });
}
