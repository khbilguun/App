"use client";

import JSZip from "jszip";
import { BUCKET, fetchDays, fetchPhotos, fetchReviews, signUrls } from "./data";
import { todayUB } from "./dates";
import { END, START } from "./program";

async function collect() {
  const [days, reviews, photos] = await Promise.all([fetchDays(), fetchReviews(), fetchPhotos()]);
  return {
    app: "zun-2027",
    exported_at: new Date().toISOString(),
    program: { start: START, end: END },
    days,
    weekly_reviews: reviews,
    photos: photos.map((p) => ({ ...p, file: `photos/${p.date}_${p.pose}.jpg`, bucket: BUCKET })),
  };
}

/** iOS дээр share sheet («Файлд хадгалах»), бусад үед татаж авна */
async function deliver(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function exportJSON(): Promise<void> {
  const data = await collect();
  await deliver(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `zun-2027_${todayUB()}.json`);
}

export async function exportZIP(onProgress: (done: number, total: number) => void): Promise<void> {
  const data = await collect();
  const zip = new JSZip();
  zip.file("data.json", JSON.stringify(data, null, 2));
  const urls = await signUrls(data.photos.map((p) => p.storage_path));
  const folder = zip.folder("photos")!;
  let done = 0;
  onProgress(0, data.photos.length);
  // 4-өөр зэрэг татна
  const queue = [...data.photos];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let p = queue.shift(); p; p = queue.shift()) {
        const url = urls[p.storage_path];
        if (url) {
          const res = await fetch(url);
          if (res.ok) folder.file(p.file.replace("photos/", ""), await res.blob());
        }
        onProgress(++done, data.photos.length);
      }
    }),
  );
  const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
  await deliver(blob, `zun-2027_${todayUB()}.zip`);
}
