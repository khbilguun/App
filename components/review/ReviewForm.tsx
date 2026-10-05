"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { dayStatus } from "@/lib/completion";
import { fetchDaysBetween, fetchReview, saveReview } from "@/lib/data";
import { addDays, shortLabel } from "@/lib/dates";
import { inProgram, planFor, weekNumber } from "@/lib/program";
import type { DayRow, ReviewRow } from "@/lib/types";
import { useToday } from "@/lib/useToday";

const QUESTIONS: { key: "went_well" | "obstacles" | "change_next"; label: string; placeholder: string }[] = [
  { key: "went_well", label: "Юу биелэв?", placeholder: "Энэ долоо хоногт сайн болсон зүйлс…" },
  { key: "obstacles", label: "Юу саад болов?", placeholder: "Юу хэцүү байв, яагаад…" },
  { key: "change_next", label: "Ирэх долоо хоногт юуг өөрчлөх вэ?", placeholder: "Нэг тодорхой өөрчлөлт…" },
];

// field-sizing-ийг дэмждэггүй Safari-д зориулсан auto-grow
function grow(t: HTMLTextAreaElement | null) {
  if (!t) return;
  t.style.height = "auto";
  t.style.height = `${t.scrollHeight}px`;
}

export function ReviewForm({ weekStart }: { weekStart: string }) {
  const today = useToday() ?? "";
  const [review, setReview] = useState<ReviewRow | null>(null);
  const [days, setDays] = useState<DayRow[]>([]);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<ReviewRow | null>(null);
  const weekEnd = addDays(weekStart, 6);

  useEffect(() => {
    Promise.all([fetchReview(weekStart), fetchDaysBetween(weekStart, weekEnd)])
      .then(([r, d]) => {
        setReview(r ?? { week_start: weekStart, went_well: "", obstacles: "", change_next: "" });
        setDays(d);
      })
      .catch(() => setState("error"));
  }, [weekStart, weekEnd]);

  const persist = async () => {
    if (!latest.current) return;
    setState("saving");
    try {
      await saveReview(latest.current);
      setState("saved");
    } catch {
      setState("error");
    }
  };

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        if (latest.current) saveReview(latest.current).catch(() => {});
      }
    },
    [],
  );

  const change = (key: keyof ReviewRow, value: string) => {
    setReview((r) => {
      const next = { ...(r as ReviewRow), [key]: value };
      latest.current = next;
      return next;
    });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      persist();
    }, 800);
  };

  // Долоо хоногийн товч статистик
  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter(inProgram);
  const byDate = new Map(days.map((d) => [d.date, d]));
  const complete = dates.filter((d) => dayStatus(d, today, byDate.get(d), true) === "complete").length;
  const cf = dates.filter((d) => planFor(d).kind === "crossfit");
  const rn = dates.filter((d) => ["run", "walk"].includes(planFor(d).kind));
  const cfDone = cf.filter((d) => byDate.get(d)?.crossfit).length;
  const rnDone = rn.filter((d) => (byDate.get(d)?.run_minutes ?? 0) > 0).length;
  const km = days.reduce((s, d) => s + (d.run_km ?? 0), 0);

  return (
    <div>
      <div className="mb-4">
        <div className="text-[13px] text-muted">
          Долоо хоног {weekNumber(weekStart)} · {shortLabel(weekStart)}–{shortLabel(weekEnd)}
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {[
            { v: `${complete}/${dates.length}`, l: "бүрэн өдөр" },
            { v: `${cfDone}/${cf.length}`, l: "CrossFit" },
            { v: `${rnDone}/${rn.length}`, l: "гүйлт" },
            { v: km.toFixed(1), l: "км" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-surface-2 px-2 py-2 text-center">
              <div className="tabular text-[17px] font-bold">{s.v}</div>
              <div className="text-[11px] text-muted">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {!review ? (
        <div className="h-80 animate-pulse rounded-2xl bg-surface-2" />
      ) : (
        <div className="space-y-3">
          {QUESTIONS.map((q) => (
            <Card key={q.key} className="p-4">
              <label className="block">
                <span className="mb-2 block font-semibold">{q.label}</span>
                <textarea
                  value={review[q.key] ?? ""}
                  onChange={(e) => change(q.key, e.target.value)}
                  ref={grow}
                  onInput={(e) => grow(e.currentTarget)}
                  placeholder={q.placeholder}
                  rows={3}
                  className="min-h-[84px] w-full resize-none bg-transparent leading-relaxed outline-none placeholder:text-muted/70"
                />
              </label>
            </Card>
          ))}
          <p className="h-5 text-center text-[13px] text-muted" aria-live="polite">
            {state === "saving" ? "Хадгалж байна…" : state === "saved" ? "Хадгалсан ✓" : state === "error" ? "Хадгалж чадсангүй — интернэтээ шалгана уу" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
