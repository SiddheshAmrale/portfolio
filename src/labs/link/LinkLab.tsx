import React, { useState } from 'react';
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
  fec_demo?: { pre_fec_ber: number; post_fec_ber: number; notes: string; curve?: { snr_db: number; pre_fec_ber: number; post_fec_ber: number }[] };
};

type LinkIndex = { eval?: { n: number; accuracy: number; rows: { id: string; truth: string; predicted: string; ok: boolean }[] } };

const LinkLab: React.FC = function () {
  const { data, error, loading } = usePilotJson<LinkCase[]>('/link/cases.json');
  const idxMeta = usePilotJson<LinkIndex>('/link/index.json');
  const [idx, setIdx] = useState(0);
  const [view, setView] = useState('investigate');
  const [revealed, setRevealed] = useState(false);
  const selected = data && data[idx] ? data[idx] : null;

  if (loading) return <div className="app-workbench flex items-center justify-center text-white/50">Loading link cases…</div>;
  if (error || !data || !selected) return <div className="app-workbench p-8 text-rose-300">Could not load /link/cases.json. {error}</div>;

  const label = String((selected.diagnosis as { label?: string }).label || (selected.diagnosis as { claim?: string }).claim || '—');

  return (
    <Workbench
      product="Link Integrity Lab"
      domain="Credo · Broadcom · Marvell · Photonics"
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
      statusRight={(revealed ? selected.title : 'Lane ' + String.fromCharCode(65 + idx)) + ' · ' + label}
    >
      <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap gap-2">
          {data.map(function (c, i) {
            return (
              <Btn key={c.id} kind={i === idx ? 'primary' : 'ghost'} accent={ACCENT} onClick={function () { setIdx(i); setRevealed(false); setView('investigate'); }}>
                {revealed && i === idx ? c.title : 'Lane ' + String.fromCharCode(65 + i)}
              </Btn>
            );
          })}
          <Btn kind="ghost" onClick={function () { downloadJson('link-' + selected.id + '.json', selected); }}>Download</Btn>
        </div>
        <p className="text-xs text-white/45">{selected.disclaimer} Software netem loss is not optical BER.</p>

        {view === 'investigate' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Domain" value={selected.domain} />
                <Kpi label="Diagnosis" value={label} />
                <Kpi label="Mean SNR" value={fmtOpt((selected.diagnosis as { mean_snr_db?: number }).mean_snr_db, 1)} />
                <Kpi label="Mean BER" value={fmtOpt((selected.diagnosis as { mean_ber?: number }).mean_ber, 2)} />
              </div>
              <Panel title="SNR (dB)"><Spark values={selected.snr.map(function (p) { return p.v; })} color={ACCENT} height={64} /></Panel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Panel title="BER"><Spark values={selected.ber.map(function (p) { return p.v; })} color="#fb7185" height={56} /></Panel>
                <Panel title="Eye opening (UI)"><Spark values={selected.eye.map(function (p) { return p.v; })} color="#fbbf24" height={56} /></Panel>
              </div>
              {selected.fec_demo ? (
                <Panel title="FEC coding gain demo">
                  <p className="text-sm text-white/70">pre {selected.fec_demo.pre_fec_ber} → post {selected.fec_demo.post_fec_ber}</p>
                  <p className="text-xs text-white/45 mt-2">{selected.fec_demo.notes}</p>
                  {selected.fec_demo.curve ? (
                    <div className="mt-3">
                      <Spark values={selected.fec_demo.curve.map(function (p: { post_fec_ber: number }) { return Math.log10(p.post_fec_ber); })} color="#38bdf8" height={48} />
                      <p className="text-[10px] text-white/35 mt-1">log10(post-FEC BER) vs rising SNR</p>
                    </div>
                  ) : null}
                </Panel>
              ) : null}
            </div>
            <Panel title="Question">
              <p className="text-sm text-white/80">{selected.question}</p>
              <p className="text-sm text-white/50 mt-3">{String((selected.diagnosis as { notes?: string; reason?: string }).notes || (selected.diagnosis as { reason?: string }).reason || '')}</p>
            </Panel>
          </div>
        ) : null}

        {view === 'reveal' ? (
          <Panel title="Ground truth" action={<Btn accent={ACCENT} onClick={function () { setRevealed(true); }}>{revealed ? 'Shown' : 'Reveal'}</Btn>}>
            {revealed ? (
              <p className="text-sm text-white/75">Impairment: <span className="text-white font-semibold">{selected.ground_truth}</span> · predicted {label}</p>
            ) : (
              <p className="text-sm text-white/50">Inspect SNR/BER/eye before revealing the injector.</p>
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
          <Panel title="Reproduce">
            <pre className="text-xs text-emerald-200/90 bg-black/40 p-3 rounded overflow-x-auto">{
`pip install -e "./link[dev]"
python -m pytest -q link/tests
python -m link build-cases --out public/link
`}</pre>
          </Panel>
        ) : null}
      </div>
    </Workbench>
  );
};

export default LinkLab;
