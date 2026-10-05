"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { deletePhoto } from "@/lib/data";
import { fullLabel, monthLabel, shortLabel } from "@/lib/dates";
import { dayNumber } from "@/lib/program";
import { POSES, type PhotoRow } from "@/lib/types";

const poseLabel = (id: string) => POSES.find((p) => p.id === id)?.label ?? id;

export function PhotoTimeline({
  photos,
  urls,
  onDeleted,
}: {
  photos: PhotoRow[];
  urls: Record<string, string>;
  onDeleted: (id: string) => void;
}) {
  const [open, setOpen] = useState<PhotoRow | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Шинэ нь дээрээ, сараар бүлэглэнэ
  const groups = useMemo(() => {
    const m = new Map<string, PhotoRow[]>();
    for (const p of [...photos].reverse()) {
      const k = p.date.slice(0, 7);
      m.set(k, [...(m.get(k) ?? []), p]);
    }
    return [...m.entries()];
  }, [photos]);

  const remove = async () => {
    if (!open) return;
    await deletePhoto(open);
    onDeleted(open.id);
    setOpen(null);
    setConfirming(false);
  };

  return (
    <section>
      <SectionTitle right={<span className="text-[13px] text-muted tabular">{photos.length} зураг</span>}>Зургийн timeline</SectionTitle>
      {photos.length === 0 ? (
        <Card className="px-4 py-10 text-center text-[14px] text-muted">Өнөөдөр дэлгэцээс анхны зургаа аваарай.</Card>
      ) : (
        <div className="space-y-4">
          {groups.map(([month, list]) => (
            <div key={month}>
              <div className="mb-2 px-1 text-[13px] font-medium text-muted">
                {month.slice(0, 4)} · {monthLabel(`${month}-01`)}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {list.map((p) => (
                  <button key={p.id} type="button" onClick={() => setOpen(p)} className="relative aspect-[3/4] overflow-hidden rounded-lg bg-surface-2">
                    {urls[p.storage_path] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={urls[p.storage_path]} alt={`${fullLabel(p.date)} ${poseLabel(p.pose)}`} loading="lazy" className="h-full w-full object-cover" />
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pt-4 pb-1 text-left text-[11px] font-medium text-white">
                      {shortLabel(p.date)} · {poseLabel(p.pose)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-black text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="pt-safe flex items-center gap-2 px-3 pb-2">
              <button type="button" aria-label="Хаах" onClick={() => (setOpen(null), setConfirming(false))} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Icon name="x" />
              </button>
              <div className="flex-1 text-center">
                <div className="font-semibold">{fullLabel(open.date)}</div>
                <div className="text-[12px] text-white/70">Өдөр {dayNumber(open.date)} · {poseLabel(open.pose)}</div>
              </div>
              <button type="button" aria-label="Устгах" onClick={() => setConfirming(true)} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <Icon name="trash" />
              </button>
            </div>
            <div className="relative flex-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={urls[open.storage_path]} alt="" className="absolute inset-0 h-full w-full object-contain" />
            </div>
            {confirming && (
              <div className="pb-safe flex gap-3 px-4 pt-3 pb-4">
                <button type="button" onClick={() => setConfirming(false)} className="h-14 flex-1 rounded-xl bg-white/15 font-semibold">Болих</button>
                <button type="button" onClick={remove} className="h-14 flex-1 rounded-xl bg-white font-semibold text-black">Устгах</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
