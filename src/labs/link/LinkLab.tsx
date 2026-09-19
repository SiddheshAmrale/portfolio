import React, { useEffect, useRef, useState } from 'react';
import Workbench from '../../apps/Workbench';
import { Btn, Kpi, Panel, Spark } from '../../apps/ui';
import { downloadJson } from '../shared/stats';
import { fmtOpt, usePilotJson } from '../pilot/load';

const ACCENT = '#38bdf8';

type LinkCase = {
  id: string;
  title: string;
  question: string;
  software: string;
  domain: string;
  ground_truth: string;
  disclaimer: string;
  diagnosis: Record<string, unknown>;
  snr: { t: number; v: number }[];
  ber: { t: number; v: number }[];
  eye: { t: number; v: number }[];
  jitter?: { t: number; v: number }[];
  fec_demo?: { pre_fec_ber: number; post_fec_ber: number; notes: string; curve?: { snr_db: number; pre_fec_ber: number; post_fec_ber: number }[] };
  fec_histogram?: { bins_le: number[]; counts: number[]; notes: string };
};

type LinkIndex = { eval?: { n: number; accuracy: number; rows: { id: string; truth: string; predicted: string; ok: boolean }[] } };
type LogLine = { msg: string; kind?: 'ok' | 'bad' | 'info' };

