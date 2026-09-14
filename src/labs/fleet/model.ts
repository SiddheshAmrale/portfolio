import { mulberry32 } from '../shared/rng';

export type Fault = 'healthy' | 'thermal' | 'ecc' | 'xid' | 'link';
export type Policy = 'reboot-storm' | 'diagnose-then-act';

export interface Gpu {
  id: string;
  node: number;
  index: number;
  util: number;
  tempC: number;
  powerW: number;
  eccSbe: number;
  eccDbe: number;
  xid: number;
  nvlinkCrc: number;
  hidden: Fault;
  isolated: boolean;
  draining: boolean;
  lastAction: string;
  actionUntil: number;
}

export interface FleetEvent {
  t: number;
  gpuId: string;
  msg: string;
}

export interface PowerSample {
  t: number;
  gpuW: number;
  facilityW: number;
  alerts: number;
}

export interface FleetState {
  t: number;
  gpus: Gpu[];
  events: FleetEvent[];
  gpuEnergyKj: number;
  facilityEnergyKj: number;
  coolingSetpoint: number;
  facilityPowerW: number;
  policy: Policy;
  auto: boolean;
  samples: PowerSample[];
}

export function createFleet(seed = 11): FleetState {
  const rand = mulberry32(seed);
  const gpus: Gpu[] = [];
  for (let n = 0; n < 4; n++) {
    for (let i = 0; i < 4; i++) {
      const roll = rand();
      let hidden: Fault = 'healthy';
      if (roll > 0.86) hidden = 'thermal';
      else if (roll > 0.74) hidden = 'ecc';
      else if (roll > 0.66) hidden = 'link';
      else if (roll > 0.6) hidden = 'xid';
      gpus.push({
        id: 'n' + n + '-g' + i,
        node: n,
        index: i,
        util: 0.4 + rand() * 0.5,
        tempC: 58 + rand() * 18,
        powerW: 280 + rand() * 120,
        eccSbe: 0,
        eccDbe: 0,
        xid: 0,
        nvlinkCrc: 0,
        hidden: hidden,
        isolated: false,
        draining: false,
        lastAction: 'none',
        actionUntil: 0
      });
    }
  }
  let gpuPower = 0;
  for (let i = 0; i < gpus.length; i++) gpuPower += gpus[i].powerW;
  return {
    t: 0,
    gpus: gpus,
    events: [],
    gpuEnergyKj: 0,
    facilityEnergyKj: 0,
    coolingSetpoint: 27,
    facilityPowerW: gpuPower * 1.32,
    policy: 'diagnose-then-act',
    auto: false,
    samples: [{ t: 0, gpuW: gpuPower, facilityW: gpuPower * 1.32, alerts: 0 }]
  };
}

function pushEvent(state: FleetState, gpuId: string, msg: string) {
  state.events.unshift({ t: state.t, gpuId: gpuId, msg: msg });
  if (state.events.length > 80) state.events.pop();
}

export function probeGpu(g: Gpu): { findings: string[]; recommended: 'reset' | 'drain-reset' | 'isolate' | 'none' } {
  const findings: string[] = [];
  if (g.tempC > 85) findings.push('SM clock throttle likely (temp ' + g.tempC.toFixed(1) + '°C)');
  if (g.eccDbe > 0) findings.push('Uncorrectable ECC: ' + g.eccDbe);
  if (g.eccSbe > 8) findings.push('Correctable ECC climbing: ' + g.eccSbe);
  if (g.xid > 0) findings.push('Xid ' + g.xid + ' latched');
  if (g.nvlinkCrc > 12) findings.push('NVLink CRC errors ' + g.nvlinkCrc);
  if (g.isolated) findings.push('Already isolated');
  if (g.eccDbe > 0 || g.xid === 79 || g.xid === 13) return { findings: findings, recommended: 'isolate' };
  if (g.tempC > 88 || g.nvlinkCrc > 20) return { findings: findings, recommended: 'drain-reset' };
  if (findings.length) return { findings: findings, recommended: 'reset' };
  return { findings: ['No DCGM-class alert on sampled counters'], recommended: 'none' };
}

