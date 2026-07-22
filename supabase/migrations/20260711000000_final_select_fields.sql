alter table public.candidates add column if not exists current_ctc numeric(12,2) not null default 0;
alter table public.candidates add column if not exists expected_ctc numeric(12,2) not null default 0;
alter table public.candidates add column if not exists notice_period text not null default '';
alter table public.candidates add column if not exists final_select_date date;
alter table public.candidates add column if not exists final_select_status text not null default 'Document Pending';
