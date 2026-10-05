"use client";

import { useMemo, useRef, useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { fullLabel } from "@/lib/dates";
import { POSES, type PhotoRow, type Pose } from "@/lib/types";

export function BeforeAfter({ photos, urls }: { photos: PhotoRow[]; urls: Record<string, string> }) {
  const available = useMemo(() => POSES.filter((p) => photos.filter((x) => x.pose === p.id).length >= 2), [photos]);
  const [pose, setPose] = useState<Pose | null>(null);
  const active = pose && available.some((p) => p.id === pose) ? pose : available[0]?.id;
  const [pos, setPos] = useState(50);
  const boxRef = useRef<HTMLDivElement>(null);

  const list = photos.filter((p) => p.pose === active);
  const before = list[0];
  const after = list.at(-1);

  const move = (clientX: number) => {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <section>
      <SectionTitle
        right={
          available.length > 1 && (
            <div className="flex gap-1">
              {available.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPose(p.id)}
                  className={`h-8 rounded-full px-3 text-[13px] font-semibold ${active === p.id ? "bg-text text-bg" : "bg-surface-2 text-muted"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )
        }
      >
        Өмнө / Одоо
      </SectionTitle>
      <Card className="overflow-hidden">
        {!before || !after || before.id === after.id ? (
          <p className="px-4 py-10 text-center text-[14px] text-muted">Ижил байрлалаар 2 зураг авсны дараа энд харьцуулна.</p>
        ) : (
          <div
            ref={boxRef}
            className="relative aspect-[3/4] w-full touch-none select-none"
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              move(e.clientX);
            }}
            onPointerMove={(e) => e.buttons && move(e.clientX)}
            role="slider"
            aria-label="Өмнө ба одоог харьцуулах"
            aria-valuenow={Math.round(pos)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 5));
              if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 5));
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urls[after.storage_path]} alt="Одоо" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
            <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urls[before.storage_path]} alt="Өмнө" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
            </div>
            <div className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }}>
              <div className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <path d="m9 18-6-6 6-6M15 6l6 6-6 6" />
                </svg>
              </div>
            </div>
            <span className="absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[12px] font-medium text-white">
              {fullLabel(before.date)}
            </span>
            <span className="absolute top-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[12px] font-medium text-white">
              {fullLabel(after.date)}
            </span>
          </div>
        )}
      </Card>
    </section>
  );
}
