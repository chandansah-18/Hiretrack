-- Repair corrupted Supabase auth rows for demo users.
-- Run in Supabase Dashboard -> SQL Editor, then POST /api/dev/repair-auth

begin;

delete from auth.identities
where user_id in (
  select id from auth.users
  where lower(email) in (
    'chandan.sah@huntsmenbarons.com',
    'aman.singh@huntsmenbarons.com',
    'riya.kapoor@huntsmenbarons.com',
    'arjun.patel@huntsmenbarons.com',
    'neha.rao@huntsmenbarons.com'
  )
);

delete from auth.users
where lower(email) in (
  'chandan.sah@huntsmenbarons.com',
  'aman.singh@huntsmenbarons.com',
  'riya.kapoor@huntsmenbarons.com',
  'arjun.patel@huntsmenbarons.com',
  'neha.rao@huntsmenbarons.com'
);

delete from public.profiles
where lower(display_name) in (
  'chandan sah',
  'aman singh',
  'riya kapoor',
  'arjun patel',
  'neha rao'
);

commit;
