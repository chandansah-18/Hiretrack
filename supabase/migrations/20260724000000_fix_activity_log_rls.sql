-- =============================================================================
-- Fix activity_log RLS: allow all active profiles to insert, not just admins
-- =============================================================================

-- Drop the admin-only insert policy
drop policy if exists "activity_log_insert_admin" on public.activity_log;

-- Create a new policy that allows all authenticated users with active profiles to insert
create policy "activity_log_insert_active"
  on public.activity_log
  for insert
  to authenticated
  with check (public.has_active_profile());

-- Also fix the UPDATE policy similarly (so users can update their own entries if needed)
drop policy if exists "activity_log_update_admin" on public.activity_log;
create policy "activity_log_update_active"
  on public.activity_log
  for update
  to authenticated
  using (public.has_active_profile())
  with check (public.has_active_profile());

-- DELETE remains admin-only (audit trail integrity)
drop policy if exists "activity_log_delete_admin" on public.activity_log;
create policy "activity_log_delete_admin"
  on public.activity_log
  for delete
  to authenticated
  using (public.is_admin());
