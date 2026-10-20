-- Personalized Home and bottom-menu shortcuts. Existing profile ownership policies apply.
alter table public.user_profiles
  add column if not exists navigation_shelves text[] not null
  default array['books', 'manga', 'movies', 'tv']::text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_profiles'::regclass
      and conname = 'user_profiles_navigation_shelves_check'
  ) then
    alter table public.user_profiles add constraint user_profiles_navigation_shelves_check check (
      array_ndims(navigation_shelves) = 1
      and cardinality(navigation_shelves) between 1 and 4
      and navigation_shelves <@ array['books', 'manga', 'movies', 'tv']::text[]
      and array_position(navigation_shelves, null) is null
      and cardinality(navigation_shelves) = (
        case when 'books' = any(navigation_shelves) then 1 else 0 end
        + case when 'manga' = any(navigation_shelves) then 1 else 0 end
        + case when 'movies' = any(navigation_shelves) then 1 else 0 end
        + case when 'tv' = any(navigation_shelves) then 1 else 0 end
      )
    );
  end if;
end
$$;
