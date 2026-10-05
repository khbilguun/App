"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveDay } from "./data";
import type { DayRow } from "./types";

/** Хамгийн сүүлийн төлөвийг дараалуулж хадгална (optimistic UI). */
export function useDaySaver() {
  const pending = useRef<DayRow | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<Promise<void> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    while (inflight.current) await inflight.current;
    const d = pending.current;
    if (!d) return;
    pending.current = null;
    setSaving(true);
    inflight.current = saveDay(d)
      .then(() => setError(null))
      .catch((e: Error) => {
        setError(e.message);
        pending.current ??= d; // дараагийн оролдлогод дахин илгээнэ
      })
      .finally(() => {
        inflight.current = null;
        setSaving(false);
      });
    await inflight.current;
  }, []);

  const schedule = useCallback(
    (day: DayRow, delay = 300) => {
      pending.current = day;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [flush],
  );

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [flush]);

  return { schedule, flush, error, saving };
}
