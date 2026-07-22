alter table public.candidates add column if not exists holding_offer_ctc numeric(12,2) not null default 0;
alter table public.candidates add column if not exists holding_offer_company text not null default '';
alter table public.candidates add column if not exists holding_offer_doj text not null default '';
