"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BigToggle } from "@/components/ui/BigToggle";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Stepper } from "@/components/ui/Stepper";
import { dayStatus, requiredPoses } from "@/lib/completion";
import { fetchDay, fetchPhotosFor, fetchReview, lastMeasures, signUrls } from "@/lib/data";
import { addDays, longLabel, mondayOf } from "@/lib/dates";
import { END, START, TOTAL_DAYS, clampToProgram, dayNumber, daysUntilSummer, inProgram, planFor } from "@/lib/program";
import { POSES, reviewHasContent, type DayRow, type PhotoRow } from "@/lib/types";
import { useDaySaver } from "@/lib/useDaySaver";
import { useToday } from "@/lib/useToday";
import { Celebration } from "./Celebration";
import { MorningBanner } from "./MorningBanner";
import { PlanCard } from "./PlanCard";
import { RunEntry } from "./RunEntry";

const HABITS: { key: "no_alcohol" | "reading" | "skincare" | "phone_free_sleep"; label: string; hint?: string }[] = [
  { key: "no_alcohol", label: "Архи уугаагүй" },
  { key: "reading", label: "15 мин ном уншсан" },
  { key: "skincare", label: "Арьс арчилгаа" },
  { key: "phone_free_sleep", label: "Утасгүй унтсан" },
];

export function dayHref(date: string, today: string) {
  return date === today ? "/" : `/day/${date}`;
}

export function DayView({ date: dateProp }: { date?: string }) {
  const today = useToday();
  if (!today) return <div className="pt-safe"><Skeleton /></div>;
  const date = dateProp ?? clampToProgram(today);
  // Өдөр солигдоход (шөнө дунд) шинээр ачаална
  return <DayEditor key={`${today}|${date}`} date={date} today={today} />;
}

