// Бүх огноог 'YYYY-MM-DD' мөрөөр, Улаанбаатарын цагаар зохицуулна.

export const TIME_ZONE = "Asia/Ulaanbaatar";

const ymd = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function todayUB(now: Date = new Date()): string {
  return ymd.format(now);
}

function toUTC(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUTC(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
  return fromUTC(toUTC(date) + n * 86_400_000);
}

/** b - a, өдрөөр */
export function diffDays(a: string, b: string): number {
  return Math.round((toUTC(b) - toUTC(a)) / 86_400_000);
}

/** 0 = Даваа … 6 = Ням */
export function weekday(date: string): number {
  return (new Date(toUTC(date)).getUTCDay() + 6) % 7;
}

export function mondayOf(date: string): string {
  return addDays(date, -weekday(date));
}

export function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && fromUTC(toUTC(s)) === s;
}

export const WEEKDAYS = ["Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба", "Ням"];
export const WEEKDAYS_SHORT = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];

export function monthLabel(date: string): string {
  return `${Number(date.slice(5, 7))}-р сар`;
}

/** "Даваа · 10-р сарын 5" */
export function longLabel(date: string): string {
  const m = Number(date.slice(5, 7));
  const d = Number(date.slice(8, 10));
  return `${WEEKDAYS[weekday(date)]} · ${m}-р сарын ${d}`;
}

/** "10.05" */
export function shortLabel(date: string): string {
  return `${date.slice(5, 7)}.${date.slice(8, 10)}`;
}

/** "2026.10.05" */
export function fullLabel(date: string): string {
  return date.replaceAll("-", ".");
}
