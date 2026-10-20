-- Run in the Supabase SQL editor before deploying the date tracking UI.
-- No backfill: legacy status timestamps do not reliably mean watched/read dates.
alter table public.library_items
add column if not exists finished_on date;
