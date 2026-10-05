export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-border bg-surface ${className}`}>{children}</section>;
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between px-1">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">{children}</h2>
      {right}
    </div>
  );
}

export function PageHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <header className="pt-safe flex items-center justify-between pb-4">
      <h1 className="text-[28px] font-bold tracking-tight">{title}</h1>
      {right}
    </header>
  );
}
