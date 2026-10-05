import { Card, SectionTitle } from "@/components/ui/Card";
import { inProgram, plannedCounts } from "@/lib/program";
import type { DayRow } from "@/lib/types";

export function PlanVsActual({ days, today }: { days: DayRow[]; today: string }) {
  const sofar = plannedCounts(today);
  const total = plannedCounts();
  const ds = days.filter((d) => inProgram(d.date) && d.date <= today);

  const crossfit = ds.filter((d) => d.crossfit).length;
  const runs = ds.filter((d) => (d.run_minutes ?? 0) > 0).length;
  const km = ds.reduce((s, d) => s + (d.run_km ?? 0), 0);
  const noAlcohol = ds.filter((d) => d.no_alcohol).length;
  const reading = ds.filter((d) => d.reading).length;
  const runMinutes = ds.reduce((s, d) => s + (d.run_minutes ?? 0), 0);

  const rows = [
    { label: "CrossFit", value: crossfit, plan: sofar.crossfit, total: total.crossfit },
    { label: "Гүйлт / алхалт", value: runs, plan: sofar.run, total: total.run },
    { label: "Архигүй өдөр", value: noAlcohol, plan: sofar.days, total: total.days },
    { label: "Ном уншсан өдөр", value: reading, plan: sofar.days, total: total.days },
  ];

  return (
    <section>
      <SectionTitle>Төлөвлөгөө vs бодит</SectionTitle>
      <Card className="divide-y divide-border">
        {rows.map((r) => {
          const pct = r.plan ? Math.min(100, (r.value / r.plan) * 100) : 0;
          return (
            <div key={r.label} className="px-4 py-3">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{r.label}</span>
                <span className="tabular text-[15px]">
                  <span className="font-bold">{r.value}</span>
                  <span className="text-muted"> / {r.plan}</span>
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
              <div className="tabular mt-1 text-[12px] text-muted">Нийт төлөвлөгөө: {r.total}</div>
            </div>
          );
        })}
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="px-4 py-3">
            <div className="text-[13px] text-muted">Нийт км</div>
            <div className="tabular text-[24px] font-bold">{km.toFixed(1)}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[13px] text-muted">Нийт гүйлтийн цаг</div>
            <div className="tabular text-[24px] font-bold">
              {Math.floor(runMinutes / 60)}<span className="text-[14px] font-medium text-muted"> ц </span>
              {runMinutes % 60}<span className="text-[14px] font-medium text-muted"> мин</span>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
