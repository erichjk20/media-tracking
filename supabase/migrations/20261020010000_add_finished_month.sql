-- Run after the finished_on migration (also safe when that column is absent).
-- Store a month without inventing an exact calendar day.
begin;

alter table public.library_items
add column if not exists finished_on date;

alter table public.library_items
add column if not exists finished_month text;

alter table public.library_items
drop constraint if exists library_items_finished_month_check;

alter table public.library_items
add constraint library_items_finished_month_check check (
  (finished_on is null or finished_month is null)
  and (
    finished_month is null
    or (
      status = 'completed'
      and finished_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
      and left(finished_month, 4) <> '0000'
    )
  )
);

commit;
