# «2027 оны зун гэхэд» — Төлөвлөгөө (v1, батлуулахаар)

> Код бичихээс өмнөх төлөвлөгөө. Баталсны дараа энэ дарааллаар хэрэгжүүлнэ.

## 0. Үндсэн тоо, дүрэм

| | |
|---|---|
| Эхлэх өдөр | **2026-10-05 (Даваа)** = Өдөр 1 |
| Сүүлийн өдөр | **2027-05-31 (Даваа)** = Өдөр 239 |
| Зорилгын өдөр | **2027-06-01** — «Зун». Тоолуур: «Зун хүртэл N өдөр» |
| Цагийн бүс | `Asia/Ulaanbaatar` (UTC+8). «Өнөөдөр» гэдгийг үргэлж энэ бүсээр тооцно |
| Төлөвлөгөөт CrossFit | 103 (Да/Лх/Ба) |
| Төлөвлөгөөт гүйлт | 102 (Мя/Пү/Бя) — үүнээс 2 нь алхалт (10-10, 10-17 Бямба) |
| Ням (амралт + дүгнэлт) | 34 |

**Өдрийн төлөв** (heatmap, тоолуурт):
- `complete` — тухайн өдрийн бүх *шаардлагатай* зүйл ✓ → өнгөтэй (accent)
- `partial` — заримыг нь бөглөсөн → бүдэг accent
- `missed` — өнгөрсөн, юу ч бөглөөгүй → **саарал**. Тоолуур эхнээс нь эхлэхгүй, зүгээр л цааш явна
- `future` — хүрээтэй хоосон нүд

**Шаардлагатай зүйлс:**
- Бүх өдөр: архи уугаагүй, 15 мин ном, арьс арчилгаа, утасгүй унтсан
- Да/Лх/Ба: + CrossFit явсан
- Мя/Пү/Бя: + гүйлт (минут > 0; км заавал биш)
- Ням: + долоо хоногийн дүгнэлт бичсэн
- Жин, бүсэлхий, зураг — **заавал биш** (бөглөсөн бол график, timeline-д орно)

Төлөвлөгөө (аль өдөр юу хийх) DB-д хадгалахгүй — `lib/program.ts` дотор огнооноос тооцоолдог цэвэр функц.

---

## 1. Технологи

| Хэсэг | Сонголт | Яагаад |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | |
| Style | Tailwind CSS v4, CSS variable токенууд | dark mode = `prefers-color-scheme` + гараар солих |
| Фонт | **Golos Text** (`next/font/google`) | Кириллд зориулж зурсан, тоонууд `tabular-nums` |
| PWA | Serwist (`@serwist/next`) + `app/manifest.ts` | Service worker, офлайн shell, push |
| Backend | Supabase: Auth, Postgres (RLS), private Storage | |
| Supabase client | `@supabase/ssr` | Cookie-д суурилсан session |
| График | Recharts | |
| Animation | `motion` (Framer Motion) | Өдөр бүрэн болох үеийн animation |
| Export | JSZip (client талд) | Сервер timeout-гүй |
| Push | Web Push (VAPID) + Supabase Edge Function + `pg_cron` | iOS 16.4+, home screen-д нэмсэн PWA дээр ажилладаг |
| Hosting | Vercel (үнэгүй) | PWA-д HTTPS заавал |

---

## 2. Хавтасны бүтэц

