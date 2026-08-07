# Project Context

## Goal

Build shelvd, a lightweight personal media library tracker web app using React, Vite, and Tailwind CSS.

Tagline: Track your media without the noise.

The app tracks exactly four top-level media categories:

- Books
- Movies
- TV Shows
- Manga

Anime series are tracked inside the TV Shows category with an Anime format. Movies stay under one Movies type. Narrower groupings like anime films, Korean films, or K-dramas are not first-class subtypes.

Each category has exactly two shelves:

- Completed
- Want to Watch/Read

There is intentionally no "In Progress" shelf.

Each media item contains:

- Title
- Creator/Author
- Rating, from 1 to 5 stars, only for Completed items
- Synopsis
- Personal Notes
- Cover art, usually sourced from lookup results with an optional URL override

## Current Implementation

This is a client-only React app. It stores signed-in private library data in Supabase when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured. Supabase Auth email/password signup and login identify each user, and row-level security scopes library rows to the signed-in user. If Supabase is not configured, the app runs as a local development/demo tracker using `localStorage` under the key `media-shelf-items`. Lightweight UI location and library filter state is persisted in `localStorage` under `media-shelf-ui-state` so refreshing returns to the current screen instead of resetting to Home.

The main app supports:

- A command-style homepage for choosing media type, then quickly searching and logging new media through the add sheet
- Email/password signup and sign-in when Supabase is configured
- Private per-user libraries backed by Supabase Auth and row-level security
- Home/Library view switching
- Refresh restoration for the last active view, category, shelf filters, sort, layout mode, and search query
- Category switching
- Shelf switching between Completed and Want to Watch/Read
- Add, edit, and delete media items
- Delete confirmation before removing media items
- Search across title, creator, synopsis, and notes
- A unified add/edit lookup search that queries the relevant APIs for the selected category
- Homepage search prefill that opens the add sheet and runs the same unified lookup flow
- Synopsis population from supported lookup providers
- A user-facing add/edit sheet with a primary Completed/Want segmented shelf control
- Cover preview in the add/edit sheet, with add/change/remove controls and image URL entry hidden until needed
- A physical media detail overlay that opens on the cover and flips to a same-size back cover with synopsis, facts, and notes
- OMDb lookup behind the unified search for Movies and TV Shows
- TMDb lookup behind the unified search for Movies and TV Shows
- Open Library and Aladin lookup behind the unified search for Books
- Jikan lookup behind the unified search for Manga
- Per-category counts
- A Profile view with library stats and recently added items
- Per-shelf recently added sorting based on when an item entered its current Done/Want shelf
- Cover image display from an image URL
- Fallback cover treatment when no image URL is provided
- Star rating input for Completed items only
- Quick completion flow that moves Want items to Completed with a rating
- Starter sample data across the library

## Tech Stack

- React 19
- Vite 8
- Tailwind CSS 3
- ESLint flat config for React, Hooks, and Vite React Refresh checks
- lucide-react for icons
- OMDb API for movie and TV Shows lookup
- Open Library API for book lookup
- Aladin API for Korean book lookup
- Jikan API for manga lookup
- Supabase for hosted Postgres persistence

## Project Structure

Tracked/source files:

```text
.
├── .gitignore
├── README.md
├── PROJECT_CONTEXT.md
├── netlify.toml
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── eslint.config.js
├── netlify
│   └── functions
│       └── aladin-books.js
├── public
│   ├── app-icon.png
│   ├── app-icon.svg
│   └── site.webmanifest
├── supabase
│   └── schema.sql
├── tailwind.config.js
├── vite.config.js
└── src
    ├── App.jsx
    ├── components
    │   ├── AppHeader.jsx
    │   ├── AuthView.jsx
    │   ├── BottomNav.jsx
    │   ├── BrandWordmark.jsx
    │   ├── ConfirmDialog.jsx
    │   ├── CompleteItemDialog.jsx
    │   ├── DeleteItemDialog.jsx
    │   ├── DetailsLookup.jsx
    │   ├── EditorSheet.jsx
    │   ├── FloatingAddButton.jsx
    │   ├── HomeView.jsx
    │   ├── LibraryView.jsx
    │   ├── MediaCards.jsx
    │   ├── MediaCover.jsx
    │   ├── MediaDetailOverlay.jsx
    │   ├── ProfileView.jsx
    │   ├── Rating.jsx
    │   └── ShelfControls.jsx
    ├── hooks
    │   ├── useLibraryMetrics.js
    │   ├── useMediaLookup.js
    │   └── useShelfData.js
    ├── index.css
    ├── lib
    │   ├── mediaConfig.js
    │   ├── mediaItemsStore.js
    │   ├── mediaLookup.js
    │   ├── mediaUtils.js
    │   └── supabase.js
    └── main.jsx
```

