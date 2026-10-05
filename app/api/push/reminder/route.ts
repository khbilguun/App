import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requiredItems } from "@/lib/completion";
import { mondayOf, todayUB } from "@/lib/dates";
import { TOTAL_DAYS, dayNumber, inProgram, planFor } from "@/lib/program";
import { sendToSubs } from "@/lib/pushServer";
import { adminSupabase } from "@/lib/supabase/server";
import { reviewHasContent, type DayRow } from "@/lib/types";

// pg_cron (Supabase) өдөр бүр 13:00 UTC = 21:00 УБ-д дуудна.
function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get("authorization") ?? "";
  const want = `Bearer ${secret}`;
  return !!secret && got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

async function handle(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const today = todayUB();
  if (!inProgram(today)) return NextResponse.json({ skipped: "outside program" });

  const db = adminSupabase();
  const { data: subs, error } = await db.from("push_subscriptions").select("user_id, endpoint, p256dh, auth");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = [...new Set((subs ?? []).map((s) => s.user_id as string))];
  let sent = 0;
  for (const uid of users) {
    const [{ data: day }, { data: review }] = await Promise.all([
      db.from("days").select("*").eq("user_id", uid).eq("date", today).maybeSingle(),
      db.from("weekly_reviews").select("*").eq("user_id", uid).eq("week_start", mondayOf(today)).maybeSingle(),
    ]);
    const items = requiredItems(today, (day as DayRow) ?? undefined, reviewHasContent(review));
    const left = items.filter((i) => !i.done).length;
    if (left === 0) continue; // бүрэн бол сануулахгүй

    const n = dayNumber(today);
    const body =
      left === items.length
        ? `Өдөр ${n}/${TOTAL_DAYS} — өдрөө бөглөх үү? 15 секунд л болно.`
        : `Өдөр ${n}/${TOTAL_DAYS} — ${left} зүйл үлдлээ.${planFor(today).kind === "rest" ? " Дүгнэлтээ мартуузай." : ""}`;
    sent += await sendToSubs(
      db,
      (subs ?? []).filter((s) => s.user_id === uid),
      { title: "Зун 2027", body, url: "/" },
    );
  }
  return NextResponse.json({ sent });
}

export const POST = handle;
export const GET = handle;
