import { notFound } from "next/navigation";
import { DayView } from "@/components/today/DayView";
import { isValidDate } from "@/lib/dates";
import { inProgram } from "@/lib/program";

export default async function DayPage({ params }: PageProps<"/day/[date]">) {
  const { date } = await params;
  if (!isValidDate(date) || !inProgram(date)) notFound();
  return <DayView key={date} date={date} />;
}
