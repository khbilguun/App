import { planFor } from "./program";
import { weekday } from "./dates";
import type { DayRow, Pose } from "./types";

export type DayStatus = "complete" | "partial" | "missed" | "pending" | "future";

export interface CheckItem {
  key: string;
  done: boolean;
}

export interface DayExtras {
  /** Тухайн долоо хоногийн дүгнэлт бичигдсэн эсэх (Ням гарагт хэрэгтэй) */
  hasReview: boolean;
  /** Тухайн өдөр авсан зургийн байрлалууд */
  poses: Iterable<Pose>;
}

/** Өдөр бүр урдаас 1, Ням гарагт урд/хажуу/ар 3 зураг заавал */
export function requiredPoses(date: string): Pose[] {
  return weekday(date) === 6 ? ["front", "side", "back"] : ["front"];
}

/** Тухайн өдрийн шаардлагатай зүйлс ба биелсэн эсэх */
export function requiredItems(date: string, day: DayRow | undefined, extras: DayExtras): CheckItem[] {
  const kind = planFor(date).kind;
  const taken = new Set(extras.poses);
  const items: CheckItem[] = [];
  if (kind === "crossfit") items.push({ key: "crossfit", done: !!day?.crossfit });
  if (kind === "run" || kind === "walk") items.push({ key: "run", done: (day?.run_minutes ?? 0) > 0 });
  if (kind === "rest") items.push({ key: "review", done: extras.hasReview });
  items.push(
    { key: "no_alcohol", done: !!day?.no_alcohol },
    { key: "reading", done: !!day?.reading },
    { key: "skincare", done: !!day?.skincare },
    { key: "phone_free_sleep", done: !!day?.phone_free_sleep },
  );
  for (const p of requiredPoses(date)) items.push({ key: `photo_${p}`, done: taken.has(p) });
  return items;
}

export function dayStatus(date: string, today: string, day: DayRow | undefined, extras: DayExtras): DayStatus {
  if (date > today) return "future";
  const items = requiredItems(date, day, extras);
  const done = items.filter((i) => i.done).length;
  if (done === items.length) return "complete";
  if (done > 0) return "partial";
  return date === today ? "pending" : "missed";
}
