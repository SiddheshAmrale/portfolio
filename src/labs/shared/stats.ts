export function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const a = values.slice().sort(function (x, y) {
    return x - y;
  });
  const idx = (p / 100) * (a.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return a[lo];
  return a[lo] * (hi - idx) + a[hi] * (idx - lo);
}

export function mean(values: number[]): number {
  if (!values.length) return 0;
  let s = 0;
  for (let i = 0; i < values.length; i++) s += values[i];
  return s / values.length;
}

export function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  let v = 0;
  for (let i = 0; i < values.length; i++) {
    const d = values[i] - m;
    v += d * d;
  }
  return Math.sqrt(v / (values.length - 1));
}

export function fmtMs(n: number): string {
  if (!isFinite(n)) return '—';
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(2) + ' s';
  return n.toFixed(1) + ' ms';
}

export function fmtNum(n: number, digits = 1): string {
  if (!isFinite(n)) return '—';
  return n.toFixed(digits);
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString();
}

export function fmtPct(n: number): string {
  if (!isFinite(n)) return '—';
  return (n * 100).toFixed(1) + '%';
}

export function meanStdev(values: number[]): { mean: number; stdev: number; n: number } {
  return { mean: mean(values), stdev: stdev(values), n: values.length };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
