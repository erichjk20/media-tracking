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
  rating integer check (rating between 1 and 5),
  notes text,
  image_url text,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'completed' or rating is null)
);

create index if not exists library_items_category_status_idx
on public.library_items (category, status);

create index if not exists library_items_added_at_idx
on public.library_items (added_at desc);

create index if not exists library_items_title_idx
on public.library_items (lower(title));

alter table public.library_items disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.library_items to anon, authenticated;
