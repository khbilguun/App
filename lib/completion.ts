import { planFor } from "./program";
import type { DayRow } from "./types";

export type DayStatus = "complete" | "partial" | "missed" | "pending" | "future";

export interface CheckItem {
  key: string;
  done: boolean;
}

/** Тухайн өдрийн шаардлагатай зүйлс ба биелсэн эсэх */
export function requiredItems(date: string, day: DayRow | undefined, hasReview: boolean): CheckItem[] {
  const kind = planFor(date).kind;
  const items: CheckItem[] = [];
  if (kind === "crossfit") items.push({ key: "crossfit", done: !!day?.crossfit });
  if (kind === "run" || kind === "walk") items.push({ key: "run", done: (day?.run_minutes ?? 0) > 0 });
  if (kind === "rest") items.push({ key: "review", done: hasReview });
  items.push(
    { key: "no_alcohol", done: !!day?.no_alcohol },
    { key: "reading", done: !!day?.reading },
    { key: "skincare", done: !!day?.skincare },
    { key: "phone_free_sleep", done: !!day?.phone_free_sleep },
  );
  return items;
}

export function dayStatus(date: string, today: string, day: DayRow | undefined, hasReview: boolean): DayStatus {
  if (date > today) return "future";
  const items = requiredItems(date, day, hasReview);
  const done = items.filter((i) => i.done).length;
  if (done === items.length) return "complete";
  if (done > 0) return "partial";
  return date === today ? "pending" : "missed";
}
