-- =============================================================================
-- Fix RLS: Block self role escalation, restrict data writes/ownership
-- =============================================================================

-- Helper: get the current user's recruiter_id (derived from auth.uid())
create or replace function public.current_user_recruiter_id()
returns text
language plpgsql
stable
as $$
declare
  uid_text text;
begin
  uid_text := auth.uid()::text;
  return 'rec-' || left(replace(uid_text, '-', ''), 12);
end;
$$;

-- =============================================================================
-- PROFILES: prevent non-admin users from changing role or active
-- =============================================================================

drop policy if exists "profiles_update_own_or_admin" on public.profiles;

create policy "profiles_update_admin"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "profiles_update_self"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and active = (select p.active from public.profiles p where p.id = auth.uid())
  );

grant delete on public.profiles to authenticated;
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin"
  on public.profiles
  for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- POSITIONS: restrict writes — select all, delete admin only, insert/update own or admin
-- =============================================================================

drop policy if exists "positions_read_write_active" on public.positions;

create policy "positions_select_active"
  on public.positions
  for select
  to authenticated
  using (public.has_active_profile());

create policy "positions_insert_own_or_admin"
  on public.positions
  for insert
  to authenticated
  with check (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()));

create policy "positions_update_own_or_admin"
  on public.positions
  for update
  to authenticated
  using (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()))
  with check (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()));

create policy "positions_delete_admin"
  on public.positions
  for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- CANDIDATES: restrict writes
-- =============================================================================

drop policy if exists "candidates_read_write_active" on public.candidates;

create policy "candidates_select_active"
  on public.candidates
  for select
  to authenticated
  using (public.has_active_profile());

create policy "candidates_insert_own_or_admin"
  on public.candidates
  for insert
  to authenticated
  with check (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()));

create policy "candidates_update_own_or_admin"
  on public.candidates
  for update
  to authenticated
  using (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()))
  with check (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()));

create policy "candidates_delete_admin"
  on public.candidates
  for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- INTERVIEWS: restrict writes
-- =============================================================================

drop policy if exists "interviews_read_write_active" on public.interviews;

create policy "interviews_select_active"
  on public.interviews
  for select
  to authenticated
  using (public.has_active_profile());

create policy "interviews_insert_own_or_admin"
  on public.interviews
  for insert
  to authenticated
  with check (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()));

create policy "interviews_update_own_or_admin"
  on public.interviews
  for update
  to authenticated
  using (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()))
  with check (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()));

create policy "interviews_delete_admin"
  on public.interviews
  for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- OFFERS: restrict writes
-- =============================================================================

drop policy if exists "offers_read_write_active" on public.offers;

create policy "offers_select_active"
  on public.offers
  for select
  to authenticated
  using (public.has_active_profile());

create policy "offers_insert_own_or_admin"
  on public.offers
  for insert
  to authenticated
  with check (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()));

create policy "offers_update_own_or_admin"
  on public.offers
  for update
  to authenticated
  using (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()))
  with check (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()));

create policy "offers_delete_admin"
  on public.offers
  for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- JOININGS: restrict writes
-- =============================================================================

drop policy if exists "joinings_read_write_active" on public.joinings;

create policy "joinings_select_active"
  on public.joinings
  for select
  to authenticated
  using (public.has_active_profile());

create policy "joinings_insert_own_or_admin"
  on public.joinings
  for insert
  to authenticated
  with check (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()));

create policy "joinings_update_own_or_admin"
  on public.joinings
  for update
  to authenticated
  using (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()))
  with check (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()));

create policy "joinings_delete_admin"
  on public.joinings
  for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- CV_SHARED_ENTRIES: restrict writes (no recruiter_id, so admin-only writes)
-- =============================================================================

drop policy if exists "cv_shared_entries_read_write_active" on public.cv_shared_entries;

create policy "cv_shared_entries_select_active"
  on public.cv_shared_entries
  for select
  to authenticated
  using (public.has_active_profile());

create policy "cv_shared_entries_insert_admin"
  on public.cv_shared_entries
  for insert
  to authenticated
  with check (public.is_admin());

create policy "cv_shared_entries_update_admin"
  on public.cv_shared_entries
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "cv_shared_entries_delete_admin"
  on public.cv_shared_entries
  for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- LEAVES: restrict writes
-- =============================================================================

drop policy if exists "leaves_read_write_active" on public.leaves;

create policy "leaves_select_active"
  on public.leaves
  for select
  to authenticated
  using (public.has_active_profile());

create policy "leaves_insert_own_or_admin"
  on public.leaves
  for insert
  to authenticated
  with check (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()));

create policy "leaves_update_own_or_admin"
  on public.leaves
  for update
  to authenticated
  using (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()))
  with check (public.has_active_profile() and (public.is_admin() or recruiter_id = public.current_user_recruiter_id()));

create policy "leaves_delete_admin"
  on public.leaves
  for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- ACTIVITY_LOG: admin-only writes, all active can read
-- =============================================================================

drop policy if exists "activity_log_read_write_active" on public.activity_log;

create policy "activity_log_select_active"
  on public.activity_log
  for select
  to authenticated
  using (public.has_active_profile());

create policy "activity_log_insert_admin"
  on public.activity_log
  for insert
  to authenticated
  with check (public.is_admin());

create policy "activity_log_update_admin"
  on public.activity_log
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "activity_log_delete_admin"
  on public.activity_log
  for delete
  to authenticated
  using (public.is_admin());
