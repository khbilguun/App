"use client";

import { supabase } from "./supabase/client";
import { userId } from "./data";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export type PushSupport = "ok" | "not-installed" | "unsupported";

export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (isIOS && !standalone) return "not-installed";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  return "ok";
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== "ok") return null;
  return (await registration()).pushManager.getSubscription();
}

export async function enablePush(): Promise<void> {
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Мэдэгдлийн зөвшөөрөл өгөөгүй байна. Тохиргоо → Мэдэгдэл хэсгээс асаана уу.");
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    }));
  const json = sub.toJSON();
  const { error } = await supabase()
    .from("push_subscriptions")
    .upsert({ endpoint: sub.endpoint, user_id: await userId(), p256dh: json.keys!.p256dh, auth: json.keys!.auth }, { onConflict: "endpoint" });
  if (error) throw new Error(error.message);
}

export async function disablePush(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  await supabase().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}

export async function sendTestPush(): Promise<void> {
  const res = await fetch("/api/push/test", { method: "POST" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Илгээж чадсангүй");
}
