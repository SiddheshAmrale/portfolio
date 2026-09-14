import { mulberry32 } from '../shared/rng';
import { Circuit, gateCount } from './statevector';

export type Recovery = 'naive' | 'exactly-once';

export interface HybridJob {
  id: number;
  circuit: Circuit;
  classicalWrites: number;
}

export interface JobEvent {
  t: number;
  jobId: number;
  stage: string;
  detail: string;
}

export interface OrchestratorResult {
  events: JobEvent[];
  published: number[];
  duplicatePublishes: number;
  quantumRetries: number;
  successes: number;
  failures: number;
}

export function runOrchestrator(opts: {
  jobs: HybridJob[];
  recovery: Recovery;
  failProb: number;
  seed: number;
}): OrchestratorResult {
  const rand = mulberry32(opts.seed);
  const events: JobEvent[] = [];
  const published: number[] = [];
  let duplicatePublishes = 0;
  let quantumRetries = 0;
  let successes = 0;
  let failures = 0;
  let t = 0;
  const donePost: Record<number, boolean> = {};

  function log(jobId: number, stage: string, detail: string) {
    events.push({ t: t, jobId: jobId, stage: stage, detail: detail });
  }

  for (let i = 0; i < opts.jobs.length; i++) {
    const job = opts.jobs[i];
    t += 4;
    log(job.id, 'classical-prep', 'Build payload and idempotency key job-' + job.id);
    const cost = gateCount(job.circuit.ops);
    const runtime = 8 + cost.twoQ * 3 + cost.depth;
    let attempts = 0;
    let quantumOk = false;
    while (attempts < 4 && !quantumOk) {
      attempts += 1;
      t += runtime;
      const fail = rand() < opts.failProb;
      if (fail) {
        quantumRetries += 1;
        log(job.id, 'quantum-fail', 'Device error after ' + runtime + ' ticks (attempt ' + attempts + ')');
        t += 6;
      } else {
        quantumOk = true;
        log(job.id, 'quantum-ok', 'Circuit returned (attempt ' + attempts + ')');
      }
    }
    if (!quantumOk) {
      failures += 1;
      log(job.id, 'abort', 'Exceeded quantum retries');
      continue;
    }
    t += 3;
    if (opts.recovery === 'exactly-once' && donePost[job.id]) {
      log(job.id, 'classical-post', 'Skipped duplicate (first success) — key job-' + job.id + ' already applied');
    } else {
      if (donePost[job.id]) duplicatePublishes += job.classicalWrites;
      for (let w = 0; w < job.classicalWrites; w++) published.push(job.id);
      donePost[job.id] = true;
      log(job.id, 'classical-post', 'Publish classical result after quantum success');
    }
    const lateZombie = rand() < 0.45;
    if (lateZombie) {
      quantumRetries += 1;
      t += runtime;
      log(job.id, 'quantum-zombie', 'Late retry completed after timeout — at-least-once delivery');
      if (opts.recovery === 'exactly-once' && donePost[job.id]) {
        log(job.id, 'classical-post', 'Skipped duplicate (zombie) — key job-' + job.id + ' already applied');
      } else {
        if (donePost[job.id]) duplicatePublishes += job.classicalWrites;
        for (let w = 0; w < job.classicalWrites; w++) published.push(job.id);
        donePost[job.id] = true;
        log(job.id, 'classical-post', 'Zombie retry ran classical post again');
      }
    }
    successes += 1;
  }

  return {
    events: events,
    published: published,
    duplicatePublishes: duplicatePublishes,
    quantumRetries: quantumRetries,
    successes: successes,
    failures: failures
  };
}
