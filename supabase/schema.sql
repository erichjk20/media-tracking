-- User Profiles
-- Creates one profile row per Supabase Auth user and keeps the profile email in sync.

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email, ''), '@', 1)), '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.user_profiles.display_name, excluded.display_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

-- Core Library Table
-- Stores fields shared by every tracked media item.

create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  category text not null check (category in ('books', 'movies', 'tv', 'manga')),
  subtype text check (
    subtype is null
    or subtype in ('book', 'korean-book', 'movie', 'anime-movie', 'korean-movie', 'tv', 'anime', 'kdrama')
  ),
  status text not null check (status in ('completed', 'want')),
  status_changed_at timestamptz not null default now(),
  title text not null,
  creator text,
  director text,
  genre text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  rating integer check (rating between 1 and 5),
  synopsis text,
  notes text,
  image_url text,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'completed' or rating is null)
);

alter table public.library_items
add column if not exists director text;

alter table public.library_items
add column if not exists genre text;

alter table public.library_items
add column if not exists duration_minutes integer;

alter table public.library_items
add column if not exists synopsis text;

alter table public.library_items
add column if not exists status_changed_at timestamptz;

update public.library_items
set status_changed_at = coalesce(status_changed_at, added_at, now())
where status_changed_at is null;

alter table public.library_items
alter column status_changed_at set default now();

alter table public.library_items
alter column status_changed_at set not null;

alter table public.library_items
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.library_items
alter column user_id set default auth.uid();

alter table public.library_items
drop constraint if exists library_items_subtype_check;

alter table public.library_items
add constraint library_items_subtype_check
check (
  subtype is null
  or subtype in ('book', 'korean-book', 'movie', 'anime-movie', 'korean-movie', 'tv', 'anime', 'kdrama')
);

alter table public.library_items
drop constraint if exists library_items_duration_minutes_check;

alter table public.library_items
add constraint library_items_duration_minutes_check
check (duration_minutes is null or duration_minutes > 0);

-- Category Detail Tables
-- Stores category-specific facts separately from the shared library item row.

