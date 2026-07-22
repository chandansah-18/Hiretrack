-- Migration: Add selection/offer fields to offers table
-- Run this in Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/rzhhjeiyjvmtjyjzahbs/sql/new)

alter table public.offers add column if not exists bill_value numeric(12,2) not null default 0;
alter table public.offers add column if not exists selection_status text not null default 'Joining Pending';
