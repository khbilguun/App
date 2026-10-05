"use client";

import { useSyncExternalStore } from "react";
import { todayUB } from "./dates";

// App нээлттэй байхад шөнө дундаас хойш (эсвэл маргааш өглөө PWA-г дахин нээхэд) өнөөдрийг шинэчилнэ.
function subscribe(cb: () => void) {
  const id = setInterval(cb, 60_000);
  document.addEventListener("visibilitychange", cb);
  window.addEventListener("focus", cb);
  return () => {
    clearInterval(id);
    document.removeEventListener("visibilitychange", cb);
    window.removeEventListener("focus", cb);
  };
}

/** Сервер дээр null (prerender), клиент дээр УБ-ийн өнөөдөр */
export function useToday(): string | null {
  return useSyncExternalStore(subscribe, todayUB, () => null);
}