```
app/
  layout.tsx                 # фонт, theme, <html lang="mn">
  globals.css                # өнгөний токен (light/dark)
  manifest.ts                # PWA manifest (нэр, icon, standalone, theme_color)
  sw.ts                      # Serwist service worker (+ push handler)
  login/page.tsx             # имэйл + нууц үг
  (app)/
    layout.tsx               # auth guard + доод tab bar
    page.tsx                 # 1. Өнөөдөр
    day/[date]/page.tsx      # Өмнөх өдрийг засах (ижил компонент)
    camera/page.tsx          # Бүтэн дэлгэцийн камер + overlay
    progress/page.tsx        # 2. Явц
    review/page.tsx          # 3. Дүгнэлтүүдийн жагсаалт + энэ долоо хоног
    review/[week]/page.tsx   # Нэг дүгнэлт бичих/унших
    settings/page.tsx        # 4. Тохиргоо
components/
  ui/          BottomNav, BigToggle, Stepper, NumberField, Sheet, Button
  today/       DayHeader, Countdown, PlanCard, Checklist, RunEntry,
               Measurements, PhotoTile, MorningBanner, CompleteBurst
  camera/      CameraView, GhostOverlay, ShutterButton
  progress/    MeasureChart, BeforeAfter, PhotoTimeline, PlanVsActual, Heatmap
  review/      ReviewForm, ReviewCard
lib/
  supabase/    client.ts, server.ts, middleware.ts
  program.ts   # START, END, dayIndex(), planFor(date), isWalkDay() ...
  dates.ts     # UB timezone-оор todayUB(), weekStart(), форматлах (монголоор)
  completion.ts# dayStatus(day, plan, review) → complete|partial|missed|future
  image.ts     # resizeTo1600(file|canvas) → JPEG Blob
  photos.ts    # upload, signed URL (batch), устгах
  export.ts    # JSON + ZIP үүсгэх
  push.ts      # subscribe/unsubscribe
  i18n.ts      # Бүх монгол текст нэг дор
  types.ts     # Supabase-ээс generate хийсэн DB төрөл
middleware.ts  # session refresh, нэвтрээгүй бол /login руу
supabase/
  migrations/0001_init.sql
  functions/daily-reminder/index.ts
public/icons/  # 192, 512, apple-touch-icon 180, maskable
docs/PLAN.md, docs/SUPABASE_SETUP.md
```

---

## 3. Supabase schema

```sql
-- Өдөр бүрийн бичлэг (хэрэглэгч × огноо)
create table public.days (
  user_id          uuid not null default auth.uid() references auth.users on delete cascade,
  date             date not null check (date between '2026-10-05' and '2027-05-31'),
  crossfit         boolean not null default false,
  run_minutes      smallint check (run_minutes >= 0),
  run_km           numeric(5,2) check (run_km >= 0),
  no_alcohol       boolean not null default false,
  reading          boolean not null default false,
  skincare         boolean not null default false,
  phone_free_sleep boolean not null default false,
  weight_kg        numeric(5,2),
  waist_cm         numeric(5,1),
  note             text,
  completed_at     timestamptz,          -- complete болсон анхны мөч (animation 1 удаа)
  updated_at       timestamptz not null default now(),
  primary key (user_id, date)
);

-- Явцын зураг (метадата; файл нь storage-д)
create table public.photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  date         date not null,
  pose         text not null default 'front' check (pose in ('front','side','back')),
  storage_path text not null unique,     -- {user_id}/{date}/{pose}-{uuid}.jpg
  width        int, height int,
  created_at   timestamptz not null default now()
);
create index on public.photos (user_id, date);

-- Ням гарагийн дүгнэлт (долоо хоногийн Даваа гарагаар түлхүүрлэнэ)
create table public.weekly_reviews (
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  week_start  date not null check (extract(isodow from week_start) = 1),
  went_well   text,   -- Юу биелэв?
  obstacles   text,   -- Юу саад болов?
  change_next text,   -- Ирэх долоо хоногт юуг өөрчлөх вэ?
  updated_at  timestamptz not null default now(),
  primary key (user_id, week_start)
);

-- Push subscription (iPhone дээр ихэвчлэн 1 ширхэг)
create table public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

-- Тохиргоо
create table public.settings (
  user_id          uuid primary key default auth.uid() references auth.users on delete cascade,
  reminder_enabled boolean not null default true,
  reminder_hour    smallint not null default 21,
  theme            text not null default 'system' check (theme in ('system','light','dark'))
);
```

**RLS** — бүх хүснэгт дээр `enable row level security` + нэг policy:
`using (user_id = auth.uid()) with check (user_id = auth.uid())`.

**Storage** — bucket `progress-photos`, **public = false**, 10 MB хязгаар, зөвхөн `image/jpeg`.
`storage.objects` дээрх policy: `bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text` (select/insert/update/delete).
Зургийг үргэлж `createSignedUrls()` (batch, 1 цагийн хугацаатай) -аар харуулна. Public URL хэзээ ч үүсгэхгүй.

**Auth** — Email + нууц үг. Өөрийн хэрэглэгчийг үүсгээд **«Allow new users to sign up» -ийг унтраана** → өөр хэн ч бүртгүүлж чадахгүй. (Magic link iOS PWA-д Safari руу үсэрч session алддаг тул ашиглахгүй.)

