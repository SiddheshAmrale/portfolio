export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function expovariate(rand: () => number, lambda: number): number {
  const u = Math.max(rand(), 1e-12);
  return -Math.log(u) / lambda;
}

export function gaussian(rand: () => number): number {
  const u1 = Math.max(rand(), 1e-12);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function lognormalInt(rand: () => number, mean: number, sigma = 0.35): number {
  const z = gaussian(rand);
  const m = Math.log(Math.max(mean, 1)) - 0.5 * sigma * sigma;
  return Math.max(1, Math.round(Math.exp(m + sigma * z)));
}