Generated or installed files:

```text
node_modules/
dist/
```

Both are ignored by Git.

## Important Files

`src/App.jsx`

- Coordinates top-level app state, auth/session loading, storage mode, view switching, item CRUD behavior, and add/edit form handling.
- Loads and saves signed-in media items through Supabase, or uses localStorage only when Supabase is not configured.
- Persists lightweight UI navigation and library filter state to `media-shelf-ui-state` so page refresh restores the current screen without reopening transient overlays or edit dialogs.

`src/hooks/useMediaLookup.js`

- Owns unified add/edit lookup state, provider searching, lookup result application, and homepage lookup handoff.

`src/hooks/useShelfData.js`

- Derives visible shelf items, category counts, subtype counts, and active shelf counts from app state.

`src/components/`

- Contains reusable UI components for the header, bottom navigation, homepage, library, shelf controls, media cards, rating input, editor sheet, and details lookup panel.
- `AuthView.jsx` owns email/password signup, login, and password reset flows.
- `HomeView.jsx` owns homepage command state and lookup handoff.
- `EditorSheet.jsx` owns the add/edit form, including the fast shelf selector and cover preview/override controls.
- `DetailsLookup.jsx` owns user-facing lookup search and result selection without exposing provider/debug details.
- `MediaDetailOverlay.jsx` owns the pulled-off-shelf interaction, including the 3D cover/back-cover flip view and released-season breakdown display for TV Shows.

`src/lib/mediaConfig.js`

- Defines categories, shelves, subtypes, sort options, starter sample data, and empty draft shape.

`src/lib/mediaLookup.js`

- Owns external lookup provider selection, API requests, result normalization, and item patch creation for OMDb, TMDb, Open Library, Aladin, and Jikan.
- Routes Movies and TV Shows, including Anime TV format entries, through TMDb.
- Counts TV seasons from released, non-special TMDb seasons instead of raw `number_of_seasons`, so renewed/upcoming seasons do not inflate saved season totals.

`src/lib/mediaUtils.js`

- Contains storage normalization, search ranking/deduping, parsing, tile metadata, subtype labels, and shared formatting helpers.
- Normalizes optional TV season breakdown metadata from app-style and database-style keys.

`src/lib/supabase.js`

- Creates the Supabase client when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present.
- Provides session, auth subscription, email/password signup and login, password reset, sign-out, and user profile helpers.

`src/lib/mediaItemsStore.js`

- Maps app media items to/from the Supabase `library_items` table.
- Requires the signed-in user id when fetching, saving, or deleting Supabase-backed items.
- Stores shared item fields, including `synopsis`, in `library_items`.
- Saves category-specific details to `movie_details`, `book_details`, `manga_details`, and `tv_details`.
- Persists TV released-season breakdown metadata in `tv_details.season_breakdown` when that column exists, while retaining missing-column fallback behavior for older Supabase schemas.
- Provides fetch, upsert, and delete helpers.
- Converts legacy non-UUID local item IDs to UUIDs before writing to Supabase.

`supabase/schema.sql`

- Defines `user_profiles`, `library_items`, category detail tables, category/status constraints, rating rules, useful indexes, and row-level security policies.

`src/index.css`

- Imports Tailwind layers.
- Defines the reusable `.input` component class.
- Sets global page background/text rendering.
- Defines `.cover-fallback` styling.

## Design Priorities

- Prioritize phone layouts first when changing UI; desktop refinements should not compromise the mobile view.
- Treat the app as dark-first/dark-only for now. Avoid light base surfaces that rely on `dark:` overrides for primary shells like headers, page backgrounds, nav, cards, and modals.

`package.json`

