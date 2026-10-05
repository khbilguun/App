"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { dayStatus, type DayStatus } from "@/lib/completion";
import { WEEKDAYS_SHORT, addDays, fullLabel, monthLabel, mondayOf } from "@/lib/dates";
import { END, START, inProgram } from "@/lib/program";
import type { DayRow, Pose } from "@/lib/types";

const CELL: Record<DayStatus, string> = {
  complete: "bg-accent",
  partial: "bg-accent/40",
  missed: "bg-missed",
  pending: "bg-surface ring-2 ring-inset ring-accent",
  future: "bg-future ring-1 ring-inset ring-border",
};

const LABEL: Record<DayStatus, string> = {
  complete: "бүрэн",
  partial: "хагас",
  missed: "алдсан",
  pending: "өнөөдөр",
  future: "удахгүй",
};

export function Heatmap({
  byDate,
  posesByDate,
  reviewWeeks,
  today,
}: {
  byDate: Map<string, DayRow>;
  posesByDate: Map<string, Pose[]>;
  reviewWeeks: Set<string>;
  today: string;
}) {
  const statusOf = useCallback(
    (d: string) => dayStatus(d, today, byDate.get(d), { hasReview: reviewWeeks.has(mondayOf(d)), poses: posesByDate.get(d) ?? [] }),
    [today, byDate, reviewWeeks, posesByDate],
  );
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const weeks = useMemo(() => {
    const out: { monday: string; cells: (string | null)[] }[] = [];
    for (let m = mondayOf(START); m <= END; m = addDays(m, 7)) {
      out.push({ monday: m, cells: Array.from({ length: 7 }, (_, i) => (inProgram(addDays(m, i)) ? addDays(m, i) : null)) });
    }
    return out;
  }, []);

  const counts = useMemo(() => {
    const c = { complete: 0, partial: 0, missed: 0 };
    for (const w of weeks)
      for (const d of w.cells) {
        if (!d || d > today) continue;
        const s = statusOf(d);
        if (s in c) c[s as keyof typeof c]++;
      }
    return c;
  }, [weeks, statusOf, today]);

  useEffect(() => {
    const el = scrollRef.current?.querySelector<HTMLElement>("[data-today]");
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  }, []);

  return (
    <section>
      <SectionTitle>Календарь</SectionTitle>
      <Card className="p-4">
        <div className="mb-3 flex gap-4 text-[13px]">
          <span><b className="tabular">{counts.complete}</b> <span className="text-muted">бүрэн</span></span>
          <span><b className="tabular">{counts.partial}</b> <span className="text-muted">хагас</span></span>
          <span><b className="tabular">{counts.missed}</b> <span className="text-muted">алдсан</span></span>
        </div>
        <div className="flex gap-2">
          <div className="flex shrink-0 flex-col gap-[3px] pt-5">
            {WEEKDAYS_SHORT.map((w) => (
              <span key={w} className="flex h-[22px] items-center text-[10px] text-muted">{w}</span>
            ))}
          </div>
          <div ref={scrollRef} className="no-scrollbar overflow-x-auto">
            <div className="flex gap-[3px]">
              {weeks.map((w, wi) => {
                const first = w.cells.find(Boolean)!;
                const prevFirst = wi > 0 ? weeks[wi - 1].cells.find(Boolean)! : null;
                const showMonth = !prevFirst || first.slice(5, 7) !== prevFirst.slice(5, 7);
                return (
                  <div key={w.monday} className="flex flex-col gap-[3px]">
                    <span className="h-[17px] text-[10px] whitespace-nowrap text-muted">{showMonth ? monthLabel(first) : ""}</span>
                    {w.cells.map((d, i) => {
                      if (!d) return <span key={i} className="h-[22px] w-[22px]" />;
                      const s = statusOf(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          data-today={d === today ? "" : undefined}
                          disabled={d > today}
                          onClick={() => router.push(d === today ? "/" : `/day/${d}`)}
                          aria-label={`${fullLabel(d)} — ${LABEL[s]}`}
                          className={`h-[22px] w-[22px] rounded-[5px] ${CELL[s]}`}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
          {(["complete", "partial", "missed", "future"] as DayStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-[3px] ${CELL[s]}`} />
              {LABEL[s]}
            </span>
          ))}
        </div>
      </Card>
    </section>
  );
}
