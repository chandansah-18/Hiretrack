create table if not exists public.leaves (
  id text primary key,
  recruiter_id text not null references public.recruiters (id) on delete cascade,
  date text not null,
  type text not null,
  marked_by text not null,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'touch_leaves_updated_at'
      and tgrelid = 'public.leaves'::regclass
  ) then
    create trigger touch_leaves_updated_at
      before update on public.leaves
      for each row
      execute function public.touch_updated_at();
  end if;
end;
$$;

alter table public.leaves enable row level security;

drop policy if exists "leaves_read_write_active" on public.leaves;
create policy "leaves_read_write_active"
  on public.leaves
  for all
  to authenticated
  using (public.has_active_profile())
  with check (public.has_active_profile());

alter table public.recruiters add column if not exists designation text;
alter table public.recruiters add column if not exists contact_no text;
alter table public.recruiters add column if not exists birthday text;
