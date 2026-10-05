import { addDays, diffDays, mondayOf, weekday } from "./dates";

export const START = "2026-10-05";
export const END = "2027-05-31";
export const SUMMER = "2027-06-01";
export const TOTAL_DAYS = diffDays(START, END) + 1; // 239

export type DayKind = "crossfit" | "run" | "walk" | "rest";

export interface Plan {
  kind: DayKind;
  title: string;
  detail?: string;
}

export function inProgram(date: string): boolean {
  return date >= START && date <= END;
}

export function clampToProgram(date: string): string {
  if (date < START) return START;
  if (date > END) return END;
  return date;
}

/** 1-ээс 239 */
export function dayNumber(date: string): number {
  return diffDays(START, date) + 1;
}

export function dateOfDay(n: number): string {
  return addDays(START, n - 1);
}

/** 1-ээс 35 */
export function weekNumber(date: string): number {
  return Math.floor(diffDays(START, mondayOf(date)) / 7) + 1;
}

export function daysUntilSummer(today: string): number {
  return Math.max(0, diffDays(today, SUMMER));
}

export function planFor(date: string): Plan {
  const wd = weekday(date);
  if (wd === 0 || wd === 2 || wd === 4) {
    return { kind: "crossfit", title: "CrossFit", detail: "06:00" };
  }
  if (wd === 6) return { kind: "rest", title: "Амралт", detail: "дүгнэлт" };
  // Эхний 2 долоо хоногийн Бямба гарагт алхана
  if (wd === 5 && dayNumber(date) <= 14) return { kind: "walk", title: "Алхалт" };
  return { kind: "run", title: "Гүйлт" };
}

export function programDates(): string[] {
  return Array.from({ length: TOTAL_DAYS }, (_, i) => addDays(START, i));
}

export interface PlannedCounts {
  crossfit: number;
  run: number; // алхалтыг оруулна
  days: number;
  sundays: number;
}

/** START-аас `upTo` (оролцуулан) хүртэлх төлөвлөгөөт тоо */
export function plannedCounts(upTo: string = END): PlannedCounts {
  const c: PlannedCounts = { crossfit: 0, run: 0, days: 0, sundays: 0 };
  const last = upTo > END ? END : upTo;
  for (let d = START; d <= last; d = addDays(d, 1)) {
    const k = planFor(d).kind;
    c.days++;
    if (k === "crossfit") c.crossfit++;
    else if (k === "rest") c.sundays++;
    else c.run++;
  }
  return c;
}