function DayEditor({ date, today }: { date: string; today: string }) {
  const router = useRouter();
  const isToday = date === today;
  const plan = planFor(date);
  const needed = requiredPoses(date);

  const [day, setDay] = useState<DayRow | null>(null);
  const dayRef = useRef<DayRow | null>(null);
  const [prev, setPrev] = useState<{ weight: number | null; waist: number | null }>({ weight: null, waist: null });
  const [hasReview, setHasReview] = useState(false);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const { schedule, flush, error: saveError } = useDaySaver();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [d, m, r, p] = await Promise.all([
          fetchDay(date),
          lastMeasures(date),
          plan.kind === "rest" ? fetchReview(mondayOf(date)) : Promise.resolve(null),
          fetchPhotosFor(date),
        ]);
        if (!alive) return;
        const reviewed = reviewHasContent(r);
        let loaded = d;
        // Жишээ нь: Ням гарагт дүгнэлтээ бичээд буцаж ирэхэд өдөр бүрэн болсон байж болно
        if (!d.completed_at && dayStatus(date, today, d, { hasReview: reviewed, poses: p.map((x) => x.pose) }) === "complete") {
          loaded = { ...d, completed_at: new Date().toISOString() };
          schedule(loaded, 0);
          setCelebrate(true);
        }
        dayRef.current = loaded;
        setDay(loaded);
        setPrev(m);
        setHasReview(reviewed);
        setPhotos(p);
        if (p.length) setUrls(await signUrls(p.map((x) => x.storage_path)));
      } catch (e) {
        if (alive) setLoadError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [date, today, plan.kind, schedule]);

  const poses = useMemo(() => photos.map((p) => p.pose), [photos]);
  const status = useMemo(() => (day ? dayStatus(date, today, day, { hasReview, poses }) : "pending"), [day, date, today, hasReview, poses]);

  const update = (patch: Partial<DayRow>, delay = 250) => {
    const cur = dayRef.current;
    if (!cur) return;
    let next = { ...cur, ...patch };
    // Бүрэн болмогц нэг удаа тэмдэглэж, animation үзүүлнэ
    if (!next.completed_at && dayStatus(date, today, next, { hasReview, poses }) === "complete") {
      next = { ...next, completed_at: new Date().toISOString() };
      delay = 0;
      setCelebrate(true);
    }
    dayRef.current = next;
    setDay(next);
    schedule(next, delay);
  };

  const goto = (d: string) => {
    flush();
    router.push(dayHref(d, today));
  };
  const canPrev = date > START;
  const canNext = date < today && date < END;
  const n = dayNumber(date);

  return (
    <div className="pt-safe">
      {/* Огноо */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Өмнөх өдөр"
          disabled={!canPrev}
          onClick={() => goto(addDays(date, -1))}
          className="flex h-12 w-12 items-center justify-center rounded-full text-muted active:bg-surface-2 disabled:opacity-30"
        >
          <Icon name="chevronLeft" size={26} />
        </button>
        <button type="button" onClick={() => !isToday && goto(today)} className="text-center">
          <div className="text-[15px] font-medium">{longLabel(date)}</div>
          {!isToday && <div className="text-[12px] font-medium text-accent-text">Засварлаж байна · Өнөөдөр рүү</div>}
        </button>
        <button
          type="button"
          aria-label="Дараагийн өдөр"
          disabled={!canNext}
          onClick={() => goto(addDays(date, 1))}
          className="flex h-12 w-12 items-center justify-center rounded-full text-muted active:bg-surface-2 disabled:opacity-30"
        >
          <Icon name="chevronRight" size={26} />
        </button>
      </div>

      {/* Тоолуур */}
      <div className="mt-4 mb-5 text-center">
        <div className="tabular text-[52px] leading-none font-bold tracking-tight">
          Өдөр {n}
          <span className="text-[24px] font-semibold text-muted"> / {TOTAL_DAYS}</span>
        </div>
        <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(n / TOTAL_DAYS) * 100}%` }} />
        </div>
        <div className="mt-3 text-[15px] text-muted">
          {today >= "2027-06-01" ? "Зун ирлээ!" : <>Зун хүртэл <span className="tabular font-semibold text-text">{daysUntilSummer(today)}</span> өдөр</>}
        </div>
      </div>

      {loadError && <ErrorNote text={loadError} />}
      {saveError && <ErrorNote text={`Хадгалж чадсангүй: ${saveError}`} action={{ label: "Дахин оролдох", onClick: flush }} />}

      {isToday && inProgram(addDays(today, -1)) && <MorningBanner date={addDays(today, -1)} />}

      <PlanCard plan={plan} status={status} isToday={isToday} />

      {plan.kind === "rest" && (
        <Link
          href={`/review/${mondayOf(date)}`}
          className="mt-3 flex min-h-[60px] items-center gap-3 rounded-2xl bg-accent px-4 py-3 font-semibold text-accent-ink active:opacity-90"
        >
          <Icon name="pen" />
          <span className="flex-1">{hasReview ? "Долоо хоногийн дүгнэлт ✓" : "Долоо хоногийн дүгнэлт бичих"}</span>
          <Icon name="chevronRight" />
        </Link>
      )}

      {!day ? (
        <Skeleton />
      ) : (
        <>
          <Card className="mt-3 divide-y divide-border overflow-hidden">
            {plan.kind === "crossfit" && (
              <BigToggle label="CrossFit явсан" hint="06:00" on={day.crossfit} onChange={(v) => update({ crossfit: v })} />
            )}
            {(plan.kind === "run" || plan.kind === "walk") && (
              <RunEntry
                label={plan.kind === "walk" ? "Алхалт" : "Гүйлт"}
                minutes={day.run_minutes}
                km={day.run_km}
                onChange={(p) => update(p, 600)}
              />
            )}
            {HABITS.map((h) => (
              <BigToggle key={h.key} label={h.label} on={day[h.key]} onChange={(v) => update({ [h.key]: v })} />
            ))}
          </Card>

          <Card className="mt-3 divide-y divide-border">
            <Stepper
              label="Жин"
              unit="кг"
              value={day.weight_kg}
              fallback={prev.weight}
              step={0.1}
              decimals={1}
              onChange={(v) => update({ weight_kg: v }, 700)}
            />
            <Stepper
              label="Бүсэлхий"
              unit="см"
              value={day.waist_cm}
              fallback={prev.waist}
              step={0.5}
              decimals={1}
              onChange={(v) => update({ waist_cm: v }, 700)}
            />
          </Card>

          <Card className="mt-3 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-medium">Явцын зураг</span>
              <span className="text-[13px] text-muted">{needed.length === 3 ? "Ням: 3 байрлал" : "Урдаас 1 заавал"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {POSES.map((p) => {
                const ph = photos.find((x) => x.pose === p.id);
                const url = ph && urls[ph.storage_path];
                const required = needed.includes(p.id);
                return (
                  <Link
                    key={p.id}
                    href={`/camera?date=${date}&pose=${p.id}`}
                    onClick={() => flush()}
                    className={`relative flex aspect-[3/4] flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-2 border-dashed active:scale-[0.98] ${
                      url ? "border-transparent" : required ? "border-accent bg-surface-2 text-text" : "border-border bg-surface-2 text-muted"
                    }`}
                  >
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={`${p.label} зураг`} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <Icon name="camera" size={26} />
                    )}
                    <span
                      className={`relative z-10 text-[13px] font-medium ${url ? "absolute bottom-1.5 rounded-full bg-black/55 px-2 py-0.5 text-white" : ""}`}
                    >
                      {p.label}
                    </span>
                    {!url && <span className="relative z-10 text-[11px] text-muted">{required ? "заавал" : "заавал биш"}</span>}
                  </Link>
                );
              })}
            </div>
          </Card>
        </>
      )}

      <Celebration show={celebrate} dayNumber={n} onDone={() => setCelebrate(false)} />
    </div>
  );
}

function ErrorNote({ text, action }: { text: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-[14px]">
      <span className="flex-1">{text}</span>
      {action && (
        <button type="button" onClick={action.onClick} className="font-semibold text-accent-text">
          {action.label}
        </button>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mt-3 space-y-3" aria-hidden>
      <div className="h-[300px] animate-pulse rounded-2xl bg-surface-2" />
      <div className="h-[130px] animate-pulse rounded-2xl bg-surface-2" />
    </div>
  );
}
