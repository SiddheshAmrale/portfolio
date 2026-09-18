import React, { useMemo, useState } from 'react';
import Workbench from '../../apps/Workbench';
import { Btn, Kpi, Panel, Spark } from '../../apps/ui';
import { downloadJson } from '../shared/stats';
import { usePilotJson } from '../pilot/load';

const ACCENT = '#34d399';

type ForgeCase = {
  id: string;
  title: string;
  question: string;
  theme: string;
  software: string;
  disclaimer: string;
  run?: {
    bronze_in: number;
    bronze_rejected: number;
    silver_users: number;
    gold_rows: number;
    late_events: number;
    contracts: { table: string; ok: boolean; results: { name: string; passed: boolean; detail: string }[] }[];
  };
  quarantine?: unknown[];
  gold?: { day: string; plan: string; value: number }[];
  silver_users?: { user_id: string; plan: string; version: number; is_current: boolean }[];
  health?: {
    healthy: boolean;
    peak_allocation_lag_ms: number;
    lag_slo_ms?: number;
    lag_slo_ok?: boolean;
    sample_ratio?: {
      sample_ratio_ok: boolean;
      max_abs_deviation: number;
      observed_share: Record<string, number>;
      notes: string;
    };
    notes: string;
  };
  metrics?: { cell: string; conversion_rate: number; allocated: number }[];
  checks?: { name: string; passed: boolean; detail: string }[];
};

