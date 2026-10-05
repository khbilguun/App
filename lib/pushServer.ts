import "server-only";
import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

interface SubRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Бүх subscription руу илгээнэ. Хүчингүй болсон (404/410)-ийг устгана. */
export async function sendToSubs(db: SupabaseClient, subs: SubRow[], payload: { title: string; body: string; url?: string }) {
  configure();
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), {
          TTL: 60 * 60 * 3,
          urgency: "normal",
        });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    }),
  );
  return sent;
}
