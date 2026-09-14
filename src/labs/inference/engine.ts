import { expovariate, lognormalInt, mulberry32 } from '../shared/rng';
import { percentile } from '../shared/stats';

export type SchedulerMode = 'baseline' | 'intervention';

export interface SimConfig {
  seed: number;
  durationMs: number;
  gpus: number;
  slotsPerGpu: number;
  rps: number;
  interactiveRatio: number;
  meanPrompt: number;
  meanOutput: number;
  abandonRate: number;
  clientTimeoutMs: number;
  kernelWindowMs: number;
  decodeMsPerToken: number;
  prefillMsPerToken: number;
  mode: SchedulerMode;
  interactiveReserve: number;
  retryOnTimeout: boolean;
  cancelCheckOverheadMs: number;
}

export interface OccupancySegment {
  reqId: number;
  gpu: number;
  slot: number;
  start: number;
  end: number;
  kind: 'prefill' | 'decode' | 'leaked';
  interactive: boolean;
}

export interface RequestSpec {
  arrival: number;
  interactive: boolean;
  promptTokens: number;
  outputTokens: number;
  abandonAt: number | null;
}

export interface RequestTrace {
  id: number;
  parentId: number | null;
  isRetry: boolean;
  interactive: boolean;
  arrival: number;
  rootArrival: number;
  start: number | null;
  end: number | null;
  clientGoneAt: number | null;
  delivered: boolean;
  clientLatency: number | null;
  status: string;
  promptTokens: number;
  outputTokens: number;
  wastedTokens: number;
}

export interface SimResult {
  config: SimConfig;
  interactiveLatencies: number[];
  batchLatencies: number[];
  leakedSlotMs: number;
  wastedTokens: number;
  usefulTokens: number;
  cancelledDeliveries: number;
  occupancyViolations: number;
  maxOccupancy: number;
  slotCapacity: number;
  completedInteractive: number;
  failedInteractive: number;
  completedBatch: number;
  failedBatch: number;
  timedOutRetries: number;
  attribution: {
    queueMs: number;
    prefillMs: number;
    decodeUsefulMs: number;
    decodeLeakedMs: number;
    isolationIdleMs: number;
  };
  segments: OccupancySegment[];
  queueDepthSamples: { t: number; depth: number }[];
  requests: RequestTrace[];
}

interface LiveReq {
  id: number;
  parentId: number | null;
  isRetry: boolean;
  interactive: boolean;
  arrival: number;
  rootArrival: number;
  promptTokens: number;
  outputTokens: number;
  abandonAt: number | null;
  timeoutAt: number;
  remainingPrefillMs: number;
  tokensDone: number;
  phase: 'queued' | 'prefill' | 'decode' | 'done';
  gpu: number;
  slot: number;
  start: number | null;
  end: number | null;
  clientGone: boolean;
  clientGoneAt: number | null;
  cancelled: boolean;
  delivered: boolean;
  retrySpawned: boolean;
  wastedTokens: number;
  usefulTokens: number;
  kernelStart: number;
  kernelEnd: number;
  kernelKind: 'prefill' | 'decode';
  status: string;
  clientLatency: number | null;
}

type Kind = 'kernel' | 'client' | 'arrival' | 'sample';

interface SimEvent {
  time: number;
  seq: number;
  kind: Kind;
  reqId?: number;
}

const KIND_ORDER: Record<Kind, number> = {
  kernel: 0,
  client: 1,
  arrival: 2,
  sample: 3
};

export const defaultInferenceConfig: SimConfig = {
  seed: 42,
  durationMs: 8000,
  gpus: 2,
  slotsPerGpu: 4,
  rps: 18,
  interactiveRatio: 0.55,
  meanPrompt: 120,
  meanOutput: 48,
  abandonRate: 0.22,
  clientTimeoutMs: 420,
  kernelWindowMs: 40,
  decodeMsPerToken: 12,
  prefillMsPerToken: 0.18,
  mode: 'baseline',
  interactiveReserve: 0.35,
  retryOnTimeout: true,
  cancelCheckOverheadMs: 0
};

function pushEvent(events: SimEvent[], ev: SimEvent) {
  events.push(ev);
}