const ForgeLab: React.FC = function () {
  const { data, error, loading } = usePilotJson<ForgeCase[]>('/forge/cases.json');
  const index = usePilotJson<{ duckdb_gold_by_plan?: { plan: string; converts: number }[]; keywords?: string[] }>('/forge/index.json');
  const [idx, setIdx] = useState(0);
  const [view, setView] = useState('case');
  const selected = data && data[idx] ? data[idx] : null;

  const goldSpark = useMemo(function () {
    if (!selected || !selected.gold) return [];
    return selected.gold.map(function (g) { return g.value; });
  }, [selected]);

  if (loading) return <div className="app-workbench flex items-center justify-center text-white/50">Loading forge cases…</div>;
  if (error || !data || !selected) return <div className="app-workbench p-8 text-rose-300">Could not load /forge/cases.json. {error}</div>;

  return (
    <Workbench
      product="Lakehouse Forge"
      domain="Databricks · Netflix DE"
      accent={ACCENT}
      views={[
        { id: 'case', label: 'Case' },
        { id: 'contracts', label: 'Contracts' },
        { id: 'layers', label: 'Layers' },
        { id: 'reproduce', label: 'Reproduce' }
      ]}
      view={view}
      onView={setView}
      statusLeft={selected.software + ' · ' + selected.theme}
      statusRight={selected.title}
    >
      <div className="p-4 md:p-6 space-y-4 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap gap-2">
          {data.map(function (c, i) {
            return (
              <Btn key={c.id} kind={i === idx ? 'primary' : 'ghost'} accent={ACCENT} onClick={function () { setIdx(i); setView('case'); }}>
                {c.title}
              </Btn>
            );
          })}
          <Btn kind="ghost" onClick={function () { downloadJson('forge-' + selected.id + '.json', selected); }}>Download</Btn>
        </div>
        <p className="text-xs text-white/45">{selected.disclaimer} Keywords: medallion, CDC/SCD2, contracts, late data, experiment allocation health.</p>

        {view === 'case' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Kpi label="Bronze in" value={String(selected.run ? selected.run.bronze_in : (selected.metrics ? selected.metrics.length : '—'))} />
                <Kpi label="Quarantined" value={String(selected.run ? selected.run.bronze_rejected : (selected.health && !selected.health.healthy ? 'fail' : '0'))} tone={selected.run && selected.run.bronze_rejected ? 'bad' : 'ok'} />
                <Kpi label="Late events" value={String(selected.run ? selected.run.late_events : '—')} />
                <Kpi label="Health" value={selected.health ? (selected.health.healthy ? 'ok' : 'broken') : (selected.run && selected.run.contracts.every(function (c) { return c.ok; }) ? 'ok' : 'check')} tone={(selected.health && !selected.health.healthy) ? 'bad' : 'ok'} />
              </div>
              <Panel title="Question">
                <p className="text-sm text-white/80">{selected.question}</p>
              </Panel>
              {goldSpark.length ? (
                <Panel title="Gold metric values">
                  <Spark values={goldSpark} color={ACCENT} height={64} />
                </Panel>
              ) : null}
              {selected.metrics ? (
                <Panel title="Experiment cell conversion">
                  <ul className="text-sm font-mono space-y-1">
                    {selected.metrics.map(function (m) {
                      return <li key={m.cell} className="text-white/70">{m.cell}: rate {m.conversion_rate.toFixed(2)} (n={m.allocated})</li>;
                    })}
                  </ul>
                </Panel>
              ) : null}
              {selected.health && selected.health.sample_ratio ? (
                <Panel title="Data-health gates (allocation)">
                  <ul className="text-sm font-mono space-y-1">
                    <li className="text-white/70">peak lag: {selected.health.peak_allocation_lag_ms} ms · SLO {selected.health.lag_slo_ms || '—'} · {selected.health.lag_slo_ok === false ? 'FAIL' : 'ok'}</li>
                    <li className="text-white/70">sample ratio: {selected.health.sample_ratio.sample_ratio_ok ? 'ok' : 'SRM FAIL'} · max |dev| {(selected.health.sample_ratio.max_abs_deviation * 100).toFixed(1)}pp</li>
                    {Object.keys(selected.health.sample_ratio.observed_share).map(function (cell) {
                      return <li key={cell} className="text-white/55">{cell} share {(selected.health!.sample_ratio!.observed_share[cell] * 100).toFixed(0)}%</li>;
                    })}
                  </ul>
                  <p className="text-xs text-white/45 mt-2">{selected.health.sample_ratio.notes}</p>
                </Panel>
              ) : null}
            </div>
            <Panel title="Why this matters for DE roles">
              <p className="text-sm text-white/65 leading-relaxed">
                Databricks postings want medallion + Delta/CDC + quality expectations. Netflix experimentation DE wants allocation uniqueness and data health before analysis. Forge makes those failures reproducible offline.
              </p>
              {index.data && index.data.duckdb_gold_by_plan ? (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">DuckDB OLAP over gold.parquet</p>
                  <ul className="text-xs font-mono space-y-1">
                    {index.data.duckdb_gold_by_plan.map(function (r) {
                      return <li key={r.plan} className="text-emerald-200/90">{r.plan}: {r.converts}</li>;
                    })}
                  </ul>
                </div>
              ) : null}
            </Panel>
          </div>
        ) : null}

        {view === 'contracts' ? (
          <Panel title="Expectations">
            <ul className="space-y-2">
              {(selected.run ? selected.run.contracts.flatMap(function (c) {
                return c.results.map(function (r) {
                  return { ...r, table: c.table };
                });
              }) : (selected.checks || [])).map(function (r: { name: string; passed: boolean; detail: string; table?: string }, i: number) {
                return (
                  <li key={i} className="text-sm border-b border-white/5 pb-2">
                    <span className={'font-mono text-xs mr-2 ' + (r.passed ? 'text-emerald-400' : 'text-rose-400')}>{r.passed ? 'PASS' : 'FAIL'}</span>
                    <span className="text-white">{(r.table ? r.table + ' · ' : '') + r.name}</span>
                    <div className="text-xs text-white/45 font-mono mt-0.5">{r.detail}</div>
                  </li>
                );
              })}
            </ul>
            {selected.health ? <p className="text-sm text-white/55 mt-4">{selected.health.notes}</p> : null}
          </Panel>
        ) : null}

        {view === 'layers' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Panel title="Silver users (SCD2)">
              <ul className="text-xs font-mono space-y-1 max-h-80 overflow-auto">
                {(selected.silver_users || []).map(function (u, i) {
                  return <li key={i} className="text-white/65">{u.user_id} v{u.version} {u.plan} {u.is_current ? 'CURRENT' : ''}</li>;
                })}
              </ul>
            </Panel>
            <Panel title="Gold">
              <ul className="text-xs font-mono space-y-1 max-h-80 overflow-auto">
                {(selected.gold || []).map(function (g, i) {
                  return <li key={i} className="text-white/65">{g.day} {g.plan} = {g.value}</li>;
                })}
              </ul>
            </Panel>
            <Panel title="Quarantine">
              <p className="text-sm text-white/55">{(selected.quarantine || []).length} rejected bronze rows (visible, not silent).</p>
            </Panel>
          </div>
        ) : null}

        {view === 'reproduce' ? (
          <Panel title="Reproduce">
            <pre className="text-xs text-emerald-200/90 bg-black/40 p-3 rounded overflow-x-auto">{
`pip install -e "./forge[dev]"
python -m pytest -q --rootdir=forge
python -m forge build-cases --out public/forge
`}</pre>
          </Panel>
        ) : null}
      </div>
    </Workbench>
  );
};

export default ForgeLab;
