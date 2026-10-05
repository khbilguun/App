import { Icon, type IconName } from "@/components/ui/Icon";
import type { DayStatus } from "@/lib/completion";
import type { Plan } from "@/lib/program";

const ICONS: Record<Plan["kind"], IconName> = { crossfit: "dumbbell", run: "run", walk: "walk", rest: "leaf" };

const STATUS: Record<DayStatus, string> = {
  complete: "Бүрэн",
  partial: "Хагас",
  missed: "Алдсан",
  pending: "Бөглөөгүй",
  future: "",
};

export function PlanCard({ plan, status, isToday }: { plan: Plan; status: DayStatus; isToday: boolean }) {
  return (
    <div className="flex min-h-[64px] items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2">
        <Icon name={ICONS[plan.kind]} size={24} />
      </span>
      <div className="flex-1">
        <div className="text-[13px] text-muted">{isToday ? "Өнөөдрийн төлөвлөгөө" : "Төлөвлөгөө"}</div>
        <div className="font-semibold">
          {plan.title}
          {plan.detail && <span className="font-normal text-muted"> · {plan.detail}</span>}
        </div>
      </div>
      {STATUS[status] && (
        <span
          className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
            status === "complete" ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"
          }`}
        >
          {STATUS[status]}
        </span>
      )}
    </div>
  );
}