function popEvent(events: SimEvent[]): SimEvent | undefined {
  if (!events.length) return undefined;
  let best = 0;
  for (let i = 1; i < events.length; i++) {
    const a = events[i];
    const b = events[best];
    if (a.time < b.time - 1e-9) {
      best = i;
    } else if (Math.abs(a.time - b.time) <= 1e-9) {
      if (KIND_ORDER[a.kind] < KIND_ORDER[b.kind] || (a.kind === b.kind && a.seq < b.seq)) {
        best = i;
      }
    }
  }
  return events.splice(best, 1)[0];
}

function generateWorkload(cfg: SimConfig, rand: () => number): RequestSpec[] {
  const specs: RequestSpec[] = [];
  let t = 0;
  const lambda = cfg.rps / 1000;
  while (true) {
    t += expovariate(rand, lambda);
    if (t >= cfg.durationMs) break;
    const interactive = rand() < cfg.interactiveRatio;
    const promptTokens = lognormalInt(rand, cfg.meanPrompt, 0.32);
    const outputTokens = lognormalInt(rand, cfg.meanOutput * (interactive ? 0.5 : 1.4), 0.4);
    let abandonAt: number | null = null;
    if (interactive && rand() < cfg.abandonRate) {
      const decodeMs = outputTokens * cfg.decodeMsPerToken;
      abandonAt = t + promptTokens * cfg.prefillMsPerToken + rand() * Math.max(decodeMs, 1);
    }
    specs.push({ arrival: t, interactive, promptTokens, outputTokens, abandonAt });
  }
  return specs;
}

function slotIndex(gpu: number, slot: number, slotsPerGpu: number): number {
  return gpu * slotsPerGpu + slot;
}