export function act(state: FleetState, gpuId: string, action: 'reset' | 'drain-reset' | 'isolate' | 'ignore'): FleetState {
  const next = clone(state);
  const g = next.gpus.find(function (x) { return x.id === gpuId; });
  if (!g) return next;
  if (action === 'ignore') {
    g.lastAction = 'ignored';
    pushEvent(next, gpuId, 'Operator ignored alert');
    return next;
  }
  if (action === 'isolate') {
    g.isolated = true;
    g.util = 0;
    g.powerW = 45;
    g.lastAction = 'isolated';
    g.actionUntil = next.t + 8;
    pushEvent(next, gpuId, 'Isolated. Page hardware. Workload drained from this GPU only.');
    return next;
  }
  if (action === 'drain-reset') {
    g.draining = true;
    g.lastAction = 'draining';
    g.actionUntil = next.t + 6;
    pushEvent(next, gpuId, 'Draining node slice before reset');
    return next;
  }
  g.lastAction = 'resetting';
  g.actionUntil = next.t + 4;
  g.util = 0;
  pushEvent(next, gpuId, 'In-place reset (no drain). In-flight work is killed.');
  return next;
}

export function applyPolicy(state: FleetState, gpu: Gpu): FleetState {
  const rec = probeGpu(gpu).recommended;
  if (state.policy === 'reboot-storm') {
    if (rec !== 'none') return act(state, gpu.id, 'reset');
    return state;
  }
  if (rec === 'none') return state;
  return act(state, gpu.id, rec);
}

function clone(state: FleetState): FleetState {
  return {
    t: state.t,
    gpus: state.gpus.map(function (g) { return Object.assign({}, g); }),
    events: state.events.slice(),
    gpuEnergyKj: state.gpuEnergyKj,
    facilityEnergyKj: state.facilityEnergyKj,
    coolingSetpoint: state.coolingSetpoint,
    facilityPowerW: state.facilityPowerW,
    policy: state.policy,
    auto: state.auto,
    samples: state.samples.slice()
  };
}

