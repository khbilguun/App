"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ReviewForm } from "@/components/review/ReviewForm";
import { Card, PageHeader, SectionTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { fetchReviews } from "@/lib/data";
import { addDays, mondayOf, shortLabel, weekday } from "@/lib/dates";
import { END, START, clampToProgram, weekNumber } from "@/lib/program";
import { reviewHasContent, type ReviewRow } from "@/lib/types";
import { useToday } from "@/lib/useToday";

const QS: [keyof ReviewRow, string][] = [
  ["went_well", "Юу биелэв?"],
  ["obstacles", "Юу саад болов?"],
  ["change_next", "Юуг өөрчлөх вэ?"],
];

export default function ReviewPage() {
  const today = useToday();
  if (!today) return <PageHeader title="Дүгнэлт" />;
  return <Reviews key={today} today={today} />;
}

function Reviews({ today }: { today: string }) {
  const thisWeek = mondayOf(clampToProgram(today));
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews().then(setReviews).catch(() => setReviews([]));
  }, []);

  const past = (reviews ?? []).filter((r) => r.week_start !== thisWeek && reviewHasContent(r));
  // Бичээгүй өнгөрсөн долоо хоногууд
  const written = new Set((reviews ?? []).filter(reviewHasContent).map((r) => r.week_start));
  const missing: string[] = [];
  for (let m = mondayOf(START); m < thisWeek && m <= END; m = addDays(m, 7)) if (!written.has(m)) missing.push(m);

  return (
    <div>
      <PageHeader title="Дүгнэлт" />
      {weekday(today) !== 6 && today >= START && today <= END && (
        <p className="mb-3 text-[14px] text-muted">Ням гарагт бичихэд зориулсан. Хүссэн үедээ эхэлж болно.</p>
      )}
      <ReviewForm key={thisWeek} weekStart={thisWeek} />

      {missing.length > 0 && (
        <div className="mt-6">
          <SectionTitle>Бичээгүй</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {missing.map((m) => (
              <Link key={m} href={`/review/${m}`} className="flex h-10 items-center rounded-full bg-surface-2 px-4 text-[14px] font-medium">
                7 хоног {weekNumber(m)}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <SectionTitle>Өмнөх дүгнэлтүүд</SectionTitle>
        {reviews === null ? (
          <div className="h-24 animate-pulse rounded-2xl bg-surface-2" />
        ) : past.length === 0 ? (
          <Card className="px-4 py-8 text-center text-[14px] text-muted">Одоогоор өмнөх дүгнэлт алга.</Card>
        ) : (
          <div className="space-y-2">
            {past.map((r) => {
              const isOpen = open === r.week_start;
              return (
                <Card key={r.week_start} className="overflow-hidden">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : r.week_start)}
                    className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <div className="flex-1">
                      <div className="font-semibold">Долоо хоног {weekNumber(r.week_start)}</div>
                      <div className="text-[13px] text-muted">
                        {shortLabel(r.week_start)}–{shortLabel(addDays(r.week_start, 6))}
                      </div>
                    </div>
                    <Icon name="chevronRight" className={`text-muted transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="space-y-3 border-t border-border px-4 py-4">
                      {QS.map(([k, label]) => (
                        <div key={k}>
                          <div className="text-[13px] font-semibold text-muted">{label}</div>
                          <p className="mt-1 whitespace-pre-wrap">{(r[k] as string) || "—"}</p>
                        </div>
                      ))}
                      <Link href={`/review/${r.week_start}`} className="inline-flex h-10 items-center gap-1 text-[14px] font-semibold text-accent-text">
                        <Icon name="pen" size={16} /> Засах
                      </Link>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
