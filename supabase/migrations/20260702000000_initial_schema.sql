create schema if not exists private;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role text not null default 'recruiter',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_user_role()
returns text
language plpgsql
stable
as $$
declare
  next_role text;
begin
  select p.role into next_role
  from public.profiles p
  where p.id = auth.uid()
  limit 1;

  return next_role;
end;
$$;

create or replace function public.is_admin()
returns boolean
language plpgsql
stable
as $$
begin
  return coalesce(public.current_user_role() = 'admin', false);
end;
$$;

create or replace function public.has_active_profile()
returns boolean
language plpgsql
stable
as $$
declare
  has_profile boolean;
begin
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
  ) into has_profile;

  return coalesce(has_profile, false);
end;
$$;

create table if not exists public.recruiters (
  id text primary key,
  name text not null,
  email text not null,
  vertical text not null,
  target integer not null default 0,
  active boolean not null default true,
  can_edit boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id text primary key,
  name text not null,
  industry text not null,
  owner_recruiter_id text not null references public.recruiters (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.spocs (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  name text not null,
  email text not null,
  recruiter_id text not null references public.recruiters (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.positions (
  id text primary key,
  name text not null,
  client_id text not null references public.clients (id) on delete cascade,
  recruiter_id text not null references public.recruiters (id) on delete restrict,
  spoc_id text not null references public.spocs (id) on delete restrict,
  vertical text not null,
  technology text not null,
  status text not null,
  open_date date not null,
  openings integer not null default 1,
  ctc numeric(12, 2) not null default 0,
  location text[] not null default '{}',
  manual_cv_count integer,
  remarks text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidates (
  id text primary key,
  name text not null,
  contact_no text not null,
  position_id text not null references public.positions (id) on delete cascade,
  client_id text not null references public.clients (id) on delete cascade,
  recruiter_id text not null references public.recruiters (id) on delete restrict,
  spoc_id text not null references public.spocs (id) on delete restrict,
  technology text not null,
  stage text not null,
  submitted_at date not null,
  source text not null,
  remarks text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interviews (
  id text primary key,
  candidate_id text not null references public.candidates (id) on delete cascade,
  position_id text not null references public.positions (id) on delete cascade,
  client_id text not null references public.clients (id) on delete cascade,
  recruiter_id text not null references public.recruiters (id) on delete restrict,
  interview_date date not null,
  time text not null,
  round text not null,
  status text not null,
  feedback_due date not null,
  remarks text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.offers (
  id text primary key,
  candidate_id text not null references public.candidates (id) on delete cascade,
  position_id text not null references public.positions (id) on delete cascade,
  recruiter_id text not null references public.recruiters (id) on delete restrict,
  client_id text not null references public.clients (id) on delete cascade,
  status text not null,
  offer_date date not null,
  ctc numeric(12, 2) not null default 0,
  remarks text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.joinings (
  id text primary key,
  candidate_id text not null references public.candidates (id) on delete cascade,
  position_id text not null references public.positions (id) on delete cascade,
  recruiter_id text not null references public.recruiters (id) on delete restrict,
  client_id text not null references public.clients (id) on delete cascade,
  status text not null,
  joining_date date not null,
  remarks text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cv_shared_entries (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  month text not null,
  count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_log (
  id text primary key,
  timestamp timestamptz not null default now(),
  actor_role text not null,
  actor_name text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  entity_name text not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'recruiter'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.activity_log add constraint activity_log_entity_type_check check (entity_type in ('position', 'candidate', 'interview', 'offer', 'joining', 'role'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.profiles add constraint profiles_display_name_not_empty check (length(trim(display_name)) > 0);
exception
  when duplicate_object then null;
end $$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_recruiters_updated_at on public.recruiters;
create trigger touch_recruiters_updated_at
before update on public.recruiters
for each row execute function public.touch_updated_at();

drop trigger if exists touch_clients_updated_at on public.clients;
create trigger touch_clients_updated_at
before update on public.clients
for each row execute function public.touch_updated_at();

drop trigger if exists touch_spocs_updated_at on public.spocs;
create trigger touch_spocs_updated_at
before update on public.spocs
for each row execute function public.touch_updated_at();

drop trigger if exists touch_positions_updated_at on public.positions;
create trigger touch_positions_updated_at
before update on public.positions
for each row execute function public.touch_updated_at();

drop trigger if exists touch_candidates_updated_at on public.candidates;
create trigger touch_candidates_updated_at
before update on public.candidates
for each row execute function public.touch_updated_at();

drop trigger if exists touch_interviews_updated_at on public.interviews;
create trigger touch_interviews_updated_at
before update on public.interviews
for each row execute function public.touch_updated_at();

drop trigger if exists touch_offers_updated_at on public.offers;
create trigger touch_offers_updated_at
before update on public.offers
for each row execute function public.touch_updated_at();

drop trigger if exists touch_joinings_updated_at on public.joinings;
create trigger touch_joinings_updated_at
before update on public.joinings
for each row execute function public.touch_updated_at();

drop trigger if exists touch_cv_shared_entries_updated_at on public.cv_shared_entries;
create trigger touch_cv_shared_entries_updated_at
before update on public.cv_shared_entries
for each row execute function public.touch_updated_at();

drop trigger if exists touch_activity_log_updated_at on public.activity_log;
create trigger touch_activity_log_updated_at
before update on public.activity_log
for each row execute function public.touch_updated_at();

create or replace function private.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  next_role text;
  next_name text;
begin
  next_role := coalesce(new.raw_user_meta_data->>'role', 'recruiter');
  next_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, 'user'), '@', 1)
  );

  insert into public.profiles (id, display_name, role, active)
  values (new.id, next_name, next_role, true)
  on conflict (id) do update
    set display_name = excluded.display_name,
        role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.sync_profile_from_auth_user();

alter table public.profiles enable row level security;
alter table public.recruiters enable row level security;
alter table public.clients enable row level security;
alter table public.spocs enable row level security;
alter table public.positions enable row level security;
alter table public.candidates enable row level security;
alter table public.interviews enable row level security;
alter table public.offers enable row level security;
alter table public.joinings enable row level security;
alter table public.cv_shared_entries enable row level security;
alter table public.activity_log enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.recruiters to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.spocs to authenticated;
grant select, insert, update, delete on public.positions to authenticated;
grant select, insert, update, delete on public.candidates to authenticated;
grant select, insert, update, delete on public.interviews to authenticated;
grant select, insert, update, delete on public.offers to authenticated;
grant select, insert, update, delete on public.joinings to authenticated;
grant select, insert, update, delete on public.cv_shared_entries to authenticated;
grant select, insert, update, delete on public.activity_log to authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own_or_admin" on public.profiles;
create policy "profiles_insert_own_or_admin"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "recruiters_select_active" on public.recruiters;
create policy "recruiters_select_active"
  on public.recruiters
  for select
  to authenticated
  using (public.has_active_profile());

drop policy if exists "recruiters_write_admin" on public.recruiters;
create policy "recruiters_write_admin"
  on public.recruiters
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "clients_select_active" on public.clients;
create policy "clients_select_active"
  on public.clients
  for select
  to authenticated
  using (public.has_active_profile());

drop policy if exists "clients_write_admin" on public.clients;
create policy "clients_write_admin"
  on public.clients
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "spocs_select_active" on public.spocs;
create policy "spocs_select_active"
  on public.spocs
  for select
  to authenticated
  using (public.has_active_profile());

drop policy if exists "spocs_write_admin" on public.spocs;
create policy "spocs_write_admin"
  on public.spocs
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "positions_read_write_active" on public.positions;
create policy "positions_read_write_active"
  on public.positions
  for all
  to authenticated
  using (public.has_active_profile())
  with check (public.has_active_profile());

drop policy if exists "candidates_read_write_active" on public.candidates;
create policy "candidates_read_write_active"
  on public.candidates
  for all
  to authenticated
  using (public.has_active_profile())
  with check (public.has_active_profile());

drop policy if exists "interviews_read_write_active" on public.interviews;
create policy "interviews_read_write_active"
  on public.interviews
  for all
  to authenticated
  using (public.has_active_profile())
  with check (public.has_active_profile());

drop policy if exists "offers_read_write_active" on public.offers;
create policy "offers_read_write_active"
  on public.offers
  for all
  to authenticated
  using (public.has_active_profile())
  with check (public.has_active_profile());

drop policy if exists "joinings_read_write_active" on public.joinings;
create policy "joinings_read_write_active"
  on public.joinings
  for all
  to authenticated
  using (public.has_active_profile())
  with check (public.has_active_profile());

drop policy if exists "cv_shared_entries_read_write_active" on public.cv_shared_entries;
create policy "cv_shared_entries_read_write_active"
  on public.cv_shared_entries
  for all
  to authenticated
  using (public.has_active_profile())
  with check (public.has_active_profile());

drop policy if exists "activity_log_read_write_active" on public.activity_log;
create policy "activity_log_read_write_active"
  on public.activity_log
  for all
  to authenticated
  using (public.has_active_profile())
  with check (public.has_active_profile());
