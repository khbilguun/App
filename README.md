# Зун 2027

«2027 оны зун гэхэд» — хувийн өдөр тутмын checklist PWA. 2026.10.05 → 2027.05.31, 239 өдөр.

- **Өнөөдөр** — тоолуур, төлөвлөгөө, checklist, жин/бүсэлхий, явцын зураг (overlay-тэй камер)
- **Явц** — график, өмнө/одоо slider, төлөвлөгөө vs бодит, календарь heatmap, зургийн timeline
- **Дүгнэлт** — Ням гарагийн 3 асуулт, өмнөх дүгнэлтүүд
- **Тохиргоо** — 21:00 push сануулга, JSON/ZIP экспорт, theme

Stack: Next.js 16 · TypeScript · Tailwind v4 · Supabase (Auth, Postgres+RLS, private Storage) · Web Push.

## Эхлэх

Тохиргооны заавар: **[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)**. Анхны төлөвлөгөө: [docs/PLAN.md](docs/PLAN.md).

```bash
npm install
cp .env.example .env.local
npm run dev
npm test        # хөтөлбөр/огнооны unit test
```

## Бүтэц

```
app/(app)/            Өнөөдөр, day/[date], progress, review, settings (доод tab bar-тай)
app/camera/           Бүтэн дэлгэцийн камер + overlay
app/login/            Нэвтрэх
app/api/push/         reminder (cron) · test
components/           today · camera · progress · review · ui
lib/program.ts        239 өдрийн хөтөлбөр (цэвэр функц)
lib/completion.ts     Өдрийн төлөв: бүрэн / хагас / алдсан
lib/data.ts           Supabase query, signed URL
proxy.ts              Session шинэчлэх, нэвтрээгүй бол /login
public/sw.js          Service worker (офлайн shell + push)
supabase/migrations/  SQL
```
