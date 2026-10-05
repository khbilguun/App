import { mondayOf } from "./dates";
import { supabase } from "./supabase/client";
import { emptyDay, type DayRow, type PhotoRow, type Pose, type ReviewRow } from "./types";

export const BUCKET = "progress-photos";

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function normalizeDay(r: Record<string, unknown>): DayRow {
  return {
    ...(r as unknown as DayRow),
    run_km: num(r.run_km),
    weight_kg: num(r.weight_kg),
    waist_cm: num(r.waist_cm),
  };
}

let uidCache: string | null = null;
export async function userId(): Promise<string> {
  if (uidCache) return uidCache;
  const { data } = await supabase().auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("Нэвтрээгүй байна");
  uidCache = id;
  return id;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

// ───────────── Өдөр ─────────────

export async function fetchDay(date: string): Promise<DayRow> {
  const data = check(await supabase().from("days").select("*").eq("date", date).maybeSingle());
  return data ? normalizeDay(data) : emptyDay(date);
}

export async function fetchDays(): Promise<DayRow[]> {
  const data = check(await supabase().from("days").select("*").order("date"));
  return (data ?? []).map(normalizeDay);
}

export async function saveDay(day: DayRow): Promise<void> {
  const row = { ...day, user_id: await userId() };
  delete row.updated_at;
  check(await supabase().from("days").upsert(row, { onConflict: "user_id,date" }));
}

/** `date`-ээс өмнөх хамгийн сүүлийн жин/бүсэлхий */
export async function lastMeasures(date: string): Promise<{ weight: number | null; waist: number | null }> {
  const [w, s] = await Promise.all([
    supabase().from("days").select("weight_kg").lt("date", date).not("weight_kg", "is", null).order("date", { ascending: false }).limit(1).maybeSingle(),
    supabase().from("days").select("waist_cm").lt("date", date).not("waist_cm", "is", null).order("date", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return { weight: num(w.data?.weight_kg), waist: num(s.data?.waist_cm) };
}

// ───────────── Дүгнэлт ─────────────

export async function fetchReview(weekStart: string): Promise<ReviewRow | null> {
  return check(await supabase().from("weekly_reviews").select("*").eq("week_start", weekStart).maybeSingle());
}

export async function fetchReviews(): Promise<ReviewRow[]> {
  return check(await supabase().from("weekly_reviews").select("*").order("week_start", { ascending: false })) ?? [];
}

export async function saveReview(r: ReviewRow): Promise<void> {
  const row = { ...r, user_id: await userId() };
  delete row.updated_at;
  check(await supabase().from("weekly_reviews").upsert(row, { onConflict: "user_id,week_start" }));
}

export const reviewWeekOf = mondayOf;

// ───────────── Зураг ─────────────

export async function fetchPhotos(): Promise<PhotoRow[]> {
  return check(await supabase().from("photos").select("*").order("date").order("pose")) ?? [];
}

export async function fetchPhotosFor(date: string): Promise<PhotoRow[]> {
  return check(await supabase().from("photos").select("*").eq("date", date)) ?? [];
}

/** Ижил байрлалын, `date`-ээс өмнөх хамгийн сүүлийн зураг (overlay-д) */
export async function previousPhoto(date: string, pose: Pose): Promise<PhotoRow | null> {
  return check(
    await supabase().from("photos").select("*").eq("pose", pose).lt("date", date).order("date", { ascending: false }).limit(1).maybeSingle(),
  );
}

export async function uploadPhoto(date: string, pose: Pose, blob: Blob, width: number, height: number): Promise<PhotoRow> {
  const uid = await userId();
  const path = `${uid}/${date}/${pose}-${crypto.randomUUID()}.jpg`;
  const sb = supabase();
  check(await sb.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false }));

  const old = check(await sb.from("photos").select("id, storage_path").eq("date", date).eq("pose", pose).maybeSingle());
  const row = check(
    await sb
      .from("photos")
      .upsert({ user_id: uid, date, pose, storage_path: path, width, height }, { onConflict: "user_id,date,pose" })
      .select()
      .single(),
  ) as PhotoRow;
  if (old && old.storage_path !== path) await sb.storage.from(BUCKET).remove([old.storage_path]);
  return row;
}

export async function deletePhoto(p: PhotoRow): Promise<void> {
  const sb = supabase();
  check(await sb.from("photos").delete().eq("id", p.id));
  await sb.storage.from(BUCKET).remove([p.storage_path]);
}

// Signed URL — 1 цаг. Санах ойд 50 минут хадгална.
const SIGN_TTL = 3600;
const signed = new Map<string, { url: string; exp: number }>();

export async function signUrls(paths: string[]): Promise<Record<string, string>> {
  const now = Date.now();
  const out: Record<string, string> = {};
  const missing: string[] = [];
  for (const p of paths) {
    const hit = signed.get(p);
    if (hit && hit.exp > now) out[p] = hit.url;
    else missing.push(p);
  }
  for (let i = 0; i < missing.length; i += 100) {
    const chunk = missing.slice(i, i + 100);
    const data = check(await supabase().storage.from(BUCKET).createSignedUrls(chunk, SIGN_TTL));
    for (const item of data ?? []) {
      if (item.signedUrl && item.path) {
        out[item.path] = item.signedUrl;
        signed.set(item.path, { url: item.signedUrl, exp: now + 50 * 60_000 });
      }
    }
  }
  return out;
}

export async function signUrl(path: string): Promise<string | null> {
  return (await signUrls([path]))[path] ?? null;
}

export async function signOut(): Promise<void> {
  uidCache = null;
  signed.clear();
  await supabase().auth.signOut();
}

export async function fetchDaysBetween(from: string, to: string): Promise<DayRow[]> {
  const data = check(await supabase().from("days").select("*").gte("date", from).lte("date", to).order("date"));
  return (data ?? []).map(normalizeDay);
}

export async function fetchPhotosBetween(from: string, to: string): Promise<PhotoRow[]> {
  return check(await supabase().from("photos").select("*").gte("date", from).lte("date", to)) ?? [];
}