export function runSimulation(cfg: SimConfig, specs?: RequestSpec[]): SimResult {
  const rand = mulberry32(cfg.seed);
  const workload = specs || generateWorkload(cfg, rand);
  const capacity = cfg.gpus * cfg.slotsPerGpu;
  const reserved = cfg.mode === 'intervention' ? Math.floor(capacity * cfg.interactiveReserve) : 0;

  const occ: Array<number | null> = [];
  for (let i = 0; i < capacity; i++) occ.push(null);

  const reqs: LiveReq[] = [];
  const byId: Record<number, LiveReq> = {};
  const events: SimEvent[] = [];
  let seq = 1;
  let nextId = 1;

  const segments: OccupancySegment[] = [];
  const queue: number[] = [];
  const queueDepthSamples: { t: number; depth: number }[] = [];

  let leakedSlotMs = 0;
  let wastedTokens = 0;
  let usefulTokens = 0;
  let cancelledDeliveries = 0;
  let occupancyViolations = 0;
  let maxOccupancy = 0;
  let timedOutRetries = 0;
  let isolationIdleMs = 0;
  let lastIdleCheck = 0;
  let attrQueue = 0;
  let attrPrefill = 0;
  let attrDecodeUseful = 0;
  let attrDecodeLeaked = 0;

  function occupiedCount(): number {
    let n = 0;
    for (let i = 0; i < occ.length; i++) if (occ[i] !== null) n += 1;
    return n;
  }

  function findSlot(interactive: boolean): { gpu: number; slot: number; index: number } | null {
    for (let i = 0; i < occ.length; i++) {
      if (occ[i] !== null) continue;
      if (cfg.mode === 'intervention' && !interactive && i < reserved) continue;
      return { gpu: Math.floor(i / cfg.slotsPerGpu), slot: i % cfg.slotsPerGpu, index: i };
    }
    return null;
  }

  function accountIsolation(now: number) {
    const dt = now - lastIdleCheck;
    if (dt <= 0) {
      lastIdleCheck = now;
      return;
    }
    let interactiveWaiting = false;
    let batchWaiting = false;
    for (let i = 0; i < queue.length; i++) {
      const r = byId[queue[i]];
      if (!r) continue;
      if (r.interactive) interactiveWaiting = true;
      else batchWaiting = true;
    }
    if (batchWaiting && !interactiveWaiting && reserved > 0) {
      let freeReserved = 0;
      for (let i = 0; i < reserved; i++) if (occ[i] === null) freeReserved += 1;
      isolationIdleMs += dt * freeReserved;
    }
    lastIdleCheck = now;
  }

  function planKernel(req: LiveReq): number {
    if (req.remainingPrefillMs > 1e-9) {
      req.kernelKind = 'prefill';
      return Math.min(cfg.kernelWindowMs, req.remainingPrefillMs);
    }
    const left = Math.max(0, req.outputTokens - req.tokensDone);
    req.kernelKind = 'decode';
    return Math.min(cfg.kernelWindowMs, left * cfg.decodeMsPerToken);
  }

  function startKernel(req: LiveReq, now: number) {
    const work = Math.max(planKernel(req), 0.001);
    const dur = work + (cfg.mode === 'intervention' ? cfg.cancelCheckOverheadMs : 0);
    req.kernelStart = now;
    req.kernelEnd = now + dur;
    pushEvent(events, { time: req.kernelEnd, seq: seq++, kind: 'kernel', reqId: req.id });
  }

  function trySchedule(now: number) {
    accountIsolation(now);
    let guard = 0;
    while (queue.length && guard < 10000) {
      guard += 1;
      let picked = -1;
      for (let i = 0; i < queue.length; i++) {
        const r = byId[queue[i]];
        if (!r || r.phase !== 'queued') continue;
        if (findSlot(r.interactive)) {
          picked = i;
          break;
        }
        if (cfg.mode === 'baseline') break;
      }
      if (picked < 0) break;
      const req = byId[queue.splice(picked, 1)[0]];
      const slot = findSlot(req.interactive);
      if (!slot) {
        queue.splice(picked, 0, req.id);
        break;
      }
      occ[slot.index] = req.id;
      const occNow = occupiedCount();
      if (occNow > capacity) occupancyViolations += 1;
      if (occNow > maxOccupancy) maxOccupancy = occNow;
      req.gpu = slot.gpu;
      req.slot = slot.slot;
      req.start = now;
      req.phase = req.remainingPrefillMs > 1e-9 ? 'prefill' : 'decode';
      attrQueue += now - req.arrival;
      startKernel(req, now);
    }
  }

  function complete(req: LiveReq, now: number, status: string) {
    req.phase = 'done';
    req.end = now;
    req.status = status;
    if (req.gpu >= 0) {
      const idx = slotIndex(req.gpu, req.slot, cfg.slotsPerGpu);
      if (occ[idx] === req.id) occ[idx] = null;
      req.gpu = -1;
    }
    if (status === 'complete' && !req.clientGone && !req.delivered) {
      req.delivered = true;
      req.clientLatency = now - req.rootArrival;
    } else if (status === 'complete' && req.clientGone) {
      req.status = 'late-complete';
    }
    if (req.delivered && req.clientGoneAt !== null && now > req.clientGoneAt + 1e-6) {
      cancelledDeliveries += 1;
      req.delivered = false;
    }
    trySchedule(now);
  }

  function spawnRetry(parent: LiveReq, now: number) {
    if (parent.retrySpawned || parent.isRetry) return;
    parent.retrySpawned = true;
    timedOutRetries += 1;
    const child: LiveReq = {
      id: nextId++,
      parentId: parent.id,
      isRetry: true,
      interactive: parent.interactive,
      arrival: now,
      rootArrival: parent.rootArrival,
      promptTokens: parent.promptTokens,
      outputTokens: parent.outputTokens,
      abandonAt: null,
      timeoutAt: now + cfg.clientTimeoutMs,
      remainingPrefillMs: parent.promptTokens * cfg.prefillMsPerToken,
      tokensDone: 0,
      phase: 'queued',
      gpu: -1,
      slot: -1,
      start: null,
      end: null,
      clientGone: false,
      clientGoneAt: null,
      cancelled: false,
      delivered: false,
      retrySpawned: false,
      wastedTokens: 0,
      usefulTokens: 0,
      kernelStart: 0,
      kernelEnd: 0,
      kernelKind: 'prefill',
      status: 'queued',
      clientLatency: null
    };
    reqs.push(child);
    byId[child.id] = child;
    queue.push(child.id);
    pushEvent(events, { time: child.timeoutAt, seq: seq++, kind: 'client', reqId: child.id });
  }

  function markClientGone(req: LiveReq, now: number, reason: 'abandon' | 'timeout') {
    if (req.clientGone) return;
    req.clientGone = true;
    req.clientGoneAt = now;
    if (cfg.mode === 'intervention') {
      req.cancelled = true;
    }
    if (reason === 'timeout' && cfg.retryOnTimeout && req.interactive) {
      spawnRetry(req, now);
    }
  }

  function onKernelEnd(req: LiveReq, now: number) {
    if (req.phase === 'done') return;
    const overhead = cfg.mode === 'intervention' ? cfg.cancelCheckOverheadMs : 0;
    const workMs = Math.max(0, now - req.kernelStart - overhead);
    const kind: OccupancySegment['kind'] =
      req.clientGone ? 'leaked' : req.kernelKind === 'prefill' ? 'prefill' : 'decode';
    segments.push({
      reqId: req.id,
      gpu: req.gpu,
      slot: req.slot,
      start: req.kernelStart,
      end: now,
      kind,
      interactive: req.interactive
    });

    if (req.kernelKind === 'prefill') {
      const used = Math.min(req.remainingPrefillMs, workMs);
      req.remainingPrefillMs = Math.max(0, req.remainingPrefillMs - used);
      attrPrefill += used;
      if (req.clientGone) leakedSlotMs += now - req.kernelStart;
    } else {
      const left = req.outputTokens - req.tokensDone;
      const tokenBudget = Math.floor(workMs / cfg.decodeMsPerToken + 1e-9);
      const tokens = Math.min(left, Math.max(left > 0 ? 1 : 0, tokenBudget));
      req.tokensDone += tokens;
      const used = tokens * cfg.decodeMsPerToken;
      if (req.clientGone) {
        leakedSlotMs += now - req.kernelStart;
        req.wastedTokens += tokens;
        wastedTokens += tokens;
        attrDecodeLeaked += used;
      } else {
        req.usefulTokens += tokens;
        usefulTokens += tokens;
        attrDecodeUseful += used;
      }
    }

    if (req.cancelled && cfg.mode === 'intervention') {
      complete(req, now, 'cancelled');
      return;
    }

    if (req.remainingPrefillMs <= 1e-9 && req.tokensDone >= req.outputTokens) {
      complete(req, now, 'complete');
      return;
    }

    req.phase = req.remainingPrefillMs > 1e-9 ? 'prefill' : 'decode';
    startKernel(req, now);
  }

  function makeLive(spec: RequestSpec): LiveReq {
    const id = nextId++;
    const req: LiveReq = {
      id,
      parentId: null,
      isRetry: false,
      interactive: spec.interactive,
      arrival: spec.arrival,
      rootArrival: spec.arrival,
      promptTokens: spec.promptTokens,
      outputTokens: spec.outputTokens,
      abandonAt: spec.abandonAt,
      timeoutAt: spec.interactive ? spec.arrival + cfg.clientTimeoutMs : spec.arrival + cfg.durationMs * 4,
      remainingPrefillMs: spec.promptTokens * cfg.prefillMsPerToken,
      tokensDone: 0,
      phase: 'queued',
      gpu: -1,
      slot: -1,
      start: null,
      end: null,
      clientGone: false,
      clientGoneAt: null,
      cancelled: false,
      delivered: false,
      retrySpawned: false,
      wastedTokens: 0,
      usefulTokens: 0,
      kernelStart: 0,
      kernelEnd: 0,
      kernelKind: 'prefill',
      status: 'queued',
      clientLatency: null
    };
    reqs.push(req);
    byId[id] = req;
    return req;
  }

  for (let i = 0; i < workload.length; i++) {
    const spec = workload[i];
    const req = makeLive(spec);
    pushEvent(events, { time: spec.arrival, seq: seq++, kind: 'arrival', reqId: req.id });
    pushEvent(events, { time: req.timeoutAt, seq: seq++, kind: 'client', reqId: req.id });
    if (spec.abandonAt !== null) {
      pushEvent(events, { time: spec.abandonAt, seq: seq++, kind: 'client', reqId: req.id });
    }
  }

  for (let t = 0; t <= cfg.durationMs; t += 40) {
    pushEvent(events, { time: t, seq: seq++, kind: 'sample' });
  }

  const horizon = cfg.durationMs * 3 + 5000;
  while (events.length) {
    const ev = popEvent(events);
    if (!ev) break;
    if (ev.time > horizon) break;
    const now = ev.time;

    if (ev.kind === 'sample') {
      queueDepthSamples.push({ t: now, depth: queue.length });
      continue;
    }

    const req = ev.reqId !== undefined ? byId[ev.reqId] : undefined;
    if (!req) continue;

    if (ev.kind === 'arrival') {
      if (req.phase !== 'queued') continue;
      queue.push(req.id);
      trySchedule(now);
      continue;
    }

    if (ev.kind === 'client') {
      if (req.phase === 'done') continue;
      if (req.delivered) continue;
      const isAbandon = req.abandonAt !== null && Math.abs(now - req.abandonAt) < 1e-6;
      const isTimeout = Math.abs(now - req.timeoutAt) < 1e-6;
      if (isAbandon) {
        markClientGone(req, now, 'abandon');
      } else if (isTimeout && !req.delivered) {
        markClientGone(req, now, 'timeout');
      }
      continue;
    }

    if (ev.kind === 'kernel') {
      if (Math.abs(now - req.kernelEnd) > 1e-6) continue;
      onKernelEnd(req, now);
    }
  }

  for (let i = 0; i < reqs.length; i++) {
    const req = reqs[i];
    if (req.phase !== 'done') {
      req.status = 'incomplete';
      if (req.gpu >= 0) {
        const idx = slotIndex(req.gpu, req.slot, cfg.slotsPerGpu);
        if (occ[idx] === req.id) occ[idx] = null;
      }
    }
  }

  const interactiveLatencies: number[] = [];
  const batchLatencies: number[] = [];
  let completedInteractive = 0;
  let failedInteractive = 0;
  let completedBatch = 0;
  let failedBatch = 0;
  const traces: RequestTrace[] = [];

  const roots = reqs.filter(function (r) { return !r.isRetry; });
  for (let i = 0; i < roots.length; i++) {
    const root = roots[i];
    let delivered = root.delivered;
    let latency = root.clientLatency;
    let status = root.status || 'incomplete';
    for (let j = 0; j < reqs.length; j++) {
      if (reqs[j].rootArrival === root.rootArrival && reqs[j].delivered) {
        delivered = true;
        latency = reqs[j].clientLatency;
        status = 'complete';
      }
    }
    if (root.interactive) {
      if (delivered && latency !== null) {
        completedInteractive += 1;
        interactiveLatencies.push(latency);
      } else {
        failedInteractive += 1;
      }
    } else if (delivered && latency !== null) {
      completedBatch += 1;
      batchLatencies.push(latency);
    } else {
      failedBatch += 1;
    }
    void status;
  }

  for (let i = 0; i < reqs.length; i++) {
    const r = reqs[i];
    traces.push({
      id: r.id,
      parentId: r.parentId,
      isRetry: r.isRetry,
      interactive: r.interactive,
      arrival: r.arrival,
      rootArrival: r.rootArrival,
      start: r.start,
      end: r.end,
      clientGoneAt: r.clientGoneAt,
      delivered: r.delivered,
      clientLatency: r.clientLatency,
      status: r.status || (r.phase === 'done' ? 'done' : 'incomplete'),
      promptTokens: r.promptTokens,
      outputTokens: r.outputTokens,
      wastedTokens: r.wastedTokens
    });
  }

  return {
    config: cfg,
    interactiveLatencies,
    batchLatencies,
    leakedSlotMs,
    wastedTokens,
    usefulTokens,
    cancelledDeliveries,
    occupancyViolations,
    maxOccupancy,
    slotCapacity: capacity,
    completedInteractive,
    failedInteractive,
    completedBatch,
    failedBatch,
    timedOutRetries,
    attribution: {
      queueMs: attrQueue,
      prefillMs: attrPrefill,
      decodeUsefulMs: attrDecodeUseful,
      decodeLeakedMs: attrDecodeLeaked,
      isolationIdleMs
    },
    segments,
    queueDepthSamples,
    requests: traces
  };
}

