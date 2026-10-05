"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

/** Жин/бүсэлхийн оролт. Утга байхгүй бол өмнөх утгыг бүдгээр харуулна: тоог дарвал батална, ± дарвал тэндээс алхамлана. */
export function Stepper({
  label,
  unit,
  value,
  fallback,
  step,
  decimals,
  onChange,
}: {
  label: string;
  unit: string;
  value: number | null;
  fallback: number | null;
  step: number;
  decimals: number;
  onChange: (v: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const base = value ?? fallback;

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const bump = (dir: 1 | -1) => {
    if (base === null) {
      setText("");
      setEditing(true);
      return;
    }
    onChange(Math.round((base + dir * step) * 100) / 100);
  };

  const commit = () => {
    setEditing(false);
    const t = text.replace(",", ".").trim();
    if (t === "") return onChange(null);
    const n = Number(t);
    if (Number.isFinite(n) && n > 0) onChange(Math.round(n * 100) / 100);
  };

  return (
    <div className="flex min-h-[64px] items-center gap-2 px-4 py-2">
      <span className="flex-1 font-medium">{label}</span>
      <button
        type="button"
        aria-label={`${label} багасгах`}
        onClick={() => bump(-1)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 active:scale-95"
      >
        <Icon name="minus" />
      </button>
      {editing ? (
        <input
          ref={inputRef}
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="tabular h-12 w-[84px] rounded-xl border border-accent bg-surface text-center text-[20px] font-semibold outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            // Өмнөх утгыг нэг дарж батлах; утгатай бол засах
            if (value === null && base !== null) return onChange(base);
            setText(base?.toFixed(decimals) ?? "");
            setEditing(true);
          }}
          className="tabular flex h-12 w-[84px] flex-col items-center justify-center rounded-xl leading-none"
        >
          <span className={`text-[20px] font-semibold ${value === null ? "text-muted" : ""}`}>
            {base === null ? "—" : base.toFixed(decimals)}
          </span>
          <span className="mt-1 text-[11px] text-muted">{value === null && base !== null ? "өмнөх" : unit}</span>
        </button>
      )}
      <button
        type="button"
        aria-label={`${label} нэмэх`}
        onClick={() => bump(1)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 active:scale-95"
      >
        <Icon name="plus" />
      </button>
    </div>
  );
}
