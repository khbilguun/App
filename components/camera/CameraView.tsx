"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { previousPhoto, signUrl, uploadPhoto } from "@/lib/data";
import { isValidDate, shortLabel, todayUB } from "@/lib/dates";
import { drawResized, resizeFile, type Resized } from "@/lib/image";
import { inProgram } from "@/lib/program";
import { POSES, type Pose } from "@/lib/types";

type Facing = "user" | "environment";

function readPref<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) || fallback;
  } catch {
    return fallback;
  }
}
function writePref(key: string, v: string) {
  try {
    localStorage.setItem(key, v);
  } catch {}
}

export function CameraView() {
  const router = useRouter();
  const params = useSearchParams();
  const rawDate = params.get("date") ?? "";
  const date = isValidDate(rawDate) && inProgram(rawDate) ? rawDate : todayUB();
  const [pose, setPose] = useState<Pose>(() => (POSES.some((p) => p.id === params.get("pose")) ? (params.get("pose") as Pose) : "front"));
  const [facing, setFacing] = useState<Facing>(() => readPref<Facing>("cam-facing", "user"));
  const [timer, setTimer] = useState<0 | 3 | 10>(() => Number(readPref("cam-timer", "3")) as 0 | 3 | 10);
  const [ghostUrl, setGhostUrl] = useState<string | null>(null);
  const [ghostDate, setGhostDate] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(0.3);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [shot, setShot] = useState<(Resized & { url: string }) | null>(null);
  const [camError, setCamError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const backHref = date === todayUB() ? "/" : `/day/${date}`;

  // Камер асаах
  useEffect(() => {
    if (shot) return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1920 } },
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCamError(false);
      } catch {
        if (!cancelled) setCamError(true);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing, shot]);

  // Ижил байрлалын өмнөх зураг (overlay)
  useEffect(() => {
    let alive = true;
    previousPhoto(date, pose)
      .then(async (p) => {
        if (!alive) return;
        setGhostDate(p?.date ?? null);
        setGhostUrl(p ? await signUrl(p.storage_path) : null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [date, pose]);

  useEffect(() => () => void (shot && URL.revokeObjectURL(shot.url)), [shot]);

  const snap = useCallback(async () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const r = await drawResized(v, v.videoWidth, v.videoHeight); // хадгалах зураг толин бус (жинхэнэ харагдац)
    setShot({ ...r, url: URL.createObjectURL(r.blob) });
  }, []);

  const shutter = () => {
    if (countdown !== null) return;
    if (!timer) return void snap();
    let n: number = timer;
    setCountdown(n);
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        setCountdown(null);
        snap();
      } else setCountdown(n);
    }, 1000);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const r = await resizeFile(f);
      setShot({ ...r, url: URL.createObjectURL(r.blob) });
    } catch {
      setError("Зургийг уншиж чадсангүй.");
    }
  };

  const save = async () => {
    if (!shot) return;
    setBusy(true);
    setError(null);
    try {
      await uploadPhoto(date, pose, shot.blob, shot.width, shot.height);
      router.replace(backHref);
    } catch (e) {
      setError(`Хадгалж чадсангүй: ${(e as Error).message}`);
      setBusy(false);
    }
  };

  const mirror = facing === "user" ? "scaleX(-1)" : undefined;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <input ref={fileRef} type="file" accept="image/*" capture={facing} className="hidden" onChange={onFile} />

      {/* Дээд мөр */}
      <div className="pt-safe absolute inset-x-0 top-0 z-20 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent px-3 pb-6">
        <button type="button" aria-label="Хаах" onClick={() => router.replace(backHref)} className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40">
          <Icon name="x" size={24} />
        </button>
        <div className="flex flex-1 justify-center">
          <div className="flex rounded-full bg-black/45 p-1">
            {POSES.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={!!shot}
                onClick={() => setPose(p.id)}
                className={`h-10 rounded-full px-4 text-[15px] font-semibold transition-colors ${pose === p.id ? "bg-white text-black" : "text-white/85"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="w-12 text-right text-[12px] text-white/70">{shortLabel(date)}</div>
      </div>

      {/* Камер / preview */}
      <div className="relative flex-1 overflow-hidden">
        {shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot.url} alt="Авсан зураг" className="absolute inset-0 h-full w-full object-contain" />
        ) : camError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <Icon name="camera" size={40} />
            <p className="text-white/80">Камерт хандаж чадсангүй. Тохиргоо → Safari → Камер-ыг зөвшөөрнө үү, эсвэл доорх товчоор системийн камерыг нээнэ үү.</p>
            <button type="button" onClick={() => fileRef.current?.click()} className="h-14 rounded-xl bg-white px-6 font-semibold text-black">
              Камер нээх
            </button>
          </div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted autoPlay className="absolute inset-0 h-full w-full object-cover" style={{ transform: mirror }} />
            {ghostUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ghostUrl}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                style={{ opacity, transform: mirror }}
              />
            )}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="tabular text-[120px] font-bold drop-shadow-lg">{countdown}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Доод хэсэг */}
      <div className="pb-safe absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/75 to-transparent px-5 pt-10">
        {error && <p className="mb-3 rounded-xl bg-black/60 px-3 py-2 text-center text-[14px]">{error}</p>}

        {shot ? (
          <div className="mb-6 flex gap-3">
            <button type="button" onClick={() => setShot(null)} disabled={busy} className="h-14 flex-1 rounded-xl bg-white/15 font-semibold">
              Дахин авах
            </button>
            <button type="button" onClick={save} disabled={busy} className="h-14 flex-1 rounded-xl bg-accent font-semibold text-accent-ink disabled:opacity-60">
              {busy ? "Хадгалж байна…" : "Хадгалах"}
            </button>
          </div>
        ) : (
          <>
            {ghostUrl && !camError && (
              <label className="mb-4 flex items-center gap-3 text-[13px] text-white/80">
                <span className="w-28 shrink-0">Overlay {ghostDate && shortLabel(ghostDate)}</span>
                <input
                  type="range"
                  min={0}
                  max={0.7}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="h-8 flex-1 accent-[var(--accent)]"
                />
              </label>
            )}
            <div className="mb-6 flex items-center justify-between">
              <button
                type="button"
                aria-label="Камер солих"
                onClick={() => {
                  const f = facing === "user" ? "environment" : "user";
                  setFacing(f);
                  writePref("cam-facing", f);
                }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15"
              >
                <Icon name="rotate" size={24} />
              </button>
              <button
                type="button"
                aria-label="Зураг авах"
                onClick={camError ? () => fileRef.current?.click() : shutter}
                className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white active:scale-95"
              >
                <span className={`h-16 w-16 rounded-full ${countdown !== null ? "bg-accent" : "bg-white"}`} />
              </button>
              <button
                type="button"
                aria-label="Timer"
                onClick={() => {
                  const t = timer === 0 ? 3 : timer === 3 ? 10 : 0;
                  setTimer(t);
                  writePref("cam-timer", String(t));
                }}
                className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-white/15 text-[11px] font-semibold"
              >
                <Icon name="timer" size={20} />
                {timer ? `${timer}с` : "унт."}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