- Contains Vite and verification scripts:
  - `npm run dev`
  - `npm run lint`
  - `npm run build`
  - `npm run preview`

`.env.local`

- Stores local API keys and Supabase credentials for local development.
- This file is ignored by Git.

`.env.example`

- Documents the expected API and Supabase environment variable shape.

## Setup And Verification

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev -- --host 127.0.0.1
```

Build for production:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

The production build and lint checks were last verified successfully after the React/Vite/CSS cleanup.

## Supabase Persistence

The app uses the `user_profiles`, `library_items`, and category detail tables defined in `supabase/schema.sql`.

`user_profiles.id` links to Supabase Auth `auth.users.id`. `library_items.user_id` stores item ownership and references the same auth user id.

`library_items.title` remains the main entry title, and `library_items.synopsis` stores the shared back-cover synopsis for all media categories. The detail tables also mirror the visible title for easier table-level inspection:

- `movie_details.movie_title`
- `book_details.book_title`
- `manga_details.manga_title`
- `tv_details.tv_show_title`

TV-specific metadata is stored on `tv_details`, including show title, genre, release year, studio, released season count, episode count, per-episode duration, and optional `season_breakdown` JSON. The season breakdown is currently a released-season-only list used by the detail overlay; upcoming/renewed seasons are intentionally excluded from the visible breakdown.

For easier manual querying in Supabase, the schema also defines read-only views with title columns immediately after `library_item_id`:

- `movie_details_view`
- `book_details_view`
- `manga_details_view`
- `tv_details_view`

The database stores status values as:

- `completed`
- `want`

The React app maps those values to its display labels:

- `Completed`
- `Want to Watch/Read`

The browser-facing Supabase anon key is not a private secret. Private data is protected by Supabase Auth sessions and row-level security policies on `library_items`, detail tables, and `user_profiles`.

When Supabase is configured, signed-out users see the email/password auth screen with signup, login, and password reset flows. Signed-in users only load rows where `library_items.user_id = auth.uid()`. If Supabase is not configured, the app uses localStorage for local development/demo use.

Existing personal rows must be claimed after your auth user exists. Sign in once with your email, run the one-time `update public.library_items set user_id = (...) where user_id is null;` SQL comment at the bottom of `supabase/schema.sql`, then rerun the schema so the safe block can make `library_items.user_id` required.

## OMDb Integration

Movies and TV Shows include OMDb results in the unified add/edit lookup.

The lookup:

- Searches OMDb by title with `s`.
- Restricts results to `type=movie` for Movies and `type=series` for TV Shows.
- Uses the Anime format under TV Shows for anime series.
- Fetches selected result details by IMDb id with `i`.
- Fills title, creator/director, poster URL, and notes with relevant OMDb metadata.
- Leaves the user's personal 1-5 star rating separate from OMDb's IMDb score.

## TMDb Movie And TV Lookup

Movies and TV Shows use TMDb as the primary unified add/edit lookup provider. Anime series stay in TV Shows with the Anime format, but use TMDb lookup so seasons are grouped under one show-level library item instead of being logged as separate season entries.

The lookup:

- Accepts English or Korean search text.
- Searches TMDb movie results for Movies using English and Korean result languages behind the scenes.
- Searches TMDb TV results for TV Shows using English and Korean result languages behind the scenes.
- Uses TMDb TV results for Anime format entries, also adding Japanese result-language search behind the scenes.
- Always fetches selected TMDb details in English (`en-US`) so saved media metadata stays consistent.
- Fills title, creator/director, poster URL, synopsis, and available runtime/count metadata from TMDb.
- For TV Shows, counts seasons from `detail.seasons` by excluding specials (`season_number === 0`) and excluding seasons without an `air_date` on or before today.
- For TV Shows, saves `seasonBreakdown` as released seasons only; renewed/upcoming seasons can exist in TMDb metadata but should not appear in the detail overlay or inflate the show-level count.
- For TV Shows, derives episode count from released season buckets when possible, falling back to TMDb's detail-level episode total only when released season bucket totals are unavailable.
- Leaves country/language-specific grouping out of first-class movie and TV subtypes.

The local TMDb credentials can be read from either:

```text
VITE_TMDB_ACCESS_TOKEN
VITE_TMDB_API_KEY
```

## Subtypes

Books support a lightweight `subtype` field:

- `book`
- `korean-book`

Movies support a lightweight `subtype` field:

- `movie`

The TV Shows category supports a lightweight `subtype` field used only for the broad Anime distinction:

- `tv`
- `anime`

Existing saved book items without a subtype are normalized to `book` at load time. Existing saved movie items without a subtype are normalized to `movie` at load time. Existing saved TV items without a subtype are normalized to `tv` at load time. Legacy movie subtypes `anime-movie` and `korean-movie` normalize to `movie`; legacy TV subtype `kdrama` normalizes to `tv`.

The Books shelf includes an `All / General / Korean` filter. The Movies shelf has no subtype filter. The TV Shows shelf includes `All / General / Anime` format filters.

The local API key is read from:

```text
VITE_OMDB_API_KEY
```

Because this is a frontend-only app, any Vite environment variable used by the browser is included in the built client bundle. Treat the current setup as appropriate for a personal/local app, not a private production secret.

## Open Library Lookup

Books include Open Library-powered results in the unified add/edit lookup.

The lookup:

- Accepts English or Korean search text.
- Can search all languages, Korean-only results, or English-only results.
- Uses Open Library search via `https://openlibrary.org/search.json`.
- Does not require a local API key.
- Fills title, author, cover image URL, and notes with Open Library metadata.
- Automatically marks Korean-language book results as `korean-book`.
- Saves titles and authors exactly as returned by the API.

