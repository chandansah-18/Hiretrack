alter table public.candidates add column if not exists email_id text not null default '';
alter table public.candidates add column if not exists current_company text not null default '';
alter table public.candidates add column if not exists experience numeric(4,1) not null default 0;
alter table public.candidates add column if not exists location text not null default '';
alter table public.candidates add column if not exists requisition_id text not null default '';
