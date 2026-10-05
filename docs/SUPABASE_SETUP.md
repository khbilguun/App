# Тохиргоо — алхам алхмаар

Нийт ~20 минут. Дарааллаар нь хийнэ.

---

## 1. Supabase project үүсгэх

1. https://supabase.com → **Sign in** → **New project**
2. Нэр: `zun-2027`, Database password: хүчтэй нууц үг (хадгалж аваарай)
3. **Region: Southeast Asia (Singapore)** эсвэл **Northeast Asia (Tokyo)** — Улаанбаатарт ойр
4. **Create new project** → 1–2 минут хүлээнэ

## 2. Хүснэгт, хамгаалалт, зургийн bucket үүсгэх

1. Зүүн цэс → **SQL Editor** → **New query**
2. `supabase/migrations/0001_init.sql` файлын агуулгыг бүхэлд нь хуулж тавина → **Run**
3. «Success. No rows returned» гарвал болсон.
4. Шалгах:
   - **Table Editor**: `days`, `photos`, `weekly_reviews`, `push_subscriptions` гэсэн 4 хүснэгт байх ба бүгд дээр **RLS enabled** гэж бичигдсэн байна.
   - **Storage**: `progress-photos` bucket байх ба **Private** гэж харагдана. ⚠️ Public болгож хэзээ ч бүү өөрчил.

## 3. Өөрийн хэрэглэгчийг үүсгэх, бүртгэлийг хаах

1. **Authentication → Users → Add user → Create new user**
   - Email, Password оруулна
   - ✅ **Auto Confirm User** чагтлана
   - **Create user**
2. **Authentication → Sign In / Providers** (хуучин UI-д: *Providers → Email*)
   - **Allow new users to sign up** → **OFF** → **Save**
   - Ингэснээр та л нэвтэрч чадна, өөр хэн ч бүртгүүлж чадахгүй.

## 4. API түлхүүрүүдийг авах

**Project Settings → API Keys** (эсвэл *Data API*):

| Хаана | Утга | `.env` хувьсагч |
|---|---|---|
| Project URL | `https://xxxx.supabase.co` | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` / **publishable** key | `eyJ...` эсвэл `sb_publishable_...` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` / **secret** key | `eyJ...` эсвэл `sb_secret_...` | `SUPABASE_SERVICE_ROLE_KEY` |

> `anon` түлхүүр нь нээлттэй байхаар зохиогдсон — өгөгдлийг RLS хамгаална.
> `service_role` нь **нууц**: зөвхөн Vercel-ийн env-д тавина, хэзээ ч `NEXT_PUBLIC_` болгохгүй, git-д оруулахгүй.

## 5. Push мэдэгдлийн түлхүүр (VAPID)

```bash
npm install
npx web-push generate-vapid-keys
```
- `Public Key` → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `Private Key` → `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT=mailto:таны@имэйл`
- `CRON_SECRET` — урт санамсаргүй мөр: `openssl rand -hex 32`

## 6. Компьютер дээр турших (заавал биш)

```bash
cp .env.example .env.local   # дээрх утгуудаар бөглөнө
npm run dev                  # http://localhost:3000
```
Push болон камер нь HTTPS дээр л бүрэн ажиллана — бодит туршилтыг Vercel дээр хийнэ.

## 7. Vercel дээр deploy хийх

1. https://vercel.com → GitHub-аар нэвтэрнэ → **Add New → Project** → `App` repo-г **Import**
2. **Environment Variables** хэсэгт `.env.example`-д байгаа 7 хувьсагчийг бүгдийг нь оруулна
3. **Deploy** → `https://<нэр>.vercel.app` хаяг гарна
4. Supabase → **Authentication → URL Configuration → Site URL** = энэ хаяг

## 8. 21:00-ийн сануулгыг асаах (pg_cron)

1. Supabase → **Database → Extensions** → `pg_cron`, `pg_net` хоёрыг **Enable**
2. **SQL Editor** → `supabase/migrations/0002_reminder_cron.sql`-ийг хуулна
3. `<APP_URL>` → `https://<нэр>.vercel.app`, `<CRON_SECRET>` → 5-р алхмын утга
4. **Run**
5. Шалгах: `select * from cron.job;` → `daily-reminder`, `0 13 * * *`
6. Цагийн бүс: `show cron.timezone;` → `GMT` (эсвэл `UTC`) гарвал зөв. pg_cron UTC-ээр ажилладаг тул 13:00 UTC = **21:00 Улаанбаатар** (UTC+8, зуны цаггүй).

Гараар турших:
```bash
curl -X POST https://<нэр>.vercel.app/api/push/reminder -H "Authorization: Bearer <CRON_SECRET>"
# {"sent":1} — өнөөдөр бүрэн бол {"sent":0}
```

## 9. iPhone дээр суулгах

1. **Safari**-аар `https://<нэр>.vercel.app` нээж нэвтэрнэ
2. **Share** (⬆︎) → **Add to Home Screen** → **Add**
3. Home screen дээрх **Зун 2027** icon-оор нээнэ (одооноос үргэлж эндээс)
4. **Тохиргоо → Сануулга 21:00** асаах → мэдэгдлийг **Allow**
5. **Туршилтын мэдэгдэл илгээх** → хэдэн секундэд ирнэ
6. **Өнөөдөр → Урд** → камерт зөвшөөрөл өгнө

> Push нь **iOS 16.4+** болон home screen-ээс нээсэн үед л ажиллана. Safari tab дотор ажиллахгүй.

---

## Аюулгүй байдлын хураангуй

- Бүх хүснэгт RLS-тэй: `user_id = auth.uid()` — зөвхөн өөрийн мөр.
- Bucket `progress-photos` нь **private**. Зам `{user_id}/…` байх ёстой (storage policy шалгана).
- Зургийг зөвхөн **1 цагийн signed URL**-аар харуулна; public URL огт үүсгэхгүй.
- Шинэ бүртгэл хаалттай.
- `service_role` түлхүүрийг зөвхөн `/api/push/reminder` (cron) ашиглана, `CRON_SECRET`-ээр хамгаалагдсан.

## Асуудал гарвал

| Шинж тэмдэг | Шийдэл |
|---|---|
| Нэвтэрч чадахгүй | Users-д хэрэглэгч **Confirmed** эсэх; имэйл/нууц үг |
| «new row violates row-level security» | `0001_init.sql`-ийг бүтэн ажиллуулсан эсэх |
| Зураг upload болохгүй | Bucket нэр `progress-photos`, policy-ууд үүссэн эсэх |
| Камер нээгдэхгүй | iPhone Тохиргоо → Safari → Camera → Ask/Allow; «Камер нээх» fallback товч |
| Сануулга ирэхгүй | Home screen-ээс нээсэн эсэх; `select * from cron.job_run_details order by start_time desc limit 5;` |
