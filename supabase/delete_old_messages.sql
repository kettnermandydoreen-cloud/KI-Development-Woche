-- Automatische Löschung der Formular-Nachrichten nach 6 Monaten.
-- Im Supabase Dashboard unter SQL Editor einmal ausführen (Inhalt der Datei einfügen, nicht den Pfad).
-- Der Zeitplaner pg_cron läuft in der Datenbank selbst, es wird kein Schlüssel und kein n8n gebraucht.

create extension if not exists pg_cron with schema pg_catalog;

-- Jeden Sonntag um 03:00 Uhr (UTC) werden Nachrichten gelöscht, die älter als 6 Monate sind.
-- Der Name ist eindeutig: erneutes Ausführen ersetzt den Job statt ihn doppelt anzulegen.
select cron.schedule(
  'delete-old-contact-messages',
  '0 3 * * 0',
  $$ delete from public.contact_messages where created_at < now() - interval '6 months' $$
);

-- Kontrolle: Der Job muss mit active = true erscheinen.
-- select jobid, jobname, schedule, active from cron.job;

-- Letzte Läufe ansehen (nach dem ersten Sonntag):
-- select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;

-- Test der Löschlogik (optional, einmalig, danach wieder entfernen):
-- insert into public.contact_messages (name, email, message, consent, created_at)
--   values ('TEST alt', 'test@example.com', 'Testzeile, älter als 6 Monate.', true, now() - interval '7 months');
-- delete from public.contact_messages where created_at < now() - interval '6 months';   -- löscht die Testzeile

-- Löschanfrage einer Person (Art. 17 DSGVO): alle Nachrichten einer E-Mail-Adresse löschen.
-- delete from public.contact_messages where lower(email) = lower('adresse@beispiel.de');

-- Job wieder entfernen:
-- select cron.unschedule('delete-old-contact-messages');
