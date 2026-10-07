-- Im Supabase Dashboard unter SQL Editor ausführen.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 5 and 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message text not null check (char_length(message) between 10 and 4000),
  consent boolean not null check (consent = true)
);

alter table public.contact_messages enable row level security;

-- Besucher dürfen nur einfügen, nie lesen, ändern oder löschen.
drop policy if exists "anon can insert" on public.contact_messages;
create policy "anon can insert" on public.contact_messages
  for insert to anon with check (true);

revoke all on public.contact_messages from anon, authenticated;
grant insert on public.contact_messages to anon;