export interface TrialSummary {
  p50: number;
  p95: number;
  p99: number;
  successRate: number;
  leakedSlotMs: number;
  wastedTokens: number;
  isolationIdleMs: number;
  timedOutRetries: number;
  occupancyViolations: number;
  cancelledDeliveries: number;
  completedInteractive: number;
  failedInteractive: number;
  batchP95: number;
  batchSuccessRate: number;
}

export function summarize(result: SimResult): TrialSummary {
  const totalI = result.completedInteractive + result.failedInteractive;
  const totalB = result.completedBatch + result.failedBatch;
  return {
    p50: percentile(result.interactiveLatencies, 50),
    p95: percentile(result.interactiveLatencies, 95),
    p99: percentile(result.interactiveLatencies, 99),
    successRate: totalI ? result.completedInteractive / totalI : 0,
    leakedSlotMs: result.leakedSlotMs,
    wastedTokens: result.wastedTokens,
    isolationIdleMs: result.attribution.isolationIdleMs,
    timedOutRetries: result.timedOutRetries,
    occupancyViolations: result.occupancyViolations,
    cancelledDeliveries: result.cancelledDeliveries,
    completedInteractive: result.completedInteractive,
    failedInteractive: result.failedInteractive,
    batchP95: percentile(result.batchLatencies, 95),
    batchSuccessRate: totalB ? result.completedBatch / totalB : 0
  };
}

