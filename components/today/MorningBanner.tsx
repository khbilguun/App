"use client";

import { useEffect, useState } from "react";
import { fetchDay, saveDay } from "@/lib/data";
import type { DayRow } from "@/lib/types";

/** Өглөө (14:00 хүртэл) өчигдрийн «Утасгүй унтсан»-ыг нэг дарлтаар бөглүүлнэ. */
export function MorningBanner({ date }: { date: string }) {
  const [yday, setYday] = useState<DayRow | null>(null);
  const [state, setState] = useState<"ask" | "done" | "hidden">("hidden");

  useEffect(() => {
    const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ulaanbaatar", hour: "2-digit", hour12: false }).format(new Date()));
    if (hour >= 14) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(`sleep-asked-${date}`) === "1";
    } catch {}
    if (dismissed) return;
    fetchDay(date)
      .then((d) => {
        setYday(d);
        if (!d.phone_free_sleep) setState("ask");
      })
      .catch(() => {});
  }, [date]);

  if (state === "hidden" || !yday) return null;

  const answer = async (yes: boolean) => {
    try {
      localStorage.setItem(`sleep-asked-${date}`, "1");
    } catch {}
    if (yes) {
      setState("done");
      await saveDay({ ...yday, phone_free_sleep: true }).catch(() => setState("ask"));
      setTimeout(() => setState("hidden"), 1200);
    } else setState("hidden");
  };

  return (
    <div className="mb-3 rounded-2xl border border-border bg-surface px-4 py-3">
      {state === "done" ? (
        <div className="py-2 text-center font-medium">Өчигдрийнхийг тэмдэглэлээ ✓</div>
      ) : (
        <>
          <div className="font-medium">Өчигдөр утасгүй унтсан уу?</div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => answer(true)} className="h-12 flex-1 rounded-xl bg-accent font-semibold text-accent-ink active:opacity-90">
              Тийм
            </button>
            <button type="button" onClick={() => answer(false)} className="h-12 flex-1 rounded-xl bg-surface-2 font-semibold active:opacity-90">
              Үгүй
            </button>
          </div>
        </>
      )}
    </div>
  );
}
