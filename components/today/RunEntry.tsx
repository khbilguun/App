"use client";

import { useRef } from "react";
import { CheckCircle } from "@/components/ui/CheckCircle";

function parse(v: string, int: boolean): number | null {
  const t = v.replace(",", ".").trim();
  if (!t) return null;
  const n = int ? parseInt(t, 10) : Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function RunEntry({
  label,
  minutes,
  km,
  onChange,
}: {
  label: string;
  minutes: number | null;
  km: number | null;
  onChange: (p: { run_minutes?: number | null; run_km?: number | null }) => void;
}) {
  const minRef = useRef<HTMLInputElement>(null);
  const done = (minutes ?? 0) > 0;
  return (
    <div className="flex min-h-[68px] items-center gap-4 px-4 py-3">
      <button type="button" aria-label={`${label} оруулах`} onClick={() => minRef.current?.focus()}>
        <CheckCircle on={done} />
      </button>
      <button type="button" className="flex-1 text-left font-medium" onClick={() => minRef.current?.focus()}>
        {label}
      </button>
      <label className="flex items-baseline gap-1">
        <input
          ref={minRef}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="0"
          defaultValue={minutes ?? ""}
          onChange={(e) => onChange({ run_minutes: parse(e.target.value, true) })}
          className="tabular h-12 w-16 rounded-xl bg-surface-2 text-center text-[19px] font-semibold outline-none focus:ring-2 focus:ring-accent"
          aria-label="Минут"
        />
        <span className="text-[13px] text-muted">мин</span>
      </label>
      <label className="flex items-baseline gap-1">
        <input
          inputMode="decimal"
          placeholder="0.0"
          defaultValue={km ?? ""}
          onChange={(e) => onChange({ run_km: parse(e.target.value, false) })}
          className="tabular h-12 w-16 rounded-xl bg-surface-2 text-center text-[19px] font-semibold outline-none focus:ring-2 focus:ring-accent"
          aria-label="Километр"
        />
        <span className="text-[13px] text-muted">км</span>
      </label>
    </div>
  );
}
