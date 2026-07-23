-- =============================================================================
-- Fix recruiter RLS ID mismatch by resolving recruiter profile by email
-- =============================================================================

create or replace function public.current_user_recruiter_id()
returns text
language plpgsql
stable
as $$
declare
  rec_id text;
  user_email text;
  uid_text text;
begin
  -- First, attempt to resolve the recruiter ID dynamically using the current user's email from the JWT
  user_email := auth.jwt() ->> 'email';
  if user_email is not null then
    select id into rec_id
    from public.recruiters
    where lower(email) = lower(user_email)
    limit 1;
  end if;

  -- Fallback to the standard derived ID format if no recruiter profile exists with this email yet
  if rec_id is null then
    uid_text := auth.uid()::text;
    rec_id := 'rec-' || left(replace(uid_text, '-', ''), 12);
  end if;

  return rec_id;
end;
$$;