## Aladin Korean Book Lookup

Books include an Aladin-powered Korean book lookup panel in the add/edit form.

The lookup:

- Accepts Korean title or author search text.
- Uses a local Vite `/api/aladin/books` route that calls Aladin `ItemSearch.aspx` with `SearchTarget=Book`.
- Fills Korean title, author, cover image URL, and notes with Aladin metadata.
- Automatically marks selected results as `korean-book`.
- Saves Korean titles and authors exactly as returned by the API.

The local Aladin key is read server-side by the Vite route from:

```text
VITE_ALADIN_TTB_KEY
```

## Jikan Manga Lookup

Manga include a Jikan-powered lookup panel in the add/edit form.

The lookup:

- Searches manga by title via `https://api.jikan.moe/v4/manga`.
- Does not require a local API key.
- Fills title, author/artist, cover image URL, synopsis, and available volume/chapter fields from Jikan.
- Uses safe-for-work search results.
- Saves title and author/artist exactly as normalized from the API response.

## UX And Product Notes

- The first screen is the actual tracker app, not a marketing page.
- The app is now oriented around mobile-first web use, with desktop treated as a responsive expansion.
- Mobile browsing uses compact media rows with poster thumbnails for faster scanning.
- Shelf browsing supports a list view and a poster grid view.
- Poster grid view keeps at least three columns on narrow screens.
- Mobile category switching uses a fixed bottom navigation bar.
- Desktop and tablet show a compact top header with search and a category grid below it.
- Signed-in users can sign out from the header.
- The previous "All completed" route/control has been removed for now.
- The active shelf is controlled with a two-option segmented control.
- The add/edit form opens as a modal sheet instead of living as a permanent sidebar.
- A floating add button is available on shelf views.
- Completed items show ratings; planned items do not.
- Want items can be moved to Completed from the shelf cards or detail overlay; the app asks for a rating before saving the move.
- Delete actions use a confirmation dialog before removing an item.
- The display label adapts to category intent:
  - Books and Manga use "Want to Read"
  - Movies and TV Shows use "Want to Watch"
- The stored status value remains the exact shared value: `Want to Watch/Read`.

## Current Git State Notes

At the time this context file was created, the app files are newly added and may still be uncommitted.

`node_modules/` and `dist/` may exist locally because dependencies were installed and the build was run, but they should not be committed.

## Possible Next Steps

- Add import/export JSON for backups.
- Add sorting controls, such as rating, title, or recently added.
- Add validation or image preview error handling for broken cover URLs.
- Keep extracting focused hooks/components from `src/App.jsx` as new workflows grow.
- Add tests with Vitest and React Testing Library.
- Add email/password login as an optional Supabase Auth method if users need a more conventional sign-in path.
- Add a future `media_titles` table if shared canonical media metadata, global stats, or recommendations become product priorities.
