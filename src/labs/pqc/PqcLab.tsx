import React, { useMemo, useState } from 'react';
import Workbench from '../../apps/Workbench';
import { Btn, Kpi, Panel, TestList } from '../../apps/ui';
import { downloadJson, fmtNum } from '../shared/stats';
import {
  ALGOS,
  ClientKind,
  compatibilityGrid,
  defaultServices,
  handshake,
  helloParts,
  migrateService,
  Mode,
  PqcTest,
  rotateStep,
  rotationSafe,
  RotationState,
  runPqcTests,
  runTraffic,
  Service,
  TrafficSummary
} from './model';

const ACCENT = '#34d399';
const VIEWS = [
  { id: 'inventory', label: 'Inventory' },
  { id: 'hello', label: 'ClientHello' },
  { id: 'matrix', label: 'Compatibility' },
  { id: 'traffic', label: 'Traffic' },
  { id: 'rotation', label: 'Rotation' },
  { id: 'tests', label: 'Tests' }
];

const PqcLab: React.FC = function () {
  const [view, setView] = useState('inventory');
  const [services, setServices] = useState<Service[]>(defaultServices);
  const [selected, setSelected] = useState('waf');
  const [mixModern, setMixModern] = useState(0.55);
  const [mixLegacy, setMixLegacy] = useState(0.25);
  const [traffic, setTraffic] = useState<TrafficSummary | null>(null);
  const [rotation, setRotation] = useState<RotationState>({ dualPublish: false, oldValid: true, newValid: false, rolledBack: false });
  const [tests, setTests] = useState<PqcTest[] | null>(null);

  const mixMiddle = Math.max(0, 1 - mixModern - mixLegacy);
  const current = services.find(function (s) { return s.id === selected; }) || services[0];
  const parts = helloParts(current.mode, current.kem);
  const helloTotal = parts.reduce(function (a, p) { return a + p.bytes; }, 0);
  const maxPart = parts.reduce(function (m, p) { return Math.max(m, p.bytes); }, 1);
  const grid = useMemo(function () { return compatibilityGrid(services); }, [services]);
  const probeModern = handshake(current, 'modern');
  const probeLegacy = handshake(current, 'legacy');
  const probeBox = handshake(current, 'middlebox');

  function setMode(id: string, mode: Mode) {
    setServices(function (prev) {
      return prev.map(function (s) {
        return s.id === id ? migrateService(s, mode) : s;
      });
    });
  }

  function migrateAll(mode: Mode) {
    setServices(function (prev) { return prev.map(function (s) { return migrateService(s, mode); }); });
  }

  function generate() {
    const mix: Record<ClientKind, number> = { modern: mixModern, legacy: mixLegacy, middlebox: mixMiddle };
    setTraffic(runTraffic(services, mix, 120, 21));
    setView('traffic');
  }

  return (
    <Workbench
      product="PQC Migration Console"
      domain="Cryptographic migration · TLS"
      accent={ACCENT}
      views={VIEWS}
      view={view}
      onView={setView}
      statusLeft={current.name + ' · ' + current.mode + ' · hello ' + helloTotal + ' B'}
      statusRight={'inspect limit ' + current.inspectLimit + ' B · FIPS 203/204 sizes'}
    >
      <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
        {view === 'inventory' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Service inventory">
              <div className="space-y-2 mb-4">
                {services.map(function (s) {
                  return (
                    <button
                      key={s.id}
                      onClick={function () { setSelected(s.id); }}
                      className={'w-full text-left px-3 py-2 rounded border text-sm ' + (selected === s.id ? 'border-emerald-400 bg-emerald-400/10 text-white' : 'border-white/10 text-white/70')}
                    >
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-[11px] opacity-70">{s.role} · {s.mode} · {ALGOS[s.kem].name}</div>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn kind="ghost" onClick={function () { migrateAll('classical'); }}>All classical</Btn>
                <Btn kind="ghost" onClick={function () { migrateAll('hybrid'); }}>All hybrid</Btn>
                <Btn kind="ghost" onClick={function () { migrateAll('pqc-only'); }}>All PQC-only</Btn>
              </div>
            </Panel>
            <div className="lg:col-span-2 space-y-4">
              <Panel
                title={current.name}
                action={
                  <select
                    className="bg-black border border-white/15 text-white rounded px-2 py-1 text-xs"
                    value={current.mode}
                    onChange={function (e) { setMode(current.id, e.target.value as Mode); }}
                  >
                    <option value="classical">classical</option>
                    <option value="hybrid">hybrid (X25519 + ML-KEM-768 + ML-DSA-65)</option>
                    <option value="pqc-only">pqc-only (ML-KEM-1024 + ML-DSA-65)</option>
                  </select>
                }
              >
                <p className="text-sm text-white/60 mb-4">{current.role}. Inspection buffer {current.inspectLimit} bytes.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[probeModern, probeLegacy, probeBox].map(function (p) {
                    return (
                      <div key={p.client} className={'rounded p-3 border ' + (p.ok ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/40 bg-rose-500/10')}>
                        <div className="text-[10px] uppercase text-white/40">{p.client}</div>
                        <div className={p.ok ? 'text-emerald-300 text-sm' : 'text-rose-300 text-sm'}>{p.ok ? 'Handshake OK' : 'Handshake FAIL'}</div>
                        <div className="text-xs text-white/55 mt-1">{p.reason}</div>
                        <div className="text-xs text-white mt-2 font-mono">{p.clientHelloBytes} B · {p.cpuMs.toFixed(2)} ms</div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
              <Panel title="Trust topology">
                <svg viewBox="0 0 640 220" className="w-full h-52">
                  {['modern', 'legacy', 'middlebox'].map(function (c, i) {
                    return (
                      <g key={c}>
                        <rect x={12} y={18 + i * 64} width={110} height={44} rx="6" fill="#111827" stroke="#334155" />
                        <text x={67} y={44 + i * 64} textAnchor="middle" fill="#cbd5e1" fontSize="11">{c}</text>
                      </g>
                    );
                  })}
                  {services.map(function (s, i) {
                    const x = 180 + (i % 3) * 150;
                    const y = 24 + Math.floor(i / 3) * 96;
                    const ok = handshake(s, 'middlebox').ok;
                    return (
                      <g key={s.id} onClick={function () { setSelected(s.id); }} style={{ cursor: 'pointer' }}>
                        <rect x={x} y={y} width={130} height={52} rx="6" fill={s.id === selected ? '#064e3b' : '#111827'} stroke={ok ? '#34d399' : '#f43f5e'} />
                        <text x={x + 65} y={y + 22} textAnchor="middle" fill="#f8fafc" fontSize="11">{s.name}</text>
                        <text x={x + 65} y={y + 40} textAnchor="middle" fill="#94a3b8" fontSize="10">{s.mode}</text>
                      </g>
                    );
                  })}
                </svg>
                <p className="text-xs text-white/40">Green border: middlebox handshake succeeds. Rose: ClientHello exceeds that service’s inspector.</p>
              </Panel>
            </div>
          </div>
        ) : null}

        {view === 'hello' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="ClientHello" value={helloTotal + ' B'} tone={helloTotal > current.inspectLimit ? 'bad' : 'ok'} />
              <Kpi label="Inspect limit" value={current.inspectLimit + ' B'} />
              <Kpi label="KEM" value={ALGOS[current.kem].name} hint={ALGOS[current.kem].publicBytes + ' B public'} />
              <Kpi label="Signature" value={ALGOS[current.sig].name} hint={ALGOS[current.sig].secretOrSigBytes + ' B sig/secret'} />
            </div>
            <Panel title="Byte breakdown (modeled, not a packet capture)">
              {parts.map(function (p) {
                return (
                  <div key={p.label} className="flex items-center gap-3 mb-2 text-sm">
                    <div className="w-56 text-white/60 text-xs">{p.label}</div>
                    <div className="flex-1 h-4 bg-white/10 rounded overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{ width: ((p.bytes / maxPart) * 100) + '%' }} />
                    </div>
                    <div className="w-16 text-right font-mono text-xs">{p.bytes} B</div>
                  </div>
                );
              })}
              <p className="text-xs text-white/40 mt-3">
                Hybrid carries X25519 (32 B) plus ML-KEM-768 (1184 B). That inflation is a documented middlebox failure class, modeled on edge-waf’s 1500 B inspector — not a vendor accusation. Handshake CPU is order-of-magnitude, not a cycle-accurate benchmark.
              </p>
            </Panel>
          </div>
        ) : null}

        {view === 'matrix' ? (
          <Panel title="Client × service compatibility" action={<Btn kind="ghost" onClick={function () { downloadJson('pqc-compat.json', grid); }}>Export</Btn>}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-white/40">
                  <tr>
                    <th className="py-2 pr-3">Service</th>
                    <th className="py-2 pr-3">Mode</th>
                    <th className="py-2 pr-3">Modern</th>
                    <th className="py-2 pr-3">Legacy</th>
                    <th className="py-2 pr-3">Middlebox</th>
                    <th className="py-2 pr-3">Hello</th>
                  </tr>
                </thead>
                <tbody>
                  {grid.map(function (row) {
                    function cell(h: { ok: boolean; reason: string }) {
                      return (
                        <td className={'py-2 pr-3 ' + (h.ok ? 'text-emerald-300' : 'text-rose-300')} title={h.reason}>
                          {h.ok ? 'OK' : 'FAIL'}
                        </td>
                      );
                    }
                    return (
                      <tr key={row.service.id} className="border-t border-white/5">
                        <td className="py-2 pr-3 text-white">{row.service.name}</td>
                        <td className="py-2 pr-3 text-white/60">{row.service.mode}</td>
                        {cell(row.modern)}
                        {cell(row.legacy)}
                        {cell(row.middlebox)}
                        <td className="py-2 pr-3 font-mono text-white/70">{row.modern.clientHelloBytes} B</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : null}

        {view === 'traffic' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Client mix">
              <label className="block text-[11px] text-white/50 mb-2">
                Modern {Math.round(mixModern * 100)}%
                <input className="w-full accent-emerald-400" type="range" min={0} max={1} step={0.05} value={mixModern} onChange={function (e) { setMixModern(Number(e.target.value)); }} />
              </label>
              <label className="block text-[11px] text-white/50 mb-4">
                Legacy {Math.round(mixLegacy * 100)}% · middlebox {Math.round(mixMiddle * 100)}%
                <input className="w-full accent-emerald-400" type="range" min={0} max={1} step={0.05} value={mixLegacy} onChange={function (e) { setMixLegacy(Number(e.target.value)); }} />
              </label>
              <Btn accent={ACCENT} onClick={generate}>Generate 120 handshakes</Btn>
            </Panel>
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Success" value={traffic ? traffic.ok + '/' + traffic.total : '—'} tone="ok" />
                <Kpi label="Fail" value={traffic ? String(traffic.fail) : '—'} tone={traffic && traffic.fail ? 'bad' : 'muted'} />
                <Kpi label="Avg ClientHello" value={traffic ? Math.round(traffic.avgHello) + ' B' : '—'} />
                <Kpi label="Avg CPU" value={traffic ? fmtNum(traffic.avgCpu, 2) + ' ms' : '—'} />
              </div>
              <Panel title="Failure / success reasons">
                {traffic ? (
                  <ul className="text-xs text-white/65 space-y-1 max-h-64 overflow-auto font-mono">
                    {traffic.byReason.map(function (r) {
                      return <li key={r.reason}>{r.n} × {r.reason}</li>;
                    })}
                  </ul>
                ) : <p className="text-sm text-white/40">Generate traffic against the current inventory.</p>}
              </Panel>
            </div>
          </div>
        ) : null}

        {view === 'rotation' ? (
          <div className="space-y-4">
            <Panel title="Certificate / key rotation">
              <p className="text-sm text-white/65 mb-4">Dual-publish both trust anchors, cut over, or roll back. Old clients need the old key until they drain. Cutover without dual-publish drops old clients immediately.</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Btn accent={ACCENT} onClick={function () { setRotation(function (p) { return rotateStep(p, 'dual'); }); }}>Dual-publish</Btn>
                <Btn kind="ghost" onClick={function () { setRotation(function (p) { return rotateStep(p, 'cutover'); }); }}>Cut over</Btn>
                <Btn kind="ghost" onClick={function () { setRotation(function (p) { return rotateStep(p, 'rollback'); }); }}>Rollback</Btn>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Old clients" value={rotationSafe(rotation, 'old') ? 'accepted' : 'rejected'} tone={rotationSafe(rotation, 'old') ? 'ok' : 'bad'} />
                <Kpi label="New clients" value={rotationSafe(rotation, 'new') ? 'accepted' : 'rejected'} tone={rotationSafe(rotation, 'new') ? 'ok' : 'bad'} />
                <Kpi label="Dual-publish" value={String(rotation.dualPublish)} />
                <Kpi label="Rolled back" value={String(rotation.rolledBack)} />
              </div>
            </Panel>
          </div>
        ) : null}

        {view === 'tests' ? (
          <Panel title="Migration invariants" action={<Btn accent={ACCENT} onClick={function () { setTests(runPqcTests()); }}>Run suite</Btn>}>
            <TestList tests={tests} empty="NIST sizes, hybrid legacy compatibility, WAF oversized-hello failure, dual-publish and rollback." />
          </Panel>
        ) : null}
      </div>
    </Workbench>
  );
};

export default PqcLab;
