create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_token text not null unique,
  tab_id text not null,
  user_agent text not null default '',
  ip_address text not null default '',
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_user_sessions_user_id on public.user_sessions (user_id);
create index if not exists idx_user_sessions_token on public.user_sessions (session_token);
create index if not exists idx_user_sessions_last_seen on public.user_sessions (last_seen_at);

alter table public.user_sessions enable row level security;

grant select, insert, update, delete on public.user_sessions to authenticated;

create or replace function public.count_active_sessions(p_user_id uuid)
returns integer
language plpgsql
stable
as $$
begin
  return (
    select count(*) from public.user_sessions
    where user_id = p_user_id
      and last_seen_at > now() - interval '24 hours'
  );
end;
$$;

drop policy if exists "user_sessions_own" on public.user_sessions;
create policy "user_sessions_own"
  on public.user_sessions
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "user_sessions_admin" on public.user_sessions;
create policy "user_sessions_admin"
  on public.user_sessions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
