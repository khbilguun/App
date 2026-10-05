import { NextResponse } from "next/server";
import { sendToSubs } from "@/lib/pushServer";
import { serverSupabase } from "@/lib/supabase/server";

export async function POST() {
  const db = await serverSupabase();
  const { data: claims } = await db.auth.getClaims();
  if (!claims?.claims?.sub) return NextResponse.json({ error: "Нэвтрээгүй" }, { status: 401 });

  const { data: subs, error } = await db.from("push_subscriptions").select("endpoint, p256dh, auth");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs?.length) return NextResponse.json({ error: "Subscription алга. Сануулгаа асаана уу." }, { status: 400 });

  const sent = await sendToSubs(db, subs, { title: "Зун 2027", body: "Туршилтын мэдэгдэл ажиллаж байна ✓", url: "/settings" });
  return NextResponse.json({ sent });
}
