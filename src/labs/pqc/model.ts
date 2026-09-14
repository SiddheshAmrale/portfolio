export type Mode = 'classical' | 'hybrid' | 'pqc-only';

export interface Algo {
  name: string;
  family: 'kem' | 'sig' | 'sym';
  publicBytes: number;
  secretOrSigBytes: number;
  handshakeCpuMs: number;
}

export const ALGOS: Record<string, Algo> = {
  x25519: { name: 'X25519', family: 'kem', publicBytes: 32, secretOrSigBytes: 32, handshakeCpuMs: 0.08 },
  p256: { name: 'ECDSA P-256', family: 'sig', publicBytes: 64, secretOrSigBytes: 64, handshakeCpuMs: 0.12 },
  rsa2048: { name: 'RSA-2048', family: 'sig', publicBytes: 256, secretOrSigBytes: 256, handshakeCpuMs: 0.85 },
  mlkem768: { name: 'ML-KEM-768', family: 'kem', publicBytes: 1184, secretOrSigBytes: 1088, handshakeCpuMs: 0.06 },
  mlkem1024: { name: 'ML-KEM-1024', family: 'kem', publicBytes: 1568, secretOrSigBytes: 1568, handshakeCpuMs: 0.08 },
  mldsa65: { name: 'ML-DSA-65', family: 'sig', publicBytes: 1952, secretOrSigBytes: 3309, handshakeCpuMs: 0.18 },
  aes256: { name: 'AES-256-GCM', family: 'sym', publicBytes: 0, secretOrSigBytes: 32, handshakeCpuMs: 0 }
};

export type ClientKind = 'modern' | 'legacy' | 'middlebox';

export interface Service {
  id: string;
  name: string;
  role: string;
  kem: string;
  sig: string;
  mode: Mode;
  inspectLimit: number;
}

export function defaultServices(): Service[] {
  return [
    { id: 'edge', name: 'edge-api', role: 'TLS terminator', kem: 'x25519', sig: 'p256', mode: 'classical', inspectLimit: 8000 },
    { id: 'auth', name: 'auth-svc', role: 'JWT / mTLS identity', kem: 'x25519', sig: 'rsa2048', mode: 'classical', inspectLimit: 8000 },
    { id: 'worker', name: 'model-worker', role: 'internal mTLS', kem: 'x25519', sig: 'p256', mode: 'classical', inspectLimit: 8000 },
    { id: 'queue', name: 'job-queue', role: 'broker TLS', kem: 'x25519', sig: 'p256', mode: 'classical', inspectLimit: 8000 },
    { id: 'db', name: 'postgres', role: 'database TLS', kem: 'x25519', sig: 'rsa2048', mode: 'classical', inspectLimit: 8000 },
    { id: 'waf', name: 'edge-waf', role: 'ClientHello inspection', kem: 'x25519', sig: 'p256', mode: 'classical', inspectLimit: 1500 }
  ];
}

export function migrateService(svc: Service, mode: Mode): Service {
  if (mode === 'classical') {
    return Object.assign({}, svc, { mode: mode, kem: svc.id === 'auth' || svc.id === 'db' ? 'x25519' : 'x25519', sig: svc.id === 'auth' || svc.id === 'db' ? 'rsa2048' : 'p256' });
  }
  if (mode === 'hybrid') {
    return Object.assign({}, svc, { mode: mode, kem: 'mlkem768', sig: 'mldsa65' });
  }
  return Object.assign({}, svc, { mode: mode, kem: 'mlkem1024', sig: 'mldsa65' });
}

export interface Handshake {
  serviceId: string;
  client: ClientKind;
  ok: boolean;
  reason: string;
  clientHelloBytes: number;
  cpuMs: number;
}

function kemBytes(mode: Mode, kem: string): number {
  if (mode === 'classical') return ALGOS.x25519.publicBytes + 220;
  if (mode === 'hybrid') return ALGOS.x25519.publicBytes + ALGOS[kem].publicBytes + 380;
  return ALGOS[kem].publicBytes + 240;
}

function cpuMs(mode: Mode, kem: string, sig: string): number {
  const k = ALGOS[kem];
  const s = ALGOS[sig];
  if (mode === 'classical') return ALGOS.x25519.handshakeCpuMs + ALGOS[sig].handshakeCpuMs;
  if (mode === 'hybrid') return ALGOS.x25519.handshakeCpuMs + k.handshakeCpuMs + s.handshakeCpuMs;
  return k.handshakeCpuMs + s.handshakeCpuMs;
}

