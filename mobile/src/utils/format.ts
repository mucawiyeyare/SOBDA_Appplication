import { useEffect, useState } from 'react';

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

export const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

export function fmtCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m ${String(sec).padStart(2, '0')}s`;
}

/** Seconds left until `pendingUntil`, ticking every second. Stops ticking at zero. */
export function useCountdown(pendingUntil?: string): number {
  const calc = () => (pendingUntil ? Math.max(0, Math.floor((new Date(pendingUntil).getTime() - Date.now()) / 1000)) : 0);
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    setLeft(calc());
    if (!pendingUntil) return;
    const t = setInterval(() => {
      const v = calc();
      setLeft(v);
      if (v === 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingUntil]);
  return left;
}
