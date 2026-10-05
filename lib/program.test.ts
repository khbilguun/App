import { describe, expect, it } from "vitest";
import { dayStatus } from "./completion";
import { addDays, diffDays, mondayOf, todayUB, weekday } from "./dates";
import { END, START, TOTAL_DAYS, dayNumber, daysUntilSummer, planFor, plannedCounts, weekNumber } from "./program";
import { emptyDay } from "./types";

describe("dates", () => {
  it("weekday / monday", () => {
    expect(weekday("2026-10-05")).toBe(0);
    expect(weekday("2026-10-11")).toBe(6);
    expect(mondayOf("2026-10-11")).toBe("2026-10-05");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
    expect(diffDays("2026-10-05", "2027-06-01")).toBe(239);
  });
  it("УБ цагаар өнөөдрийг тооцно", () => {
    // 2026-10-04 17:00 UTC = 2026-10-05 01:00 УБ
    expect(todayUB(new Date("2026-10-04T17:00:00Z"))).toBe("2026-10-05");
  });
});

describe("program", () => {
  it("239 өдөр", () => {
    expect(TOTAL_DAYS).toBe(239);
    expect(dayNumber(START)).toBe(1);
    expect(dayNumber(END)).toBe(239);
    expect(daysUntilSummer(START)).toBe(239);
    expect(weekNumber(START)).toBe(1);
    expect(weekNumber(END)).toBe(35);
  });
  it("төлөвлөгөө", () => {
    expect(planFor("2026-10-05").kind).toBe("crossfit");
    expect(planFor("2026-10-06").kind).toBe("run");
    expect(planFor("2026-10-10").kind).toBe("walk");
    expect(planFor("2026-10-17").kind).toBe("walk");
    expect(planFor("2026-10-24").kind).toBe("run");
    expect(planFor("2026-10-11").kind).toBe("rest");
  });
  it("нийт төлөвлөгөөт тоо", () => {
    expect(plannedCounts()).toEqual({ crossfit: 103, run: 102, days: 239, sundays: 34 });
    expect(plannedCounts("2026-10-11")).toEqual({ crossfit: 3, run: 3, days: 7, sundays: 1 });
  });
});

describe("dayStatus", () => {
  const today = "2026-10-07";
  it("алдсан, хүлээгдэж буй, ирээдүй", () => {
    expect(dayStatus("2026-10-05", today, undefined, false)).toBe("missed");
    expect(dayStatus(today, today, undefined, false)).toBe("pending");
    expect(dayStatus("2026-10-08", today, undefined, false)).toBe("future");
  });
  it("бүрэн / хагас", () => {
    const d = { ...emptyDay("2026-10-06"), no_alcohol: true, reading: true, skincare: true, phone_free_sleep: true };
    expect(dayStatus(d.date, today, d, false)).toBe("partial");
    expect(dayStatus(d.date, today, { ...d, run_minutes: 25 }, false)).toBe("complete");
    const sun = { ...d, date: "2026-10-11" };
    expect(dayStatus(sun.date, "2026-10-11", sun, false)).toBe("partial");
    expect(dayStatus(sun.date, "2026-10-11", sun, true)).toBe("complete");
  });
});
