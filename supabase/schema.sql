create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('books', 'movies', 'tv', 'manga')),
  subtype text check (
    subtype is null
    or subtype in ('book', 'korean-book', 'movie', 'anime-movie', 'korean-movie', 'tv', 'anime', 'kdrama')
  ),
  status text not null check (status in ('completed', 'want')),
  title text not null,
  creator text,
  director text,
  genre text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  rating integer check (rating between 1 and 5),
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
  studio text,
  season_count integer check (season_count is null or season_count >= 0),
  episode_count integer check (episode_count is null or episode_count >= 0),
  duration_minutes_per_episode integer check (
    duration_minutes_per_episode is null or duration_minutes_per_episode > 0
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tv_details
add column if not exists tv_show_title text;

alter table public.tv_details
add column if not exists studio text;

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
  studio,
  season_count,
  episode_count,
  duration_minutes_per_episode
)
select
  id,
  title,
  nullif(substring(notes from '(?im)^Studio:\s*(.+)$'), ''),
  nullif(substring(notes from '(?im)^Seasons:\s*([0-9]+)'), '')::integer,
  nullif(substring(notes from '(?im)^Episodes:\s*([0-9]+)'), '')::integer,
  nullif(substring(notes from '(?im)^Duration per episode:\s*([0-9]+)'), '')::integer
from public.library_items
where category = 'tv'
on conflict (library_item_id) do update
set
  tv_show_title = excluded.tv_show_title,
  studio = coalesce(excluded.studio, public.tv_details.studio),
  season_count = excluded.season_count,
  episode_count = excluded.episode_count,
  duration_minutes_per_episode = excluded.duration_minutes_per_episode,
  updated_at = now();

do $$
begin
  if to_regclass('public.anime_details') is not null then
    execute $migration$
      insert into public.tv_details (
        library_item_id,
        tv_show_title,
        studio,
        season_count,
        episode_count,
        duration_minutes_per_episode
      )
      select
        library_items.id,
        library_items.title,
        coalesce(anime_details.studio, nullif(substring(library_items.notes from '(?im)^Studio:\s*(.+)$'), '')),
        coalesce(anime_details.season_count, nullif(substring(library_items.notes from '(?im)^Seasons:\s*([0-9]+)'), '')::integer),
        coalesce(anime_details.episode_count, nullif(substring(library_items.notes from '(?im)^Episodes:\s*([0-9]+)'), '')::integer),
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
        studio = coalesce(excluded.studio, public.tv_details.studio),
        season_count = excluded.season_count,
        episode_count = excluded.episode_count,
        duration_minutes_per_episode = excluded.duration_minutes_per_episode,
        updated_at = now()
    $migration$;
  else
    insert into public.tv_details (
      library_item_id,
      tv_show_title,
      studio,
      season_count,
      episode_count,
      duration_minutes_per_episode
    )
    select
      id,
      title,
      nullif(substring(notes from '(?im)^Studio:\s*(.+)$'), ''),
      nullif(substring(notes from '(?im)^Seasons:\s*([0-9]+)'), '')::integer,
      nullif(substring(notes from '(?im)^Episodes:\s*([0-9]+)'), '')::integer,
      nullif(substring(notes from '(?im)^Duration per episode:\s*([0-9]+)'), '')::integer
    from public.library_items
    where category = 'anime'
    on conflict (library_item_id) do update
    set
      tv_show_title = excluded.tv_show_title,
      studio = coalesce(excluded.studio, public.tv_details.studio),
      season_count = excluded.season_count,
      episode_count = excluded.episode_count,
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

create index if not exists library_items_category_status_idx
on public.library_items (category, status);

create index if not exists library_items_added_at_idx
on public.library_items (added_at desc);

create index if not exists library_items_title_idx
on public.library_items (lower(title));

create index if not exists movie_details_director_idx
on public.movie_details (lower(director));

create index if not exists book_details_isbn_idx
on public.book_details (isbn);

create index if not exists manga_details_author_idx
on public.manga_details (lower(author));

create or replace view public.movie_details_view as
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

create or replace view public.book_details_view as
select
  library_item_id,
  book_title,
  page_count,
  publisher,
  isbn,
  created_at,
  updated_at
from public.book_details;

create or replace view public.manga_details_view as
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

create or replace view public.tv_details_view as
select
  library_item_id,
  tv_show_title,
  studio,
  season_count,
  episode_count,
  duration_minutes_per_episode,
  created_at,
  updated_at
from public.tv_details;

alter table public.library_items disable row level security;
alter table public.movie_details disable row level security;
alter table public.book_details disable row level security;
alter table public.manga_details disable row level security;
alter table public.tv_details disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.library_items to anon, authenticated;
grant select, insert, update, delete on public.movie_details to anon, authenticated;
grant select, insert, update, delete on public.book_details to anon, authenticated;
grant select, insert, update, delete on public.manga_details to anon, authenticated;
grant select, insert, update, delete on public.tv_details to anon, authenticated;
grant select on public.movie_details_view to anon, authenticated;
grant select on public.book_details_view to anon, authenticated;
grant select on public.manga_details_view to anon, authenticated;
grant select on public.tv_details_view to anon, authenticated;