**Сануулга** — `pg_cron` өдөр бүр 13:00 UTC (= 21:00 УБ) Edge Function `daily-reminder`-ийг дуудна → өнөөдрийн өдөр complete биш бол push илгээнэ («Өдөр 12 — өдрөө бөглөх үү? 15 секунд»). Complete бол юу ч явуулахгүй.

---

## 4. Дэлгэцүүдийн wireframe (iPhone, нэг гар)

Ерөнхий зарчим: доод tab bar, гол үйлдлүүд дэлгэцийн доод 2/3-д (эрхий хуруунд хүрэх бүс), мөр бүр ≥ 56px, **хадгалах товч байхгүй** — дармагц шууд хадгална (optimistic). Нэг өнгө (accent), бусад нь саарал/цагаан/хар.

### 4.1 Өнөөдөр

```
┌──────────────────────────────────┐
│  ‹   Даваа · 10-р сарын 5    ›   │  ← өдөр солих (swipe ч болно)
│                                  │
│        Өдөр 1 / 239              │  ← том, tabular тоо
│  ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░    │  ← 239 өдрийн явц
│        Зун хүртэл 239 өдөр       │
├──────────────────────────────────┤
│  ⚡ CrossFit · 06:00              │  ← PlanCard (өдрөөс хамаарна)
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │ ◯  CrossFit явсан          │  │  ← BigToggle, бүтэн мөр дарагдана
│  ├────────────────────────────┤  │
│  │ ◯  Архи уугаагүй           │  │
│  ├────────────────────────────┤  │
│  │ ◯  15 мин ном уншсан       │  │
│  ├────────────────────────────┤  │
│  │ ◯  Арьс арчилгаа           │  │
│  ├────────────────────────────┤  │
│  │ ◯  Утасгүй унтсан          │  │
│  └────────────────────────────┘  │
│                                  │
│  Жин        [ − ]  82.4  [ + ] кг│  ← өмнөх утгаар урьдчилан бөглөнө,
│  Бүсэлхий   [ − ]  94.0  [ + ] см│    ±0.1 / ±0.5, дарвал тоон гар
│                                  │
│  ┌──────────┐                    │
│  │  📷      │  Явцын зураг       │  ← дармагц камер шууд нээгдэнэ
│  └──────────┘                    │
├──────────────────────────────────┤
│  ● Өнөөдөр   Явц   Дүгнэлт  ⚙    │
└──────────────────────────────────┘
```

- **Гүйлтийн өдөр:** CrossFit мөрний оронд
  `◯ Гүйлт   [ 30 ] мин   [ 5.0 ] км` — мөрийг дарахад тоон гар нээгдэнэ, минут оруулмагц ✓.
  Эхний 2 Бямбад: «Алхалт».
- **Ням:** PlanCard = «Амралт 🌿», жагсаалтын дээр том карт «Долоо хоногийн дүгнэлт бичих →».
- **Өглөөний banner:** өглөө нээхэд өчигдрийн «Утасгүй унтсан» бөглөгдөөгүй бол
  «Өчигдөр утасгүй унтсан уу? [Тийм] [Үгүй]» — нэг дарлтаар.
- **Бүрэн болоход:** checkmark-ууд дараалан «давалгаалж», тоолуурын доор жижиг цацраг/confetti
  (0.8 сек), haptic боломжтой бол. Нэг өдөрт зөвхөн нэг удаа (`completed_at`).
  `prefers-reduced-motion` бол энгийн fade.

### 4.2 Камер (бүтэн дэлгэц)

```
┌──────────────────────────────────┐
│  ✕            Урд  Хажуу  Ар     │  ← pose сонгох
│                                  │
│        ░░░░ (өмнөх зураг ░░      │  ← GhostOverlay 30% opacity
│        ░░░░  бүдгээр)    ░░      │    (ижил pose-ийн хамгийн сүүлийн)
│                                  │
│  Overlay ━━━━━●━━━━              │  ← opacity slider
│                                  │
│   [⟲ камер]   ( ◉ )   [⏱ 3с]    │  ← том shutter, timer
└──────────────────────────────────┘
```
- `getUserMedia` live preview + overlay → canvas-аас 1600px (урт тал) JPEG 0.85.
- Камерын зөвшөөрөл байхгүй/ажиллахгүй бол fallback: `<input type="file" accept="image/*" capture="environment">` (overlay-гүй) → мөн 1600px болгож жижигрүүлнэ.
- Авсны дараа «Дахин авах / Хадгалах».