export interface HelloPart {
  label: string;
  bytes: number;
}

export function helloParts(mode: Mode, kem: string): HelloPart[] {
  if (mode === 'classical') {
    return [
      { label: 'TLS record / header', bytes: 80 },
      { label: 'legacy ClientHello body', bytes: 140 },
      { label: 'X25519 key_share', bytes: ALGOS.x25519.publicBytes }
    ];
  }
  if (mode === 'hybrid') {
    return [
      { label: 'TLS record / header', bytes: 80 },
      { label: 'legacy ClientHello body', bytes: 140 },
      { label: 'X25519 key_share', bytes: ALGOS.x25519.publicBytes },
      { label: ALGOS[kem].name + ' encapsulation key', bytes: ALGOS[kem].publicBytes },
      { label: 'hybrid extension overhead', bytes: 160 }
    ];
  }
  return [
    { label: 'TLS record / header', bytes: 80 },
    { label: 'legacy ClientHello body', bytes: 160 },
    { label: ALGOS[kem].name + ' encapsulation key', bytes: ALGOS[kem].publicBytes }
  ];
}

export function compatibilityGrid(services: Service[]): { service: Service; modern: Handshake; legacy: Handshake; middlebox: Handshake }[] {
  return services.map(function (s) {
    return {
      service: s,
      modern: handshake(s, 'modern'),
      legacy: handshake(s, 'legacy'),
      middlebox: handshake(s, 'middlebox')
    };
  });
}

export function handshake(svc: Service, client: ClientKind): Handshake {
  const hello = kemBytes(svc.mode, svc.kem);
  const cpu = cpuMs(svc.mode, svc.kem, svc.sig);
  if (client === 'legacy' && svc.mode === 'pqc-only') {
    return { serviceId: svc.id, client: client, ok: false, reason: 'Legacy client has no ML-KEM / ML-DSA code point', clientHelloBytes: hello, cpuMs: 0 };
  }
  if (client === 'middlebox' && hello > svc.inspectLimit) {
    return { serviceId: svc.id, client: client, ok: false, reason: 'ClientHello ' + hello + 'B exceeds inspection buffer ' + svc.inspectLimit + 'B', clientHelloBytes: hello, cpuMs: 0 };
  }
  if (client === 'legacy' && svc.mode === 'hybrid') {
    return { serviceId: svc.id, client: client, ok: true, reason: 'Hybrid: negotiated X25519 + classical signature with PQC offered', clientHelloBytes: hello, cpuMs: cpu * 0.7 };
  }
  return { serviceId: svc.id, client: client, ok: true, reason: 'Negotiated ' + svc.mode + ' using ' + ALGOS[svc.kem].name + ' + ' + ALGOS[svc.sig].name, clientHelloBytes: hello, cpuMs: cpu };
}

export interface TrafficSummary {
  total: number;
  ok: number;
  fail: number;
  avgHello: number;
  avgCpu: number;
  byReason: { reason: string; n: number }[];
  rows: Handshake[];
}

export function runTraffic(services: Service[], mix: Record<ClientKind, number>, n: number, seed: number): TrafficSummary {
  let s = seed >>> 0;
  function rand() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const kinds: ClientKind[] = [];
  (Object.keys(mix) as ClientKind[]).forEach(function (k) {
    const count = Math.round(mix[k] * n);
    for (let i = 0; i < count; i++) kinds.push(k);
  });
  while (kinds.length < n) kinds.push('modern');
  const rows: Handshake[] = [];
  for (let i = 0; i < n; i++) {
    const client = kinds[i % kinds.length];
    const svc = services[Math.floor(rand() * services.length)];
    rows.push(handshake(svc, client));
  }
  const reasons: Record<string, number> = {};
  let hello = 0;
  let cpu = 0;
  let ok = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    hello += r.clientHelloBytes;
    cpu += r.cpuMs;
    if (r.ok) ok += 1;
    const key = r.ok ? 'ok: ' + r.reason : r.reason;
    reasons[key] = (reasons[key] || 0) + 1;
  }
  const byReason = Object.keys(reasons).map(function (k) { return { reason: k, n: reasons[k] }; }).sort(function (a, b) { return b.n - a.n; });
  return { total: rows.length, ok: ok, fail: rows.length - ok, avgHello: hello / rows.length, avgCpu: cpu / rows.length, byReason: byReason, rows: rows };
}

