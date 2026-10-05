import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/components/review/ReviewForm";
import { Icon } from "@/components/ui/Icon";
import { isValidDate, weekday } from "@/lib/dates";
import { END, START } from "@/lib/program";

export default async function ReviewWeekPage({ params }: PageProps<"/review/[week]">) {
  const { week } = await params;
  if (!isValidDate(week) || weekday(week) !== 0 || week < START || week > END) notFound();
  return (
    <div className="pt-safe">
      <Link href="/review" className="-ml-2 mb-2 inline-flex h-11 items-center gap-1 pr-3 text-muted">
        <Icon name="chevronLeft" /> Дүгнэлтүүд
      </Link>
      <h1 className="mb-3 text-[28px] font-bold tracking-tight">Долоо хоногийн дүгнэлт</h1>
      <ReviewForm key={week} weekStart={week} />
    </div>
  );
}