create table if not exists public.movie_details (
  library_item_id uuid primary key references public.library_items(id) on delete cascade,
  movie_title text,
  director text,
  genre text,
  release_year integer check (release_year is null or release_year between 1800 and 2100),
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.movie_details
add column if not exists movie_title text;

alter table public.movie_details
add column if not exists release_year integer;

alter table public.movie_details
drop constraint if exists movie_details_release_year_check;

alter table public.movie_details
add constraint movie_details_release_year_check
check (release_year is null or release_year between 1800 and 2100);

create table if not exists public.book_details (
  library_item_id uuid primary key references public.library_items(id) on delete cascade,
  book_title text,
  page_count integer check (page_count is null or page_count > 0),
  publisher text,
  isbn text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.book_details
add column if not exists book_title text;

alter table public.book_details
drop column if exists language;

create table if not exists public.manga_details (
  library_item_id uuid primary key references public.library_items(id) on delete cascade,
  manga_title text,
  author text,
  artist text,
  volume_count integer check (volume_count is null or volume_count >= 0),
  chapter_count integer check (chapter_count is null or chapter_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.manga_details
add column if not exists manga_title text;

create table if not exists public.tv_details (
  library_item_id uuid primary key references public.library_items(id) on delete cascade,
  tv_show_title text,
  genre text,
  release_year integer check (release_year is null or release_year between 1800 and 2100),
  studio text,
  season_count integer check (season_count is null or season_count >= 0),
  episode_count integer check (episode_count is null or episode_count >= 0),
  season_breakdown jsonb default '[]'::jsonb,
  duration_minutes_per_episode integer check (
    duration_minutes_per_episode is null or duration_minutes_per_episode > 0
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tv_details
add column if not exists tv_show_title text;

alter table public.tv_details
add column if not exists genre text;

alter table public.tv_details
add column if not exists release_year integer;

alter table public.tv_details
drop constraint if exists tv_details_release_year_check;

alter table public.tv_details
add constraint tv_details_release_year_check
check (release_year is null or release_year between 1800 and 2100);

alter table public.tv_details
add column if not exists studio text;

alter table public.tv_details
add column if not exists season_breakdown jsonb default '[]'::jsonb;

-- Existing Data Backfills
-- Pulls structured detail fields out of legacy notes and shared columns.

insert into public.movie_details (
  library_item_id,
  movie_title,
  director,
  genre,
  release_year,
  duration_minutes
)
select
  id,
  title,
  nullif(substring(notes from '(?im)^Director:\s*(.+)$'), ''),
  nullif(substring(notes from '(?im)^Genre:\s*(.+)$'), ''),
  nullif(substring(notes from '(?im)^Year:\s*([0-9]{4})'), '')::integer,
  duration_minutes
from public.library_items
where category = 'movies'
on conflict (library_item_id) do update
set
  movie_title = excluded.movie_title,
  director = excluded.director,
  genre = excluded.genre,
  release_year = excluded.release_year,
  duration_minutes = excluded.duration_minutes,
  updated_at = now();

insert into public.manga_details (
  library_item_id,
  manga_title,
  author,
  artist,
  volume_count,
  chapter_count
)
select
  id,
  title,
  coalesce(
    nullif(substring(notes from '(?im)^Author:\s*(.+)$'), ''),
    nullif(creator, '')
  ),
  null,
  nullif(substring(notes from '(?im)^Volumes:\s*([0-9]+)'), '')::integer,
  nullif(substring(notes from '(?im)^Chapters:\s*([0-9]+)'), '')::integer
from public.library_items
where category = 'manga'
on conflict (library_item_id) do update
set
  manga_title = excluded.manga_title,
  author = excluded.author,
  artist = excluded.artist,
  volume_count = excluded.volume_count,
  chapter_count = excluded.chapter_count,
  updated_at = now();

insert into public.book_details (
  library_item_id,
  book_title,
  page_count,
  publisher,
  isbn
)
select
  id,
  title,
  nullif(substring(notes from '(?im)^Total pages:\s*([0-9]+)'), '')::integer,
  nullif(substring(notes from '(?im)^Publisher:\s*(.+)$'), ''),
  coalesce(
    nullif(substring(notes from '(?im)^ISBN13:\s*(.+)$'), ''),
    nullif(substring(notes from '(?im)^ISBN:\s*(.+)$'), '')
  )
from public.library_items
where category = 'books'
on conflict (library_item_id) do update
set
  book_title = excluded.book_title,
  page_count = excluded.page_count,
  publisher = excluded.publisher,
  isbn = excluded.isbn,
  updated_at = now();

insert into public.tv_details (
  library_item_id,
  tv_show_title,
  genre,
  release_year,
  studio,
  season_count,
  episode_count,
  season_breakdown,
  duration_minutes_per_episode
)
select
  id,
  title,
  nullif(substring(notes from '(?im)^Genre:\s*(.+)$'), ''),
  nullif(substring(notes from '(?im)^Year:\s*([0-9]{4})'), '')::integer,
  nullif(substring(notes from '(?im)^Studio:\s*(.+)$'), ''),
  nullif(substring(notes from '(?im)^Seasons:\s*([0-9]+)'), '')::integer,
  nullif(substring(notes from '(?im)^Episodes:\s*([0-9]+)'), '')::integer,
  '[]'::jsonb,
  nullif(substring(notes from '(?im)^Duration per episode:\s*([0-9]+)'), '')::integer
from public.library_items
where category = 'tv'
on conflict (library_item_id) do update
set
  tv_show_title = excluded.tv_show_title,
  genre = coalesce(excluded.genre, public.tv_details.genre),
  release_year = coalesce(excluded.release_year, public.tv_details.release_year),
  studio = coalesce(excluded.studio, public.tv_details.studio),
  season_count = excluded.season_count,
  episode_count = excluded.episode_count,
  season_breakdown = coalesce(excluded.season_breakdown, public.tv_details.season_breakdown),
  duration_minutes_per_episode = excluded.duration_minutes_per_episode,
  updated_at = now();

-- Legacy Anime Migration
-- Moves old top-level anime rows into TV Shows with the anime subtype.

do $$
begin
  if to_regclass('public.anime_details') is not null then
    execute $migration$
      insert into public.tv_details (
        library_item_id,
        tv_show_title,
        genre,
        release_year,
        studio,
        season_count,
        episode_count,
        season_breakdown,
        duration_minutes_per_episode
      )
      select
        library_items.id,
        library_items.title,
        nullif(substring(library_items.notes from '(?im)^Genre:\s*(.+)$'), ''),
        nullif(substring(library_items.notes from '(?im)^Year:\s*([0-9]{4})'), '')::integer,
        coalesce(anime_details.studio, nullif(substring(library_items.notes from '(?im)^Studio:\s*(.+)$'), '')),
        coalesce(anime_details.season_count, nullif(substring(library_items.notes from '(?im)^Seasons:\s*([0-9]+)'), '')::integer),
        coalesce(anime_details.episode_count, nullif(substring(library_items.notes from '(?im)^Episodes:\s*([0-9]+)'), '')::integer),
        '[]'::jsonb,
        coalesce(
          anime_details.duration_minutes_per_episode,
          nullif(substring(library_items.notes from '(?im)^Duration per episode:\s*([0-9]+)'), '')::integer
        )
      from public.library_items
      left join public.anime_details
        on anime_details.library_item_id = library_items.id
      where library_items.category = 'anime'
      on conflict (library_item_id) do update
      set
        tv_show_title = excluded.tv_show_title,
        genre = coalesce(excluded.genre, public.tv_details.genre),
        release_year = coalesce(excluded.release_year, public.tv_details.release_year),
        studio = coalesce(excluded.studio, public.tv_details.studio),
        season_count = excluded.season_count,
        episode_count = excluded.episode_count,
        season_breakdown = coalesce(excluded.season_breakdown, public.tv_details.season_breakdown),
        duration_minutes_per_episode = excluded.duration_minutes_per_episode,
        updated_at = now()
    $migration$;
  else
    insert into public.tv_details (
      library_item_id,
      tv_show_title,
      genre,
      release_year,
      studio,
      season_count,
      episode_count,
      season_breakdown,
      duration_minutes_per_episode
    )
    select
      id,
      title,
      nullif(substring(notes from '(?im)^Genre:\s*(.+)$'), ''),
      nullif(substring(notes from '(?im)^Year:\s*([0-9]{4})'), '')::integer,
      nullif(substring(notes from '(?im)^Studio:\s*(.+)$'), ''),
      nullif(substring(notes from '(?im)^Seasons:\s*([0-9]+)'), '')::integer,
      nullif(substring(notes from '(?im)^Episodes:\s*([0-9]+)'), '')::integer,
      '[]'::jsonb,
      nullif(substring(notes from '(?im)^Duration per episode:\s*([0-9]+)'), '')::integer
    from public.library_items
    where category = 'anime'
    on conflict (library_item_id) do update
    set
      tv_show_title = excluded.tv_show_title,
      genre = coalesce(excluded.genre, public.tv_details.genre),
      release_year = coalesce(excluded.release_year, public.tv_details.release_year),
      studio = coalesce(excluded.studio, public.tv_details.studio),
      season_count = excluded.season_count,
      episode_count = excluded.episode_count,
      season_breakdown = coalesce(excluded.season_breakdown, public.tv_details.season_breakdown),
      duration_minutes_per_episode = excluded.duration_minutes_per_episode,
      updated_at = now();
  end if;
end $$;

update public.library_items
set
  category = 'tv',
  subtype = 'anime',
  updated_at = now()
where category = 'anime';

alter table public.library_items
drop constraint if exists library_items_category_check;

alter table public.library_items
add constraint library_items_category_check
check (category in ('books', 'movies', 'tv', 'manga'));

drop table if exists public.anime_details;

-- Indexes
-- Speeds up common shelf filters, title search, and detail lookups.

create index if not exists library_items_category_status_idx
on public.library_items (category, status);

create index if not exists library_items_user_category_status_idx
on public.library_items (user_id, category, status);

create index if not exists library_items_added_at_idx
on public.library_items (added_at desc);

create index if not exists library_items_status_changed_at_idx
on public.library_items (status_changed_at desc);

create index if not exists library_items_title_idx
on public.library_items (lower(title));

create index if not exists movie_details_director_idx
on public.movie_details (lower(director));

create index if not exists book_details_isbn_idx
on public.book_details (isbn);

create index if not exists manga_details_author_idx
on public.manga_details (lower(author));

-- Read-Only Detail Views
-- Makes category detail tables easier to inspect in Supabase.

create or replace view public.movie_details_view
with (security_invoker = true) as
select
  library_item_id,
  movie_title,
  director,
  genre,
  release_year,
  duration_minutes,
  created_at,
  updated_at
from public.movie_details;

create or replace view public.book_details_view
with (security_invoker = true) as
select
  library_item_id,
  book_title,
  page_count,
  publisher,
  isbn,
  created_at,
  updated_at
from public.book_details;

create or replace view public.manga_details_view
with (security_invoker = true) as
select
  library_item_id,
  manga_title,
  author,
  artist,
  volume_count,
  chapter_count,
  created_at,
  updated_at
from public.manga_details;

create or replace view public.tv_details_view
with (security_invoker = true) as
select
  library_item_id,
  tv_show_title,
  genre,
  release_year,
  studio,
  season_count,
  episode_count,
  season_breakdown,
  duration_minutes_per_episode,
  created_at,
  updated_at
from public.tv_details;

-- Ownership Constraint Finalization
-- Makes user_id required once legacy unowned rows have been claimed.

do $$
begin
  if not exists (select 1 from public.library_items where user_id is null) then
    alter table public.library_items alter column user_id set not null;
  end if;
end $$;

-- Row Level Security
-- Enables RLS on all user-owned tables before policies are defined.

alter table public.user_profiles enable row level security;
alter table public.library_items enable row level security;
alter table public.movie_details enable row level security;
alter table public.book_details enable row level security;
alter table public.manga_details enable row level security;
alter table public.tv_details enable row level security;

-- Profile Policies
-- Users can only read and write their own profile row.

drop policy if exists "Users can view their own profile" on public.user_profiles;
drop policy if exists "Users can insert their own profile" on public.user_profiles;
drop policy if exists "Users can update their own profile" on public.user_profiles;

create policy "Users can view their own profile"
on public.user_profiles for select
to authenticated
using (id = auth.uid());

create policy "Users can insert their own profile"
on public.user_profiles for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update their own profile"
on public.user_profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Library Item Policies
-- Users can only access library rows owned by their auth user id.

drop policy if exists "Users can view their own library items" on public.library_items;
drop policy if exists "Users can insert their own library items" on public.library_items;
drop policy if exists "Users can update their own library items" on public.library_items;
drop policy if exists "Users can delete their own library items" on public.library_items;

create policy "Users can view their own library items"
on public.library_items for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own library items"
on public.library_items for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own library items"
on public.library_items for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own library items"
on public.library_items for delete
to authenticated
using (user_id = auth.uid());

-- Movie Detail Policies
-- Detail rows inherit ownership from their parent library item.

drop policy if exists "Users can view their own movie details" on public.movie_details;
drop policy if exists "Users can insert their own movie details" on public.movie_details;
drop policy if exists "Users can update their own movie details" on public.movie_details;
drop policy if exists "Users can delete their own movie details" on public.movie_details;

create policy "Users can view their own movie details"
on public.movie_details for select
to authenticated
using (exists (
  select 1 from public.library_items
  where library_items.id = movie_details.library_item_id
    and library_items.user_id = auth.uid()
));

create policy "Users can insert their own movie details"
on public.movie_details for insert
to authenticated
with check (exists (
  select 1 from public.library_items
  where library_items.id = movie_details.library_item_id
    and library_items.user_id = auth.uid()
));

create policy "Users can update their own movie details"
on public.movie_details for update
to authenticated
using (exists (
  select 1 from public.library_items
  where library_items.id = movie_details.library_item_id
    and library_items.user_id = auth.uid()
))
with check (exists (
  select 1 from public.library_items
  where library_items.id = movie_details.library_item_id
    and library_items.user_id = auth.uid()
));

create policy "Users can delete their own movie details"
on public.movie_details for delete
to authenticated
using (exists (
  select 1 from public.library_items
  where library_items.id = movie_details.library_item_id
    and library_items.user_id = auth.uid()
));

-- Book Detail Policies
-- Detail rows inherit ownership from their parent library item.

drop policy if exists "Users can view their own book details" on public.book_details;
drop policy if exists "Users can insert their own book details" on public.book_details;
drop policy if exists "Users can update their own book details" on public.book_details;
drop policy if exists "Users can delete their own book details" on public.book_details;

create policy "Users can view their own book details"
on public.book_details for select
to authenticated
using (exists (
  select 1 from public.library_items
  where library_items.id = book_details.library_item_id
    and library_items.user_id = auth.uid()
));

create policy "Users can insert their own book details"
on public.book_details for insert
to authenticated
with check (exists (
  select 1 from public.library_items
  where library_items.id = book_details.library_item_id
    and library_items.user_id = auth.uid()
));

create policy "Users can update their own book details"
on public.book_details for update
to authenticated
using (exists (
  select 1 from public.library_items
  where library_items.id = book_details.library_item_id
    and library_items.user_id = auth.uid()
))
with check (exists (
  select 1 from public.library_items
  where library_items.id = book_details.library_item_id
    and library_items.user_id = auth.uid()
));

create policy "Users can delete their own book details"
on public.book_details for delete
to authenticated
using (exists (
  select 1 from public.library_items
  where library_items.id = book_details.library_item_id
    and library_items.user_id = auth.uid()
));

-- Manga Detail Policies
-- Detail rows inherit ownership from their parent library item.

drop policy if exists "Users can view their own manga details" on public.manga_details;
drop policy if exists "Users can insert their own manga details" on public.manga_details;
drop policy if exists "Users can update their own manga details" on public.manga_details;
drop policy if exists "Users can delete their own manga details" on public.manga_details;

create policy "Users can view their own manga details"
on public.manga_details for select
to authenticated
using (exists (
  select 1 from public.library_items
  where library_items.id = manga_details.library_item_id
    and library_items.user_id = auth.uid()
));

create policy "Users can insert their own manga details"
on public.manga_details for insert
to authenticated
with check (exists (
  select 1 from public.library_items
  where library_items.id = manga_details.library_item_id
    and library_items.user_id = auth.uid()
));

create policy "Users can update their own manga details"
on public.manga_details for update
to authenticated
using (exists (
  select 1 from public.library_items
  where library_items.id = manga_details.library_item_id
    and library_items.user_id = auth.uid()
))
with check (exists (
  select 1 from public.library_items
  where library_items.id = manga_details.library_item_id
    and library_items.user_id = auth.uid()
));

create policy "Users can delete their own manga details"
on public.manga_details for delete
to authenticated
using (exists (
  select 1 from public.library_items
  where library_items.id = manga_details.library_item_id
    and library_items.user_id = auth.uid()
));

-- TV Detail Policies
-- Detail rows inherit ownership from their parent library item.

drop policy if exists "Users can view their own tv details" on public.tv_details;
drop policy if exists "Users can insert their own tv details" on public.tv_details;
drop policy if exists "Users can update their own tv details" on public.tv_details;
drop policy if exists "Users can delete their own tv details" on public.tv_details;

create policy "Users can view their own tv details"
on public.tv_details for select
to authenticated
using (exists (
  select 1 from public.library_items
  where library_items.id = tv_details.library_item_id
    and library_items.user_id = auth.uid()
));

create policy "Users can insert their own tv details"
on public.tv_details for insert
to authenticated
with check (exists (
  select 1 from public.library_items
  where library_items.id = tv_details.library_item_id
    and library_items.user_id = auth.uid()
));

create policy "Users can update their own tv details"
on public.tv_details for update
to authenticated
using (exists (
  select 1 from public.library_items
  where library_items.id = tv_details.library_item_id
    and library_items.user_id = auth.uid()
))
with check (exists (
  select 1 from public.library_items
  where library_items.id = tv_details.library_item_id
    and library_items.user_id = auth.uid()
));

create policy "Users can delete their own tv details"
on public.tv_details for delete
to authenticated
using (exists (
  select 1 from public.library_items
  where library_items.id = tv_details.library_item_id
    and library_items.user_id = auth.uid()
));

-- Grants
-- Blocks anonymous table access and grants authenticated users access through RLS.

grant usage on schema public to anon, authenticated;
revoke select, insert, update, delete on public.user_profiles from anon;
revoke select, insert, update, delete on public.library_items from anon;
revoke select, insert, update, delete on public.movie_details from anon;
revoke select, insert, update, delete on public.book_details from anon;
revoke select, insert, update, delete on public.manga_details from anon;
revoke select, insert, update, delete on public.tv_details from anon;
revoke select on public.movie_details_view from anon;
revoke select on public.book_details_view from anon;
revoke select on public.manga_details_view from anon;
revoke select on public.tv_details_view from anon;
grant select, insert, update on public.user_profiles to authenticated;
grant select, insert, update, delete on public.library_items to authenticated;
grant select, insert, update, delete on public.movie_details to authenticated;
grant select, insert, update, delete on public.book_details to authenticated;
grant select, insert, update, delete on public.manga_details to authenticated;
grant select, insert, update, delete on public.tv_details to authenticated;
grant select on public.movie_details_view to authenticated;
grant select on public.book_details_view to authenticated;
grant select on public.manga_details_view to authenticated;
grant select on public.tv_details_view to authenticated;

-- Manual Legacy Data Claim
-- Existing personal data migration:
-- 1. Sign in once with your email so a Supabase auth.users row exists.
-- 2. Replace the email below and run it once to claim the current unowned library rows.
-- update public.library_items
-- set user_id = (select id from auth.users where email = 'your-email@example.com' limit 1)
-- where user_id is null;
-- 3. Rerun this schema after the update; the safe block above will make user_id not null.