### 4.3 Явц

```
┌──────────────────────────────────┐
│  Явц                             │
│  [ Жин | Бүсэлхий ]              │  ← segmented
│   82 ┤╲                          │
│   80 ┤ ╲__╱╲__                   │  ← MeasureChart (+7 хоногийн дундаж шугам)
│      └────────────────           │
│  −2.4 кг эхнээс                  │
├──────────────────────────────────┤
│  Өмнө / Одоо        [Урд ▾]      │
│  ┌──────────┃──────────┐         │  ← BeforeAfter: чирдэг slider
│  │ 10-05    ┃    01-14 │         │
│  └──────────┃──────────┘         │
├──────────────────────────────────┤
│  Төлөвлөгөө vs Бодит             │
│  CrossFit     41 / 45  ▓▓▓▓▓▓▓░  │  ← «өнөөдрийг хүртэлх төлөвлөгөө»
│  Гүйлт        38 / 44  ▓▓▓▓▓▓░░  │    болон нийт (103, 102)
│  Нийт км      186.5              │
│  Архигүй өдөр 98 / 102           │
│  Ном уншсан   90 / 102           │
├──────────────────────────────────┤
│  Календарь                       │
│  Ок ▪▪▪▪▪▪▪                      │  ← 239 өдрийн heatmap (7 мөр × 35 багана)
│  Но ▪▪▫▪▪▪▪   ▪ бүрэн ▫ хагас    │    нүд дарвал /day/[date]
│  ...          ▪ саарал = алдсан  │
├──────────────────────────────────┤
│  Зургийн timeline                │
│  ┌──┐┌──┐┌──┐┌──┐                │  ← огноогоор бүлэглэсэн grid,
│  10-05 10-12 10-19 ...           │    дарвал бүтэн дэлгэц
└──────────────────────────────────┘
```

### 4.4 Ням гарагийн дүгнэлт

```
┌──────────────────────────────────┐
│  Дүгнэлт · 7 хоног 1 (10-05–10-11)│
│  Энэ долоо хоног: 6/7 бүрэн,     │  ← товч статистик
│  CrossFit 3/3, гүйлт 2/3, 14.2 км│
│                                  │
│  Юу биелэв?                      │
│  ┌────────────────────────────┐  │
│  │                            │  │  ← auto-grow textarea, автоматаар хадгална
│  └────────────────────────────┘  │
│  Юу саад болов?                  │
│  ┌────────────────────────────┐  │
│  └────────────────────────────┘  │
│  Ирэх долоо хоногт юуг өөрчлөх вэ?│
│  ┌────────────────────────────┐  │
│  └────────────────────────────┘  │
├──────────────────────────────────┤
│  Өмнөх дүгнэлтүүд                │
│  ▸ 7 хоног 0 …                   │  ← карт, дарвал дэлгэрнэ
└──────────────────────────────────┘
```

### 4.5 Тохиргоо

```
┌──────────────────────────────────┐
│  Тохиргоо                        │
│  Сануулга 21:00          [ ● ]   │  ← асаахад push зөвшөөрөл асууна
│  Туршилтын мэдэгдэл илгээх  →    │
│  ⓘ Home screen-д нэмсэн үед л    │  ← standalone биш бол заавар харуулна
│    ажиллана (iOS 16.4+)          │
│                                  │
│  Харагдац  [Систем|Цайвар|Бараан]│
│                                  │
│  Экспорт                         │
│  [ JSON татах ]                  │
│  [ ZIP татах (зурагтай) ]        │  ← явцын мөр харуулна
│                                  │
│  Гарах                           │
└──────────────────────────────────┘
```
ZIP бүтэц: `data.json` (days, weekly_reviews, photos метадата) + `photos/2026-10-05_front.jpg …`.

---

## 5. Дизайны систем

