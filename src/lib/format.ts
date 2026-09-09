const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const mxn0 = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

/** Formatea centavos como pesos: 12345 -> "$123.45" */
export function money(centavos: number, opts: { whole?: boolean } = {}): string {
  const v = centavos / 100;
  return (opts.whole ? mxn0 : mxn).format(v);
}

export function signedMoney(centavos: number): string {
  const s = money(Math.abs(centavos));
  return centavos < 0 ? `−${s}` : `+${s}`;
}

export function cents(price: number): string {
  return `${price}¢`;
}

export function pct(price: number): string {
  return `${price}%`;
}

const dt = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Mexico_City',
});
const dtLong = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Mexico_City',
});

export function when(ts: number): string {
  return dt.format(new Date(ts));
}
export function whenLong(ts: number): string {
  return dtLong.format(new Date(ts));
}

export function relative(ts: number, now = Date.now()): string {
  const diff = ts - now;
  const abs = Math.abs(diff);
  const m = Math.round(abs / 60000);
  const h = Math.round(abs / 3600000);
  const d = Math.round(abs / 86400000);
  let s: string;
  if (m < 60) s = `${m} min`;
  else if (h < 48) s = `${h} h`;
  else s = `${d} días`;
  return diff >= 0 ? `en ${s}` : `hace ${s}`;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
