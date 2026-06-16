create table if not exists public.library_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('books', 'movies', 'tv', 'anime', 'manga')),
  subtype text check (
    subtype is null
    or subtype in ('book', 'korean-book', 'movie', 'anime-movie', 'korean-movie', 'tv', 'kdrama')
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
drop constraint if exists library_items_duration_minutes_check;

alter table public.library_items
add constraint library_items_duration_minutes_check
check (duration_minutes is null or duration_minutes > 0);

create table if not exists public.movie_details (
  library_item_id uuid primary key references public.library_items(id) on delete cascade,
  director text,
  genre text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_details (
  library_item_id uuid primary key references public.library_items(id) on delete cascade,
  page_count integer check (page_count is null or page_count > 0),
  publisher text,
  isbn text,
  language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.manga_details (
  library_item_id uuid primary key references public.library_items(id) on delete cascade,
  author text,
  artist text,
  volume_count integer check (volume_count is null or volume_count >= 0),
  chapter_count integer check (chapter_count is null or chapter_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tv_details (
  library_item_id uuid primary key references public.library_items(id) on delete cascade,
  season_count integer check (season_count is null or season_count >= 0),
  episode_count integer check (episode_count is null or episode_count >= 0),
  duration_minutes_per_episode integer check (
    duration_minutes_per_episode is null or duration_minutes_per_episode > 0
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.anime_details (
  library_item_id uuid primary key references public.library_items(id) on delete cascade,
  studio text,
  season_count integer check (season_count is null or season_count >= 0),
  episode_count integer check (episode_count is null or episode_count >= 0),
  duration_minutes_per_episode integer check (
    duration_minutes_per_episode is null or duration_minutes_per_episode > 0
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.movie_details (
  library_item_id,
  director,
  genre,
  duration_minutes
)
select
  id,
  director,
  genre,
  duration_minutes
from public.library_items
where category = 'movies'
on conflict (library_item_id) do update
set
  director = excluded.director,
  genre = excluded.genre,
  duration_minutes = excluded.duration_minutes,
  updated_at = now();

insert into public.manga_details (
  library_item_id,
  author,
  artist,
  volume_count,
  chapter_count
)
select
  id,
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
  author = excluded.author,
  artist = excluded.artist,
  volume_count = excluded.volume_count,
  chapter_count = excluded.chapter_count,
  updated_at = now();

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

alter table public.library_items disable row level security;
alter table public.movie_details disable row level security;
alter table public.book_details disable row level security;
alter table public.manga_details disable row level security;
alter table public.tv_details disable row level security;
alter table public.anime_details disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.library_items to anon, authenticated;
grant select, insert, update, delete on public.movie_details to anon, authenticated;
grant select, insert, update, delete on public.book_details to anon, authenticated;
grant select, insert, update, delete on public.manga_details to anon, authenticated;
grant select, insert, update, delete on public.tv_details to anon, authenticated;
grant select, insert, update, delete on public.anime_details to anon, authenticated;
