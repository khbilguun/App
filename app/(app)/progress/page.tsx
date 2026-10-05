"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/Card";
import { BeforeAfter } from "@/components/progress/BeforeAfter";
import { Heatmap } from "@/components/progress/Heatmap";
import { MeasureChart } from "@/components/progress/MeasureChart";
import { PhotoTimeline } from "@/components/progress/PhotoTimeline";
import { PlanVsActual } from "@/components/progress/PlanVsActual";
import { fetchDays, fetchPhotos, fetchReviews, signUrls } from "@/lib/data";
import { useToday } from "@/lib/useToday";
import { reviewHasContent, type DayRow, type PhotoRow, type ReviewRow } from "@/lib/types";

export default function ProgressPage() {
  const today = useToday();
  const [days, setDays] = useState<DayRow[] | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchDays(), fetchPhotos(), fetchReviews()])
      .then(async ([d, p, r]) => {
        setDays(d);
        setPhotos(p);
        setReviews(r);
        if (p.length) setUrls(await signUrls(p.map((x) => x.storage_path)));
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const byDate = useMemo(() => new Map((days ?? []).map((d) => [d.date, d])), [days]);
  const reviewWeeks = useMemo(() => new Set(reviews.filter(reviewHasContent).map((r) => r.week_start)), [reviews]);

  return (
    <div>
      <PageHeader title="Явц" />
      {error && <p className="mb-3 rounded-xl bg-surface-2 px-4 py-3 text-[14px]">{error}</p>}
      {!days || !today ? (
        <div className="space-y-4" aria-hidden>
          {[220, 260, 300].map((h) => (
            <div key={h} className="animate-pulse rounded-2xl bg-surface-2" style={{ height: h }} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <MeasureChart days={days} />
          <BeforeAfter photos={photos} urls={urls} />
          <PlanVsActual days={days} today={today} />
          <Heatmap byDate={byDate} reviewWeeks={reviewWeeks} today={today} />
          <PhotoTimeline
            photos={photos}
            urls={urls}
            onDeleted={(id) => setPhotos((ps) => ps.filter((p) => p.id !== id))}
          />
        </div>
      )}
    </div>
  );
}