export function tick(state: FleetState, dt: number, rand: () => number): FleetState {
  const next = clone(state);
  next.t += dt;
  let gpuPower = 0;
  for (let i = 0; i < next.gpus.length; i++) {
    const g = next.gpus[i];
    if (g.actionUntil && next.t >= g.actionUntil) {
      if (g.lastAction === 'resetting' || g.lastAction === 'draining') {
        const hardware = g.hidden === 'ecc' || g.hidden === 'xid';
        if (hardware && rand() < 0.7) {
          pushEvent(next, g.id, 'Reset completed but fault remains (needs isolate/replace)');
          g.draining = false;
        } else {
          g.hidden = 'healthy';
          g.xid = 0;
          g.nvlinkCrc = Math.max(0, Math.floor(g.nvlinkCrc * 0.2));
          g.eccDbe = 0;
          g.tempC = 62;
          g.draining = false;
          g.isolated = false;
          pushEvent(next, g.id, 'Reset recovered a soft fault');
        }
        g.lastAction = 'none';
        g.actionUntil = 0;
      }
    }
    if (g.isolated) {
      g.util = 0;
      g.powerW = 42 + rand() * 6;
      gpuPower += g.powerW;
      continue;
    }
    if (g.draining) {
      g.util = Math.max(0, g.util - 0.25 * dt);
      g.powerW = 80 + g.util * 200;
      gpuPower += g.powerW;
      continue;
    }

    if (g.hidden === 'thermal') {
      g.tempC = Math.min(95, g.tempC + (0.8 + rand()) * dt);
      g.util = Math.max(0.2, g.util - 0.04 * dt);
      g.powerW = 320 + g.tempC;
      if (g.tempC > 90 && rand() < 0.15) g.xid = 79;
    } else if (g.hidden === 'ecc') {
      g.eccSbe += Math.floor(rand() * 3);
      if (g.eccSbe > 12 && rand() < 0.2) g.eccDbe += 1;
      g.powerW = 300 + rand() * 40;
    } else if (g.hidden === 'link') {
      g.nvlinkCrc += Math.floor(rand() * 4);
      g.util = Math.max(0.15, 0.55 - g.nvlinkCrc * 0.01);
      g.powerW = 250 + g.util * 120;
    } else if (g.hidden === 'xid') {
      g.xid = g.xid || 13;
      g.util = 0.05;
      g.powerW = 90;
    } else {
      g.util = Math.min(0.95, Math.max(0.25, g.util + (rand() - 0.5) * 0.08));
      g.tempC = Math.max(52, Math.min(78, g.tempC + (rand() - 0.48) * 1.4));
      g.powerW = 200 + g.util * 280;
    }

    const coolingGap = g.tempC - next.coolingSetpoint * 2.2;
    if (coolingGap > 0) g.tempC += 0.05 * dt;
    else g.tempC -= 0.08 * dt;

    gpuPower += g.powerW;
  }

  if (next.auto) {
    for (let i = 0; i < next.gpus.length; i++) {
      const g = next.gpus[i];
      if (g.lastAction === 'none' && probeGpu(g).recommended !== 'none') {
        const acted = applyPolicy(next, g);
        next.gpus = acted.gpus;
        next.events = acted.events;
      }
    }
  }

  const pue = 1.32;
  const lag = 0.12;
  const targetFacility = gpuPower * pue + Math.max(0, (72 - next.coolingSetpoint) * 40);
  next.facilityPowerW = next.facilityPowerW * (1 - lag) + targetFacility * lag;
  next.gpuEnergyKj += (gpuPower * dt) / 1000;
  next.facilityEnergyKj += (next.facilityPowerW * dt) / 1000;
  let alerts = 0;
  for (let i = 0; i < next.gpus.length; i++) {
    if (probeGpu(next.gpus[i]).recommended !== 'none') alerts += 1;
  }
  next.samples.push({ t: next.t, gpuW: gpuPower, facilityW: next.facilityPowerW, alerts: alerts });
  if (next.samples.length > 180) next.samples.shift();
  return next;
}

export function fleetSelfTest(): { name: string; pass: boolean; detail: string }[] {
  const tests: { name: string; pass: boolean; detail: string }[] = [];
  const rand = mulberry32(3);
  let s = createFleet(3);
  for (let i = 0; i < 12; i++) s = tick(s, 1, rand);
  tests.push({
    name: 'Facility energy is not identical to GPU energy',
    pass: s.facilityEnergyKj > s.gpuEnergyKj,
    detail: 'gpu=' + s.gpuEnergyKj.toFixed(2) + ' kJ facility=' + s.facilityEnergyKj.toFixed(2) + ' kJ'
  });
  const hot = s.gpus.find(function (g) { return g.hidden === 'thermal' || g.tempC > 80; }) || s.gpus[0];
  const before = hot.tempC;
  const isolated = act(s, hot.id, 'isolate');
  const g2 = isolated.gpus.find(function (g) { return g.id === hot.id; }) as Gpu;
  tests.push({
    name: 'Isolate zeroes utilization on that GPU',
    pass: g2.isolated && g2.util === 0,
    detail: 'util=' + g2.util + ' isolated=' + String(g2.isolated) + ' tempWas=' + before.toFixed(1)
  });
  const recEcc = probeGpu(Object.assign({}, hot, { hidden: 'ecc', eccDbe: 2, xid: 0, tempC: 70, nvlinkCrc: 0, isolated: false }));
  tests.push({
    name: 'Uncorrectable ECC recommends isolate, not a blind reboot',
    pass: recEcc.recommended === 'isolate',
    detail: recEcc.findings.join('; ')
  });
  return tests;
}