export function runTrials(cfg: SimConfig, trials: number): { summaries: TrialSummary[]; mean: TrialSummary; last: SimResult } {
  const summaries: TrialSummary[] = [];
  let last: SimResult = runSimulation(cfg);
  for (let i = 0; i < trials; i++) {
    const result = runSimulation(Object.assign({}, cfg, { seed: cfg.seed + i * 17 }));
    last = result;
    summaries.push(summarize(result));
  }
  function avg(pick: (s: TrialSummary) => number): number {
    return summaries.reduce(function (a, s) { return a + pick(s); }, 0) / Math.max(summaries.length, 1);
  }
  const meanSummary: TrialSummary = {
    p50: avg(function (s) { return s.p50; }),
    p95: avg(function (s) { return s.p95; }),
    p99: avg(function (s) { return s.p99; }),
    successRate: avg(function (s) { return s.successRate; }),
    leakedSlotMs: avg(function (s) { return s.leakedSlotMs; }),
    wastedTokens: avg(function (s) { return s.wastedTokens; }),
    isolationIdleMs: avg(function (s) { return s.isolationIdleMs; }),
    timedOutRetries: avg(function (s) { return s.timedOutRetries; }),
    occupancyViolations: avg(function (s) { return s.occupancyViolations; }),
    cancelledDeliveries: avg(function (s) { return s.cancelledDeliveries; }),
    completedInteractive: avg(function (s) { return s.completedInteractive; }),
    failedInteractive: avg(function (s) { return s.failedInteractive; }),
    batchP95: avg(function (s) { return s.batchP95; }),
    batchSuccessRate: avg(function (s) { return s.batchSuccessRate; })
  };
  return { summaries, mean: meanSummary, last };
}

