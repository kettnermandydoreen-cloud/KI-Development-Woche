-- Im Supabase Dashboard unter SQL Editor einmal ausführen.
-- Harmlose Funktion für den n8n-Workflow "Supabase wachhalten":
-- Sie liefert nur "ok" zurück, liest keine Tabellen und gibt keine Daten preis.
create or replace function public.ping()
returns text
language sql
stable
security invoker
set search_path = ''
as $$ select 'ok'::text $$;

revoke all on function public.ping() from public;
grant execute on function public.ping() to anon;
