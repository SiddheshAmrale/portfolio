export type ObsRow = {
  run_id: string;
  source_id: string;
  interface: string;
  metric: string;
  value: number | null;
  unit: string;
  metric_type: string;
  observation_time_ms: number;
  arrival_time_ms: number;
  scrape_seq: number;
  collector_epoch: number;
  collection_status: string;
  source_ref: string;
  transform: string;
  notes: string;
};

export type RateRow = {
  t_obs_ms: number;
  t_arr_ms?: number;
  interval_ms: number;
  naive_per_s: number | null;
  naive_arrival_per_s: number | null;
  prom_per_s: number | null;
  pilot_per_s: number | null;
  classification: string;
  detail: string;
  scrape_seq: number;
};

export type QualityCase = {
  id: string;
  title: string;
  question: string;
  software: string;
  linux_proc_available: boolean;
  disclaimer: string;
  reproduce: string;
  original_rows: ObsRow[];
  original_rates_rx_bytes: RateRow[];
  rows: ObsRow[];
  rates_rx_bytes: RateRow[];
  missing_rx_visible: boolean;
  alert: {
    threshold_per_s: number;
    naive_alert: boolean;
    pilot_alert: boolean;
    naive_mean: number | null;
    pilot_mean: number | null;
    naive_peak_abs?: number | null;
    pilot_peak_abs?: number | null;
    conclusion_changed: boolean;
  };
  means: { naive_obs: number | null; naive_arrival: number | null; pilot: number | null };
  n_raw: number;
  n_unique_seq: number;
  withheld: number;
};

export type EvidenceRow = { name: string; present: boolean; detail: string };

export type IncidentCase = {
  id: string;
  blind_label: string;
  title: string;
  software: string;
  disclaimer: string;
  reproduce: string;
  source?: string;
  impairment_confirmed?: boolean;
  confirm_detail?: string;
  ground_truth: string;
  baseline_diagnosis: string;
  time_to_detect_seq: number | null;
  diagnosis: {
    label: string;
    notes: string;
    evidence: EvidenceRow[];
    missing_evidence: string[];
  };
  rows: ObsRow[];
  app_latency: { t: number; v: number }[];
  cpu: { t: number; v: number }[];
  retrans_rates: RateRow[];
};

export type EvalRow = { run_id: string; truth: string; predicted: string; split: string };

export type Intervention = {
  condition: string;
  predicted: string;
  predicted_action: string;
  correct_action: string;
  correct_action_helped: boolean | null;
  wrong_action: string;
  wrong_action_helped: boolean | null;
  latency_correct?: { t: number; v: number; seq: number }[];
  latency_wrong?: { t: number; v: number; seq: number }[];
};

export type IncidentPayload = {
  id: string;
  title: string;
  software: string;
  disclaimer: string;
  held_out: {
    n: number;
    diagnosed_pct: number;
    accuracy_when_diagnosed: number;
    network_false_attr: number;
    missed_impaired: number;
    insufficient: number;
    rows: EvalRow[];
  };
  calibration: {
    n: number;
    accuracy_when_diagnosed: number;
    diagnosed_pct: number;
  };
  interventions: Intervention[];
  linux_eval?: {
    n: number;
    diagnosed_pct: number;
    accuracy_when_diagnosed: number;
    network_false_attr: number;
    missed_impaired: number;
    insufficient: number;
    unconfirmed?: number;
    rows: EvalRow[];
  } | null;
  cases: IncidentCase[];
};

export type GroupResult = {
  name: string;
  n: number;
  values: number[];
  median: number;
  mean: number;
};

export type Comparison = {
  primary_metric: string;
  meaningful_delta: number;
  decision: string;
  effect: number;
  detail: string;
  aa_false_alarm: boolean;
  a: GroupResult;
  b: GroupResult;
};

export type RegressionPayload = {
  software: string;
  disclaimer: string;
  reproduce: string;
  aa: Comparison;
  collector_naive_vs_pilot: Comparison;
  deliberate_regression: Comparison;
};
