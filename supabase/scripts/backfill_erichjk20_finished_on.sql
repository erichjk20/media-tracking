-- One-time, account-specific backfill authorized by erichjk20@gmail.com.
-- Run in the Supabase SQL editor. Safe to rerun: existing finished dates stay intact.
-- For Done items, prefer the last shelf/status change (including historical
-- timestamps backfilled from added_at), then fall back to the original added date.
-- Convert timestamps to the user's local calendar day rather than the DB's UTC day.

begin;

alter table public.library_items
add column if not exists finished_on date;

alter table public.library_items
add column if not exists finished_month text;

do $$
declare
  target_user_id uuid;
  updated_count integer;
begin
  select id into strict target_user_id
  from auth.users
  where lower(email) = 'erichjk20@gmail.com';

  update public.library_items
  set finished_on = (
    coalesce(status_changed_at, added_at) at time zone 'America/Los_Angeles'
  )::date
  where user_id = target_user_id
    and status = 'completed'
    and finished_on is null
    and finished_month is null
    and coalesce(status_changed_at, added_at) is not null;

  get diagnostics updated_count = row_count;
  raise notice 'Filled watched/finished dates for % Done items.', updated_count;
end;
$$;

-- Review the resulting totals for this account only.
select
  count(*) filter (where items.status = 'completed') as done_items,
  count(*) filter (
    where items.status = 'completed' and (items.finished_on is not null or items.finished_month is not null)
  ) as done_items_with_finished_date,
  count(*) filter (
    where items.status = 'completed' and items.finished_on is null and items.finished_month is null
  ) as done_items_still_undated
from public.library_items as items
join auth.users as users on users.id = items.user_id
where lower(users.email) = 'erichjk20@gmail.com';

commit;