export interface RotationState {
  dualPublish: boolean;
  oldValid: boolean;
  newValid: boolean;
  rolledBack: boolean;
}

export function rotateStep(prev: RotationState, action: 'dual' | 'cutover' | 'rollback'): RotationState {
  if (action === 'dual') return { dualPublish: true, oldValid: true, newValid: true, rolledBack: false };
  if (action === 'cutover') {
    if (!prev.dualPublish && !prev.newValid) {
      return { dualPublish: false, oldValid: false, newValid: true, rolledBack: false };
    }
    return { dualPublish: false, oldValid: false, newValid: true, rolledBack: false };
  }
  return { dualPublish: false, oldValid: true, newValid: false, rolledBack: true };
}

export function rotationSafe(state: RotationState, client: 'old' | 'new'): boolean {
  if (client === 'old') return state.oldValid;
  return state.newValid;
}

export interface PqcTest {
  name: string;
  pass: boolean;
  detail: string;
}

export function runPqcTests(): PqcTest[] {
  const tests: PqcTest[] = [];
  const classical = defaultServices();
  const hybrid = classical.map(function (s) { return migrateService(s, 'hybrid'); });
  const pqc = classical.map(function (s) { return migrateService(s, 'pqc-only'); });

  const hLegacy = handshake(pqc[0], 'legacy');
  tests.push({
    name: 'PQC-only rejects legacy clients',
    pass: hLegacy.ok === false,
    detail: hLegacy.reason
  });

  const hyLegacy = handshake(hybrid[0], 'legacy');
  tests.push({
    name: 'Hybrid still serves a legacy client',
    pass: hyLegacy.ok === true,
    detail: hyLegacy.reason
  });

  const wafHybrid = handshake(hybrid.find(function (s) { return s.id === 'waf'; }) as Service, 'middlebox');
  tests.push({
    name: 'Hybrid ClientHello exceeds the 1500B WAF inspection buffer',
    pass: wafHybrid.ok === false && wafHybrid.clientHelloBytes > 1500,
    detail: 'hello=' + wafHybrid.clientHelloBytes + 'B limit=1500B'
  });

  const dual = rotateStep({ dualPublish: false, oldValid: true, newValid: false, rolledBack: false }, 'dual');
  tests.push({
    name: 'Dual-publish rotation keeps old and new trust valid',
    pass: rotationSafe(dual, 'old') && rotationSafe(dual, 'new'),
    detail: JSON.stringify(dual)
  });

  const rolled = rotateStep(dual, 'rollback');
  tests.push({
    name: 'Rollback restores classical trust and drops the new key',
    pass: rotationSafe(rolled, 'old') && !rotationSafe(rolled, 'new') && rolled.rolledBack,
    detail: JSON.stringify(rolled)
  });

  tests.push({
    name: 'ML-KEM-768 public key size matches FIPS 203',
    pass: ALGOS.mlkem768.publicBytes === 1184 && ALGOS.mlkem768.secretOrSigBytes === 1088,
    detail: 'pk=' + ALGOS.mlkem768.publicBytes + ' ct=' + ALGOS.mlkem768.secretOrSigBytes
  });

  tests.push({
    name: 'ML-DSA-65 signature size matches FIPS 204',
    pass: ALGOS.mldsa65.secretOrSigBytes === 3309 && ALGOS.mldsa65.publicBytes === 1952,
    detail: 'pk=' + ALGOS.mldsa65.publicBytes + ' sig=' + ALGOS.mldsa65.secretOrSigBytes
  });

  const hy = hybrid.find(function (s) { return s.id === 'waf'; }) as Service;
  const partsSum = helloParts(hy.mode, hy.kem).reduce(function (a, p) { return a + p.bytes; }, 0);
  tests.push({
    name: 'ClientHello byte breakdown matches handshake size',
    pass: partsSum === handshake(hy, 'modern').clientHelloBytes,
    detail: 'parts=' + partsSum + ' handshake=' + handshake(hy, 'modern').clientHelloBytes
  });

  return tests;
}
