-- =============================================================================
-- Performance indexes, soft-archive columns, storage helpers, RLS corrections
-- =============================================================================

-- Soft-archive: hide from hot path without immediate hard delete
alter table public.candidates add column if not exists archived_at timestamptz;
alter table public.interviews add column if not exists archived_at timestamptz;
alter table public.positions add column if not exists archived_at timestamptz;
alter table public.offers add column if not exists archived_at timestamptz;
alter table public.joinings add column if not exists archived_at timestamptz;

-- Hot-path indexes
create index if not exists idx_candidates_submitted_at on public.candidates (submitted_at desc);
create index if not exists idx_candidates_recruiter_id on public.candidates (recruiter_id);
create index if not exists idx_candidates_client_id on public.candidates (client_id);
create index if not exists idx_candidates_stage on public.candidates (stage);
create index if not exists idx_candidates_archived_at on public.candidates (archived_at) where archived_at is null;

create index if not exists idx_interviews_interview_date on public.interviews (interview_date desc);
create index if not exists idx_interviews_recruiter_id on public.interviews (recruiter_id);
create index if not exists idx_interviews_candidate_id on public.interviews (candidate_id);
create index if not exists idx_interviews_archived_at on public.interviews (archived_at) where archived_at is null;

create index if not exists idx_positions_open_date on public.positions (open_date desc);
create index if not exists idx_positions_recruiter_id on public.positions (recruiter_id);
create index if not exists idx_positions_client_id on public.positions (client_id);
create index if not exists idx_positions_archived_at on public.positions (archived_at) where archived_at is null;

create index if not exists idx_offers_offer_date on public.offers (offer_date desc);
create index if not exists idx_offers_recruiter_id on public.offers (recruiter_id);
create index if not exists idx_joinings_joining_date on public.joinings (joining_date desc);
create index if not exists idx_activity_log_timestamp on public.activity_log (timestamp desc);
create index if not exists idx_leaves_date on public.leaves (date desc);
create index if not exists idx_leaves_recruiter_id on public.leaves (recruiter_id);

-- Activity log: any active user may append their own actions (required for recruiter saves)
drop policy if exists "activity_log_insert_admin" on public.activity_log;
create policy "activity_log_insert_active"
  on public.activity_log
  for insert
  to authenticated
  with check (public.has_active_profile());

-- CV shared: active users can write (used on vertical/dashboard flows)
drop policy if exists "cv_shared_entries_insert_admin" on public.cv_shared_entries;
drop policy if exists "cv_shared_entries_update_admin" on public.cv_shared_entries;
create policy "cv_shared_entries_insert_active"
  on public.cv_shared_entries
  for insert
  to authenticated
  with check (public.has_active_profile());
create policy "cv_shared_entries_update_active"
  on public.cv_shared_entries
  for update
  to authenticated
  using (public.has_active_profile())
  with check (public.has_active_profile());

-- Storage / table size stats for admin UI (service role or admin via RPC)
create or replace function public.get_dashboard_storage_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'databaseBytes', (
      select coalesce(sum(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(relname))), 0)
      from pg_stat_user_tables
      where schemaname = 'public'
    ),
    'tables', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'name', relname,
          'bytes', pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(relname)),
          'rows', n_live_tup
        )
        order by pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(relname)) desc
      ), '[]'::jsonb)
      from pg_stat_user_tables
      where schemaname = 'public'
    ),
    'candidates', (select count(*) from public.candidates where archived_at is null),
    'candidatesArchived', (select count(*) from public.candidates where archived_at is not null),
    'interviews', (select count(*) from public.interviews where archived_at is null),
    'oldestCandidate', (select min(submitted_at)::text from public.candidates where archived_at is null),
    'newestCandidate', (select max(submitted_at)::text from public.candidates where archived_at is null)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_dashboard_storage_stats() from public;
grant execute on function public.get_dashboard_storage_stats() to authenticated;

-- Soft-archive closed pipeline older than cutoff (admin only)
create or replace function public.archive_closed_candidates(before_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  archived_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  update public.candidates
  set archived_at = now()
  where archived_at is null
    and submitted_at < before_date
    and stage in ('Joined', 'Rejected', 'Drop', 'Screen Reject', 'Duplicate');

  get diagnostics archived_count = row_count;

  update public.interviews i
  set archived_at = now()
  where i.archived_at is null
    and exists (
      select 1 from public.candidates c
      where c.id = i.candidate_id and c.archived_at is not null
    );

  update public.offers o
  set archived_at = now()
  where o.archived_at is null
    and exists (
      select 1 from public.candidates c
      where c.id = o.candidate_id and c.archived_at is not null
    );

  update public.joinings j
  set archived_at = now()
  where j.archived_at is null
    and exists (
      select 1 from public.candidates c
      where c.id = j.candidate_id and c.archived_at is not null
    );

  return jsonb_build_object('archivedCandidates', archived_count, 'beforeDate', before_date);
end;
$$;

revoke all on function public.archive_closed_candidates(date) from public;
grant execute on function public.archive_closed_candidates(date) to authenticated;

-- Purge already-archived rows older than cutoff (admin only; run AFTER export)
create or replace function public.purge_archived_candidates(before_date date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  delete from public.candidates
  where archived_at is not null
    and archived_at < before_date::timestamptz;

  get diagnostics deleted_count = row_count;

  return jsonb_build_object('purgedCandidates', deleted_count, 'beforeDate', before_date);
end;
$$;

revoke all on function public.purge_archived_candidates(date) from public;
grant execute on function public.purge_archived_candidates(date) to authenticated;
