import { useEffect, useState } from 'react';

export function usePilotJson<T>(path: string): { data: T | null; error: string | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(function () {
    let cancelled = false;
    setLoading(true);
    fetch(path)
      .then(function (r) {
        if (!r.ok) throw new Error(r.status + ' ' + path);
        return r.json();
      })
      .then(function (j) {
        if (!cancelled) {
          setData(j as T);
          setError(null);
        }
      })
      .catch(function (e) {
        if (!cancelled) setError(String(e));
      })
      .finally(function () {
        if (!cancelled) setLoading(false);
      });
    return function () {
      cancelled = true;
    };
  }, [path]);

  return { data, error, loading };
}

export function fmtOpt(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || !isFinite(n)) return '—';
  if (Math.abs(n) >= 100000) return n.toExponential(2);
  return n.toFixed(digits);
}