const LinkLab: React.FC = function () {
  const { data, error, loading } = usePilotJson<LinkCase[]>('/link/cases.json');
  const idxMeta = usePilotJson<LinkIndex>('/link/index.json');
  const [idx, setIdx] = useState(0);
  const [view, setView] = useState('investigate');
  const [diagnosed, setDiagnosed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<LogLine[]>([]);
  const timerRef = useRef<number | null>(null);
  const selected = data && data[idx] ? data[idx] : null;

  useEffect(function () {
    return function () {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  useEffect(function () {
    setDiagnosed(false);
    setRevealed(false);
    setRunning(false);
    setLog([]);
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [idx]);

  const runDiagnose = function () {
    if (!selected || running) return;
    setDiagnosed(false);
    setRevealed(false);
    setLog([]);
    setRunning(true);
    const d = selected.diagnosis as {
      label?: string;
      claim?: string;
      notes?: string;
      reason?: string;
      evidence?: Record<string, boolean>;
      mean_snr_db?: number;
      mean_ber?: number;
      mean_eye_ui?: number;
      mean_jitter_ui?: number;
      link_health?: { score?: number; band?: string };
      equalization?: { ctle_db?: number; ffe_tap1?: number; adapting?: boolean };
      valid?: boolean;
    };
    const steps: LogLine[] = [];
    if (selected.id === 'not_netem') {
      steps.push({ msg: 'claim: software packet loss = optical BER?', kind: 'info' });
      steps.push({ msg: 'check layers: netem/TCP ≠ symbol BER', kind: 'info' });
      steps.push({ msg: 'verdict: ' + (d.valid === false ? 'INVALID claim' : '—'), kind: 'bad' });
      steps.push({ msg: String(d.reason || d.notes || ''), kind: 'info' });
    } else {
      steps.push({ msg: 'read lane series: SNR / BER / eye / jitter', kind: 'info' });
      if (d.evidence) {
        Object.keys(d.evidence).forEach(function (k) {
          steps.push({ msg: 'evidence.' + k + ' = ' + String(d.evidence![k]), kind: d.evidence![k] ? 'bad' : 'ok' });
        });
      }
      if (d.mean_snr_db !== undefined) steps.push({ msg: 'mean SNR ' + d.mean_snr_db.toFixed(2) + ' dB', kind: 'info' });
      if (d.mean_ber !== undefined) steps.push({ msg: 'mean BER ' + d.mean_ber.toExponential(2), kind: 'info' });
      if (d.link_health) steps.push({ msg: 'link health score ' + d.link_health.score + ' (' + d.link_health.band + ')', kind: 'info' });
      if (d.equalization) steps.push({ msg: 'EQ CTLE ' + d.equalization.ctle_db + ' · FFE ' + d.equalization.ffe_tap1 + (d.equalization.adapting ? ' · adapting' : ''), kind: 'info' });
      steps.push({ msg: 'label → ' + String(d.label || d.claim || '—'), kind: 'ok' });
      steps.push({ msg: String(d.notes || d.reason || ''), kind: 'info' });
    }
    let i = 0;
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(function () {
      if (i >= steps.length) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        timerRef.current = null;
        setRunning(false);
        setDiagnosed(true);
        return;
      }
      const line = steps[i];
      i += 1;
      setLog(function (prev) { return prev.concat([line]); });
    }, 260);
  };

  if (loading) return <div className="app-workbench flex items-center justify-center text-white/50">Loading link cases…</div>;
  if (error || !data || !selected) return <div className="app-workbench p-8 text-rose-300">Could not load /link/cases.json. {error}</div>;

  const label = String((selected.diagnosis as { label?: string }).label || (selected.diagnosis as { claim?: string }).claim || '—');

  return (
    <Workbench
      product="Link Integrity Lab"
      domain="SerDes · signal integrity · FEC"
      accent={ACCENT}
      views={[
        { id: 'investigate', label: 'Investigate' },
        { id: 'reveal', label: 'Reveal' },
        { id: 'score', label: 'Score' },
        { id: 'reproduce', label: 'Reproduce' }
      ]}
      view={view}
      onView={setView}
      statusLeft={selected.software + ' · ' + selected.domain}
      statusRight={running ? 'diagnosing…' : (diagnosed ? (revealed ? selected.title : 'Lane ' + String.fromCharCode(65 + idx)) + ' · ' + label : 'blind')}
    >
      <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap gap-2">
          {data.map(function (c, i) {
            return (
              <Btn key={c.id} kind={i === idx ? 'primary' : 'ghost'} accent={ACCENT} onClick={function () { setIdx(i); setView('investigate'); }}>
                {revealed && i === idx ? c.title : 'Lane ' + String.fromCharCode(65 + i)}
              </Btn>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Btn accent={ACCENT} disabled={running} onClick={runDiagnose}>
            {running ? 'Diagnosing…' : (diagnosed ? 'Re-diagnose' : 'Diagnose lane')}
          </Btn>
          <Btn kind="ghost" onClick={function () { downloadJson('link-' + selected.id + '.json', selected); }}>Download case JSON</Btn>
          <span className="text-xs text-white/40">Charts load first. Diagnosis stays hidden until you click Diagnose.</span>
        </div>
        <p className="text-xs text-white/45">{selected.disclaimer} Software packet loss is not optical BER.</p>

        {view === 'investigate' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Panel title="Question">
                <p className="text-sm text-white/80">{selected.question}</p>
              </Panel>
              {selected.snr.length ? (
                <>
                  <Panel title="SNR (dB)"><Spark values={selected.snr.map(function (p) { return p.v; })} color={ACCENT} height={64} /></Panel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Panel title="BER"><Spark values={selected.ber.map(function (p) { return p.v; })} color="#fb7185" height={56} /></Panel>
                    <Panel title="Eye opening (UI)"><Spark values={selected.eye.map(function (p) { return p.v; })} color="#fbbf24" height={56} /></Panel>
                  </div>
                  {selected.jitter && selected.jitter.length ? (
                    <Panel title="Jitter proxy (UI)"><Spark values={selected.jitter.map(function (p) { return p.v; })} color="#a78bfa" height={48} /></Panel>
                  ) : null}
                </>
              ) : (
                <Panel title="Meta case"><p className="text-sm text-white/55">No time series — this case is a category-error check. Click Diagnose.</p></Panel>
              )}
              <Panel title="Diagnosis log">
                {!log.length && !running ? (
                  <p className="text-sm text-white/45">Click Diagnose to walk evidence rules before the label appears.</p>
                ) : (
                  <ul className="font-mono text-xs space-y-1 max-h-56 overflow-auto">
                    {log.map(function (line, i) {
                      const color = line.kind === 'bad' ? 'text-rose-300' : (line.kind === 'ok' ? 'text-emerald-300' : 'text-white/65');
                      return <li key={i} className={color}>{line.msg}</li>;
                    })}
                    {running ? <li className="text-white/35 animate-pulse">…</li> : null}
                  </ul>
                )}
              </Panel>
              {diagnosed ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Kpi label="Domain" value={selected.domain} />
                  <Kpi label="Diagnosis" value={label} />
                  <Kpi label="Health" value={String(((selected.diagnosis as { link_health?: { score?: number; band?: string } }).link_health || {}).score ?? '—')} hint={String(((selected.diagnosis as { link_health?: { band?: string } }).link_health || {}).band || '')} />
                  <Kpi label="Mean SNR" value={fmtOpt((selected.diagnosis as { mean_snr_db?: number }).mean_snr_db, 1)} />
                  <Kpi label="Mean BER" value={fmtOpt((selected.diagnosis as { mean_ber?: number }).mean_ber, 2)} />
                </div>
              ) : null}
              {diagnosed && selected.fec_demo ? (
                <Panel title="FEC coding gain demo">
                  <p className="text-sm text-white/70">pre {selected.fec_demo.pre_fec_ber} → post {selected.fec_demo.post_fec_ber}</p>
                  <p className="text-xs text-white/45 mt-2">{selected.fec_demo.notes}</p>
                </Panel>
              ) : null}
              {diagnosed && selected.fec_histogram ? (
                <Panel title="FEC uncorrectable histogram">
                  <ul className="text-xs font-mono space-y-1">
                    {selected.fec_histogram.bins_le.map(function (edge, i) {
                      return <li key={edge} className="text-white/65">≤ {edge}: {selected.fec_histogram!.counts[i]}</li>;
                    })}
                  </ul>
                </Panel>
              ) : null}
              {diagnosed && (selected.diagnosis as { equalization?: { ctle_db?: number; ffe_tap1?: number; adapting?: boolean; notes?: string } }).equalization ? (
                <Panel title="Equalization state (CTLE / FFE)">
                  <p className="text-sm font-mono text-white/70">
                    CTLE {String((selected.diagnosis as { equalization: { ctle_db: number } }).equalization.ctle_db)} dB ·
                    FFE tap1 {String((selected.diagnosis as { equalization: { ffe_tap1: number } }).equalization.ffe_tap1)} ·
                    {(selected.diagnosis as { equalization: { adapting: boolean } }).equalization.adapting ? ' adapting' : ' steady'}
                  </p>
                </Panel>
              ) : null}
            </div>
            <Panel title="How to present">
              <ol className="list-decimal pl-4 text-sm text-white/65 space-y-2">
                <li>Show the SNR/BER/eye charts first (blind).</li>
                <li>Click Diagnose and narrate each evidence line.</li>
                <li>Only then open Reveal for ground truth.</li>
              </ol>
            </Panel>
          </div>
        ) : null}

        {view === 'reveal' ? (
          <Panel title="Ground truth" action={<Btn accent={ACCENT} disabled={!diagnosed} onClick={function () { setRevealed(true); }}>{revealed ? 'Shown' : 'Reveal injector'}</Btn>}>
            {!diagnosed ? (
              <p className="text-sm text-white/50">Diagnose first — do not peek early.</p>
            ) : revealed ? (
              <p className="text-sm text-white/75">Impairment: <span className="text-white font-semibold">{selected.ground_truth}</span> · predicted {label}</p>
            ) : (
              <p className="text-sm text-white/50">Inspect charts + diagnosis log before revealing the injector.</p>
            )}
          </Panel>
        ) : null}

        {view === 'score' ? (
          <Panel title="Teaching-set score">
            {idxMeta.data && idxMeta.data.eval ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Kpi label="n" value={String(idxMeta.data.eval.n)} />
                  <Kpi label="Accuracy" value={(idxMeta.data.eval.accuracy * 100).toFixed(0) + '%'} />
                </div>
                <ul className="text-sm font-mono space-y-1">
                  {idxMeta.data.eval.rows.map(function (r) {
                    return <li key={r.id} className={r.ok ? 'text-emerald-300/90' : 'text-rose-300'}>{r.id}: {r.truth} → {r.predicted}</li>;
                  })}
                </ul>
              </>
            ) : <p className="text-sm text-white/45">No eval yet.</p>}
          </Panel>
        ) : null}

        {view === 'reproduce' ? (
          <Panel title="Reproduce (real backend)">
            <pre className="text-xs text-emerald-200/90 bg-black/40 p-3 rounded overflow-x-auto">{
`pip install -e "./link[dev]"
python -m pytest -q link/tests
python -m link build-cases --out public/link
`}</pre>
            <p className="text-xs text-white/45 mt-3">Static site viewer. Computation lives in the Python package.</p>
          </Panel>
        ) : null}
      </div>
    </Workbench>
  );
};

export default LinkLab;
