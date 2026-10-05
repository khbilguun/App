-- 21:00 (УБ) сануулга. App-аа Vercel дээр deploy хийсний ДАРАА ажиллуулна.
-- 1) Database → Extensions: pg_cron, pg_net хоёрыг асаана (эсвэл доорх 2 мөр).
-- 2) <APP_URL> ба <CRON_SECRET>-ийг өөрийн утгаар солино.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Нууц утгыг Vault-д хадгална (SQL-д ил бичихгүйн тулд)
select vault.create_secret('<CRON_SECRET>', 'reminder_cron_secret');

-- 13:00 UTC = 21:00 Улаанбаатар
select cron.schedule(
  'daily-reminder',
  '0 13 * * *',
  $$
  select net.http_post(
    url := '<APP_URL>/api/push/reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'reminder_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Шалгах:   select * from cron.job;
-- Түүх:     select * from cron.job_run_details order by start_time desc limit 5;
-- Устгах:   select cron.unschedule('daily-reminder');