- **Өнгө:** саарал (zinc) суурь + **нэг accent** — зуны дулаан улбар шар (`#F59E0B` төст, dark mode-д бага зэрэг тод). Алдсан өдөр = саарал. Улаан өнгө ашиглахгүй (буруутгах мэдрэмж төрүүлэхгүй).
- **Typography:** Golos Text; тоолуур 48–56px semibold, tabular-nums; бусад 17px (iOS-ийн стандарт).
- **Хүрэлтийн бүс:** ≥ 48×48px, мөр 56px; бүх гол товч доод хэсэгт.
- **iOS PWA:** `viewport-fit=cover`, `env(safe-area-inset-*)`, `apple-mobile-web-app-capable`, status bar өнгө theme-ээр, input-ийн фонт ≥16px (zoom үүсгэхгүй), `inputmode="decimal"`.
- **Accessibility:** contrast AA, `aria-pressed` toggle-д, reduced motion.

---

## 6. Хэрэгжүүлэх дараалал (баталсны дараа)

1. Next.js төсөл, Tailwind, фонт, PWA manifest + icon, tab bar
2. `supabase/migrations/0001_init.sql` + `docs/SUPABASE_SETUP.md` (алхам алхмаар заавар)
3. Login + middleware, `lib/program.ts` + unit test (239 өдөр, 103/102/34)
4. Өнөөдөр дэлгэц + өдөр засах + completion animation
5. Камер + overlay + resize + private upload + signed URL
6. Явц (график, slider, timeline, plan vs actual, heatmap)
7. Дүгнэлт
8. Тохиргоо: export, push + Edge Function + pg_cron
9. Vercel deploy, iPhone дээр турших

## 7. Supabase тохиргоо — товч тойм (дэлгэрэнгүйг 2-р алхамд)

1. supabase.com → New project (region: Singapore/Tokyo — УБ-д ойр)
2. SQL Editor → `0001_init.sql` ажиллуулах (хүснэгт, RLS, bucket, storage policy)
3. Authentication → Users → **Add user** (өөрийн имэйл + нууц үг, «Auto confirm»)
4. Authentication → Sign In / Providers → **Allow new users to sign up = OFF**
5. Project Settings → API → `URL` ба `anon key`-г `.env.local` болон Vercel-д
6. VAPID түлхүүр үүсгэх (`npx web-push generate-vapid-keys`) → Edge Function secrets
7. `supabase functions deploy daily-reminder` → Database → Extensions: `pg_cron`, `pg_net` → cron job

---

## 8. Батлах асуултууд

1. **Бүрэн өдрийн тодорхойлолт** (§0) зөв үү? Жин/бүсэлхий/зураг заавал биш байх нь OK юу? Жинг өдөр бүр үү, долоо хоногт нэг үү?
2. **Зураг:** өдөрт 3 pose (урд/хажуу/ар) хүртэл, эсвэл ганц зураг?
3. **Accent өнгө:** улбар шар (зун) OK юу, өөр өнгө хүсэх үү?
4. **Нэвтрэлт:** имэйл + нууц үг OK юу?
5. **Хугацаа:** Өдөр 1 = 2026-10-05, Өдөр 239 = 2027-05-31, 06-01 = «Зун» гэж ойлгосон нь зөв үү?

---

## 9. Хэрэгжүүлэлтийн явцад өөрчилсөн зүйлс

- **Next.js 16** (15 биш) — `middleware.ts` → `proxy.ts` болсон.
- **Serwist-ийн оронд гараар бичсэн `public/sw.js`** — Next 16-ийн Turbopack build-тэй найдвартай ажиллана, хамаарал цөөн.
- **Push илгээгч нь Supabase Edge Function биш, Next.js route (`/api/push/reminder`)** — Supabase CLI суулгах шаардлагагүй, бүх код нэг дор. `pg_cron` + `pg_net` 21:00-д дууддаг хэвээр.
- **`settings` хүснэгтгүй** — сануулга асаалттай эсэх = push subscription байгаа эсэх; theme нь төхөөрөмж дээр (localStorage).
- `photos` дээр `unique (user_id, date, pose)` — нэг өдөр нэг байрлалд нэг зураг; дахин авбал хуучныг солино.
- §8-ын асуултуудад хариулаагүй тул санал болгосон хувилбарыг авсан: жин/бүсэлхий/зураг заавал биш, өдөрт 3 байрлал, улбар шар accent, имэйл+нууц үг.
