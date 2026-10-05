"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, SectionTitle } from "@/components/ui/Card";
import { fullLabel, shortLabel } from "@/lib/dates";
import type { DayRow } from "@/lib/types";

type Metric = "weight_kg" | "waist_cm";
const META: Record<Metric, { label: string; unit: string }> = {
  weight_kg: { label: "Жин", unit: "кг" },
  waist_cm: { label: "Бүсэлхий", unit: "см" },
};

export function MeasureChart({ days }: { days: DayRow[] }) {
  const [metric, setMetric] = useState<Metric>("weight_kg");
  const { unit } = META[metric];

  const data = useMemo(() => {
    const pts = days.filter((d) => d[metric] !== null).map((d) => ({ date: d.date, v: d[metric] as number }));
    // 7 цэгийн гулсах дундаж — өдөр тутмын хэлбэлзлийг зөөлрүүлнэ
    return pts.map((p, i) => {
      const win = pts.slice(Math.max(0, i - 6), i + 1);
      return { ...p, avg: Math.round((win.reduce((s, x) => s + x.v, 0) / win.length) * 10) / 10 };
    });
  }, [days, metric]);

  const first = data[0]?.v;
  const last = data.at(-1)?.v;
  const delta = first !== undefined && last !== undefined ? Math.round((last - first) * 10) / 10 : null;

  return (
    <section>
      <SectionTitle>Хэмжилт</SectionTitle>
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex rounded-full bg-surface-2 p-1" role="tablist">
            {(Object.keys(META) as Metric[]).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={metric === m}
                onClick={() => setMetric(m)}
                className={`h-9 rounded-full px-4 text-[14px] font-semibold ${metric === m ? "bg-surface text-text shadow-sm" : "text-muted"}`}
              >
                {META[m].label}
              </button>
            ))}
          </div>
          {last !== undefined && (
            <div className="text-right">
              <div className="tabular text-[20px] font-bold leading-none">
                {last.toFixed(1)} <span className="text-[13px] font-medium text-muted">{unit}</span>
              </div>
              {delta !== null && (
                <div className="tabular mt-1 text-[12px] text-muted">
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(1)} эхнээс
                </div>
              )}
            </div>
          )}
        </div>
        {data.length < 2 ? (
          <p className="py-10 text-center text-[14px] text-muted">График гарахад 2-оос дээш хэмжилт хэрэгтэй.</p>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortLabel}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={28}
                />
                <YAxis
                  domain={["dataMin - 1", "dataMax + 1"]}
                  tick={{ fill: "var(--muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v.toFixed(0)}
                  width={44}
                />
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 13 }}
                  labelStyle={{ color: "var(--muted)" }}
                  labelFormatter={(l) => fullLabel(String(l))}
                  formatter={(v, name) => [`${Number(v).toFixed(1)} ${unit}`, name === "avg" ? "7 хоногийн дундаж" : META[metric].label]}
                />
                <Line type="monotone" dataKey="v" stroke="var(--muted)" strokeWidth={1} dot={{ r: 2, fill: "var(--muted)", strokeWidth: 0 }} isAnimationActive={false} />
                <Line type="monotone" dataKey="avg" stroke="var(--accent)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </section>
  );
}