export interface EngineTest {
  name: string;
  pass: boolean;
  detail: string;
}

export function runInferenceCorrectnessSuite(): EngineTest[] {
  const tests: EngineTest[] = [];

  const leakSpecs: RequestSpec[] = [
    { arrival: 0, interactive: true, promptTokens: 8, outputTokens: 70, abandonAt: null },
    { arrival: 25, interactive: true, promptTokens: 8, outputTokens: 10, abandonAt: null }
  ];
  const leakCfg: SimConfig = Object.assign({}, defaultInferenceConfig, {
    seed: 1,
    durationMs: 4000,
    gpus: 1,
    slotsPerGpu: 1,
    rps: 0.01,
    abandonRate: 0,
    clientTimeoutMs: 180,
    kernelWindowMs: 40,
    decodeMsPerToken: 10,
    prefillMsPerToken: 0.2,
    mode: 'baseline' as SchedulerMode,
    interactiveReserve: 0,
    retryOnTimeout: true,
    cancelCheckOverheadMs: 0,
    interactiveRatio: 1
  });
  const baselineLeak = runSimulation(leakCfg, leakSpecs);
  const interventionLeak = runSimulation(Object.assign({}, leakCfg, { mode: 'intervention' as SchedulerMode, interactiveReserve: 0 }), leakSpecs);

  tests.push({
    name: 'Occupancy never exceeds slot capacity (baseline fixture)',
    pass: baselineLeak.occupancyViolations === 0 && baselineLeak.maxOccupancy <= baselineLeak.slotCapacity,
    detail: 'max=' + baselineLeak.maxOccupancy + ' cap=' + baselineLeak.slotCapacity + ' violations=' + baselineLeak.occupancyViolations
  });

  tests.push({
    name: 'Baseline timeout retry leaks original decode work',
    pass: baselineLeak.leakedSlotMs > 200 && baselineLeak.timedOutRetries >= 1 && baselineLeak.wastedTokens > 0,
    detail: 'leaked=' + baselineLeak.leakedSlotMs.toFixed(1) + 'ms retries=' + baselineLeak.timedOutRetries + ' wastedTokens=' + baselineLeak.wastedTokens
  });

  tests.push({
    name: 'Intervention reduces leaked slot-ms versus the same fixture',
    pass: interventionLeak.leakedSlotMs < baselineLeak.leakedSlotMs * 0.55,
    detail: 'baseline=' + baselineLeak.leakedSlotMs.toFixed(1) + 'ms intervention=' + interventionLeak.leakedSlotMs.toFixed(1) + 'ms'
  });

  function noLateDeliveries(result: SimResult): boolean {
    for (let i = 0; i < result.requests.length; i++) {
      const r = result.requests[i];
      if (r.delivered && r.clientGoneAt !== null && r.end !== null && r.end > r.clientGoneAt + 1e-6) {
        return false;
      }
    }
    return result.cancelledDeliveries === 0;
  }

  tests.push({
    name: 'Client-gone originals are not delivered in either mode',
    pass: noLateDeliveries(baselineLeak) && noLateDeliveries(interventionLeak),
    detail: 'baseline late=' + baselineLeak.cancelledDeliveries + ' intervention late=' + interventionLeak.cancelledDeliveries
  });

  const noisy = runSimulation(Object.assign({}, defaultInferenceConfig, { seed: 9, mode: 'baseline' as SchedulerMode }));
  const noisyI = runSimulation(Object.assign({}, defaultInferenceConfig, { seed: 9, mode: 'intervention' as SchedulerMode }));
  const p50b = percentile(noisy.interactiveLatencies, 50);
  const p95b = percentile(noisy.interactiveLatencies, 95);
  const p99b = percentile(noisy.interactiveLatencies, 99);
  tests.push({
    name: 'Interactive percentiles are monotonic',
    pass: p50b <= p95b + 1e-6 && p95b <= p99b + 1e-6,
    detail: 'p50=' + p50b.toFixed(1) + ' p95=' + p95b.toFixed(1) + ' p99=' + p99b.toFixed(1)
  });

  tests.push({
    name: 'Default noisy-neighbor occupancy stays within capacity',
    pass: noisy.occupancyViolations === 0 && noisyI.occupancyViolations === 0,
    detail: 'baseline viol=' + noisy.occupancyViolations + ' intervention viol=' + noisyI.occupancyViolations
  });

  const starveCfg: SimConfig = Object.assign({}, defaultInferenceConfig, {
    seed: 3,
    durationMs: 6000,
    interactiveRatio: 0.05,
    abandonRate: 0,
    retryOnTimeout: false,
    mode: 'intervention' as SchedulerMode,
    interactiveReserve: 0.75,
    rps: 14,
    meanOutput: 40
  });
  const starveBase = runSimulation(Object.assign({}, starveCfg, { mode: 'baseline' as SchedulerMode, interactiveReserve: 0 }));
  const starveInt = runSimulation(starveCfg);
  tests.push({
    name: 'Honest failure: high interactive reserve can starve batch jobs',
    pass: starveInt.attribution.isolationIdleMs > 10 && starveInt.completedBatch <= starveBase.completedBatch,
    detail: 'idle=' + starveInt.attribution.isolationIdleMs.toFixed(0) + ' batch complete intervention=' + starveInt.completedBatch + ' baseline=' + starveBase.completedBatch
  });

  const heldOut = runSimulation(Object.assign({}, defaultInferenceConfig, {
    seed: 99,
    rps: 28,
    abandonRate: 0.35,
    interactiveRatio: 0.7,
    mode: 'intervention' as SchedulerMode
  }));
  tests.push({
    name: 'Held-out burst workload runs without occupancy violations',
    pass: heldOut.occupancyViolations === 0 && heldOut.requests.length > 0,
    detail: 'requests=' + heldOut.requests.length + ' interactive completed=' + heldOut.completedInteractive
  });

  return tests;
}

export function heldOutConfig(base: SimConfig): SimConfig {
  return Object.assign({}, base, {
    seed: base.seed + 991,
    rps: base.rps * 1.55,
    abandonRate: Math.min(0.9, base.abandonRate * 1.4),
    interactiveRatio: Math.min(0.95, base.interactiveRatio + 0.12),
    durationMs: base.durationMs
  });
}
