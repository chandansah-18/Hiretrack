-- Expand entity_type check constraint to cover all values the app logs
alter table public.activity_log
  drop constraint if exists activity_log_entity_type_check;

alter table public.activity_log
  add constraint activity_log_entity_type_check
  check (entity_type in (
    'position', 'candidate', 'interview', 'offer', 'joining', 'role',
    'client', 'spoc', 'recruiter'
  ));
