-- «2027 оны зун гэхэд» — анхны schema
-- Supabase → SQL Editor дээр бүхэлд нь хуулж ажиллуулна.

-- ───────────── Өдөр бүрийн бичлэг ─────────────
create table if not exists public.days (
  user_id          uuid not null default auth.uid() references auth.users on delete cascade,
  date             date not null check (date between '2026-10-05' and '2027-05-31'),
  crossfit         boolean not null default false,
  run_minutes      smallint check (run_minutes >= 0),
  run_km           numeric(5,2) check (run_km >= 0),
  no_alcohol       boolean not null default false,
  reading          boolean not null default false,
  skincare         boolean not null default false,
  phone_free_sleep boolean not null default false,
  weight_kg        numeric(5,2) check (weight_kg between 20 and 300),
  waist_cm         numeric(5,1) check (waist_cm between 30 and 250),
  note             text,
  completed_at     timestamptz,
  updated_at       timestamptz not null default now(),
  primary key (user_id, date)
);

-- ───────────── Явцын зураг (файл нь storage-д) ─────────────
create table if not exists public.photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  date         date not null,
  pose         text not null default 'front' check (pose in ('front','side','back')),
  storage_path text not null unique,
  width        int,
  height       int,
  created_at   timestamptz not null default now(),
  unique (user_id, date, pose)
);
create index if not exists photos_user_date on public.photos (user_id, date);

-- ───────────── Ням гарагийн дүгнэлт ─────────────
create table if not exists public.weekly_reviews (
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  week_start  date not null check (extract(isodow from week_start) = 1),
  went_well   text,
  obstacles   text,
  change_next text,
  updated_at  timestamptz not null default now(),
  primary key (user_id, week_start)
);

-- ───────────── Push subscription ─────────────
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

-- ───────────── updated_at автоматаар ─────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists days_touch on public.days;
create trigger days_touch before update on public.days
  for each row execute function public.touch_updated_at();

drop trigger if exists reviews_touch on public.weekly_reviews;
create trigger reviews_touch before update on public.weekly_reviews
  for each row execute function public.touch_updated_at();

-- ───────────── Row Level Security: зөвхөн өөрийн мөр ─────────────
alter table public.days               enable row level security;
alter table public.photos             enable row level security;
alter table public.weekly_reviews     enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "own rows" on public.days;
create policy "own rows" on public.days for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "own rows" on public.photos;
create policy "own rows" on public.photos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "own rows" on public.weekly_reviews;
create policy "own rows" on public.weekly_reviews for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "own rows" on public.push_subscriptions;
create policy "own rows" on public.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ───────────── Private storage bucket ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress-photos', 'progress-photos', false, 10485760, array['image/jpeg'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Зам: {user_id}/{date}/{pose}-{uuid}.jpg — эхний хавтас нь өөрийн id байх ёстой
drop policy if exists "photos select own" on storage.objects;
create policy "photos select own" on storage.objects for select to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "photos insert own" on storage.objects;
create policy "photos insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "photos update own" on storage.objects;
create policy "photos update own" on storage.objects for update to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "photos delete own" on storage.objects;
create policy "photos delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
