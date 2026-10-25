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

This is a client-only React app. It stores signed-in private library data in Supabase when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured. Supabase Auth email/password signup and login identify each user, and row-level security scopes library rows to the signed-in user. If Supabase is not configured, the app runs as a local development/demo tracker using `localStorage` under the key `media-shelf-items`. Lightweight library filter state is persisted in `localStorage` under `media-shelf-ui-state`; recent reloads restore the current page, while older/cold app opens start on the Home quick-log screen.

The main app supports:

- A command-style homepage for choosing media type, then quickly searching and logging new media through the add sheet
- Email/password signup and sign-in when Supabase is configured
- Private per-user libraries backed by Supabase Auth and row-level security
- Home/Library/Profile/Settings/History view switching
- Refresh restoration for the last active view, category, shelf filters, sort, layout mode, and search query
- Category switching
- Media shelf headings share `LibraryView.jsx` styling across Books, Movies, TV Shows, and Manga: 22px on mobile and 24px from the `sm` breakpoint, with semibold weight and tight line height. This reduces their previous sizes by about 17%/20% so the centered shelvd wordmark stays visually prominent.
- A blended, divider-free header with a centered wordmark, top-right Profile, and a neutral top-left Add menu on Library views; bottom navigation contains equal-width shelf shortcuts only.
- Shelf switching between Completed and Want to Watch/Read
- Add, edit, and delete media items
- Delete confirmation before removing media items
- Search across title, creator, synopsis, and notes
- A unified add/edit lookup search that queries the relevant APIs or internal lookup endpoints for the selected category
- Homepage search prefill that opens the add sheet and runs the same unified lookup flow
- Synopsis population from supported lookup providers
- A user-facing add/edit sheet with a primary Completed/Want segmented shelf control
- Cover preview in the add/edit sheet, with add/change/remove controls and image URL entry hidden until needed
- A physical media detail overlay that opens on the cover and flips to a same-size back cover with synopsis, facts, and notes
- OMDb lookup behind the unified search for Movies and TV Shows
- TMDb lookup behind the unified search for Movies and TV Shows
- Open Library and Aladin lookup behind the unified search for Books
- MangaDex lookup behind the unified search for Manga, with Jikan fallback for missing cover art
- Per-category counts
- Profile → Settings → Library → Customize shelves: choose one to four shelves, reorder with touch dragging or Move up/down buttons, preview, Save/Cancel, and Reset to default. Home and bottom navigation share the saved selection/order. Hidden shelves retain their items and remain accessible from Profile; stats and editor category options still include all four media types.
- Navigation preferences live in `user_profiles.navigation_shelves` for signed-in users and the existing local profile for demo mode. Apply `supabase/migrations/20261020020000_add_navigation_shelves.sql` to existing databases. Missing columns use default navigation for browsing and show an actionable error when customization is saved.
- A compact Profile view with library stats and recently added items; a gear beside the name opens Settings. Settings groups shelf customization under Library and display-name editing, email, and Sign out under Account. Recent reloads restore Settings just like the other views.
- Per-shelf recently added sorting based on when an item entered its current Done/Want shelf
- Cover image display from an image URL
- Fallback cover treatment when no image URL is provided
- Star rating input for Completed items only
- Quick completion flow that moves Want items to Completed with a rating
- Added and watched/finished dates shown in item details, with unknown historical dates labeled explicitly
- Shelf cards omit activity dates in both list and grid layouts. Item details show Watched/Finished for Done items and Added for Want items. Done details keep Logged as smaller secondary text below the content. Unknown finished dates never fall back to logged dates; History groups by `finishedOn`.
- Profile → History provides year/month selectors, media filters with period counts, a filtered completion total, and monthly groups of finished titles across all four categories, including hidden shelves. Current and populated years are available, newest first. Exact and month-only dates retain precision; unknown dates appear separately across all years and never enter dated totals. Titles open the existing detail/edit flows. Recent reloads restore History and its filters; cold opens still start on Home. No new schema changes.
- Optional finished date in the add/edit sheet and quick completion dialog: Exact date, Month & year, Don't remember, and a Today shortcut. New Done entries default to unknown; moving an existing Want item → Done defaults to local today. App `finishedOn` is `YYYY-MM-DD` for exact dates or `YYYY-MM` for month-only dates. Supabase stores these separately in `finished_on date` and `finished_month text`, with a constraint preventing both being populated. Month-only dates display as October 2024 with no invented day. Backdating is supported, ordinary edits preserve precision, and returning to Want clears both.
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
- MangaDex API for primary manga lookup
- AniList and Jikan APIs for manga fallback lookup/cover enrichment, and Jikan for Anime TV lookup
- Supabase for hosted Postgres persistence

## Project Structure

Tracked/source files:

```text
.
├── .gitignore
├── .env.example
├── README.md
├── PROJECT_CONTEXT.md
├── QA_CHECKLIST.md
├── netlify.toml
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── eslint.config.js
├── netlify
│   └── functions
│       ├── aladin-books.js
│       ├── lookup-books.js
│       ├── lookup-manga.js
│       └── mangadex-manga.js
├── public
│   ├── _redirects
│   ├── app-icon.png
│   ├── app-icon.svg
│   └── site.webmanifest
├── supabase
│   ├── migrations
│   │   ├── 20261020000000_add_finished_on.sql
│   │   ├── 20261020010000_add_finished_month.sql
│   │   └── 20261020020000_add_navigation_shelves.sql
│   ├── scripts
│   │   └── backfill_erichjk20_finished_on.sql
│   └── schema.sql
├── tests
│   ├── mediaDates.test.js
│   └── navigationPreferences.test.js
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
    │   ├── CustomizeShelvesSheet.jsx
    │   ├── DeleteItemDialog.jsx
    │   ├── DetailsLookup.jsx
    │   ├── EditorSheet.jsx
    │   ├── FinishedDateField.jsx
    │   ├── HeaderAddMenu.jsx
    │   ├── HomeSearchSuggestions.jsx
    │   ├── HomeView.jsx
    │   ├── LibraryView.jsx
    │   ├── MediaActivityDate.jsx
    │   ├── MediaCards.jsx
    │   ├── MediaCover.jsx
    │   ├── MediaDetailOverlay.jsx
    │   ├── ProfileView.jsx
    │   ├── Rating.jsx
    │   ├── SettingsView.jsx
    │   ├── ShelfControls.jsx
    │   └── ShelfNavigationPill.jsx
    ├── hooks
    │   ├── useLibraryMetrics.js
    │   ├── useMediaLookup.js
    │   ├── usePersistentUiState.js
    │   └── useShelfData.js
    ├── index.css
    ├── lib
    │   ├── lookupResultUtils.js
    │   ├── mediaConfig.js
    │   ├── mediaDates.js
    │   ├── mediaItemsStore.js
    │   ├── mediaLookup.js
    │   ├── mediaUtils.js
    │   ├── navigationPreferences.js
    │   ├── searchUtils.js
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
- Persists lightweight library filter state to `media-shelf-ui-state`, restores the current page for recent reloads, and starts older/cold app opens on Home without reopening transient overlays or edit dialogs.
- Derives the shared ordered navigation categories from the current user's profile. Account changes clear the previous profile before loading the next one; in-flight preference saves cannot overwrite another account's menu. Same-account session refreshes preserve open Settings drafts.

`src/hooks/useMediaLookup.js`

- Owns unified add/edit lookup state, provider searching, lookup result application, and homepage lookup handoff.

`src/hooks/useShelfData.js`

- Derives visible shelf items, category counts, subtype counts, and active shelf counts from app state.

`src/hooks/usePersistentUiState.js`

- Persists Home, Library, Profile, Settings, and History plus library/history filters in `media-shelf-ui-state`. Restores views saved within 30 minutes; older/cold opens start on Home. Navigation preferences are stored separately on the profile.

`src/components/`

- Contains reusable UI components for the header, bottom navigation, homepage, library, shelf controls, media cards, rating input, editor sheet, and details lookup panel.
- `AuthView.jsx` owns email/password signup, login, and password reset flows.
- `HomeView.jsx` owns homepage command state and lookup handoff. Its category selector shares the selected shelves/order with the bottom nav; the default is Books, Manga, Movies, TV.
- `BottomNav.jsx` owns the mobile fixed pill navigation. The default order is Books, Manga, Movies, TV; user-selected shelf order comes from Settings preferences. The pill contains only equal-width shelf tabs and shrinks with fewer selections. `ShelfNavigationPill.jsx` shares the responsive layout with the customization preview. Profile lives in the top-right header action instead of the pill.
- `AppHeader.jsx` handles the centered brand-home layout, top-right Profile action, and placement of the contextual top-left Add menu on Library views. Its transparent, divider-free background exposes the page gradient while retaining backdrop blur and mobile sticky behavior. The tagline is desktop-only. Profile remains highlighted on Settings, which has an explicit Back to profile action.
- `HeaderAddMenu.jsx` owns the Add trigger, Search title / Manual entry actions, menu state, outside dismissal, and keyboard/focus behavior. It remounts when the current category label changes, closing any open menu. The neutral 44px trigger has a bright white 24px plus and visible border; there is no floating or bottom-nav Add action.
- `ProfileView.jsx` owns the compact identity header, Settings gear, library totals, all-category breakdown, and recently added items.
- `HistoryView.jsx` owns the year/month selectors, media filters, completion totals, monthly timeline, and expandable undated group. `src/lib/mediaHistory.js` derives groups and totals using finished dates only. Profile links to History below media totals; Back to profile restores focus to that entry. History keeps Profile highlighted in the header and no active shelf in the bottom menu.
- `SettingsView.jsx` owns Library/Account groups, the selected-shelf summary, display-name editing, read-only email, and Sign out. Local demo mode omits email and Sign out. Save/sign-out errors stay beside their actions; failed saves retain edits.
- `CustomizeShelvesSheet.jsx` owns the selected/hidden shelf lists, Pointer Events dragging, accessible Move up/down controls, live menu preview, and draft Save/Cancel/Reset behavior. It traps keyboard focus and returns focus to the Customize shelves row when dismissed.
- `EditorSheet.jsx` owns the add/edit form, including the fast shelf selector and cover preview/override controls.
- `DetailsLookup.jsx` owns user-facing lookup search and result selection without exposing provider/debug details.
- `MediaDetailOverlay.jsx` owns the pulled-off-shelf interaction, including the 3D cover/back-cover flip view and released-season breakdown display for TV Shows.

`src/lib/mediaConfig.js`

- Defines categories, shelves, subtypes, sort options, starter sample data, and empty draft shape.

`src/lib/navigationPreferences.js`

- Defines the default shelf order, preference normalization, selection/reordering helpers, count-dependent menu layout, and Home category fallback.
- Drops unknown/duplicate category IDs and restores defaults when no valid IDs remain. Selection controls preserve at least one visible shelf; newly enabled shelves append.

`src/lib/mediaLookup.js`

- Owns lookup provider selection, browser-side API requests for OMDb/TMDb/Aladin/Jikan fallback paths, calls to internal Books/Manga lookup endpoints, and item patch creation.
- Routes Movies and TV Shows, including Anime TV format entries, through TMDb.
- Counts TV seasons from released, non-special TMDb seasons instead of raw `number_of_seasons`, so renewed/upcoming seasons do not inflate saved season totals.

`netlify/functions/lookup-books.js`

- Owns the internal `/api/lookup/books` endpoint for Open Library-powered book search.
- Searches Open Library works, privately scores English edition cover candidates for top results, and returns normalized work-level lookup results.
- Adds lightweight in-memory TTL caching and source metadata such as Open Library work id, edition id, cover source, and cover preference.

`netlify/functions/lookup-manga.js`

- Owns the internal `/api/lookup/manga` endpoint for MangaDex-powered manga search.
- Searches MangaDex, fetches MangaDex cover records, prefers volume 1 cover art when available, and falls back through MangaDex main cover and Jikan cover matching when needed.
- Adds lightweight in-memory TTL caching and source metadata such as MangaDex id, MAL id, cover source, cover volume, cover locale, and fallback status.

`src/lib/mediaUtils.js`

- Contains storage normalization, search ranking/deduping, parsing, tile metadata, subtype labels, and shared formatting helpers.
- Normalizes optional TV season breakdown metadata from app-style and database-style keys.
- Loads/saves the local demo profile under `media-shelf-profile`, including normalized `navigation_shelves` preferences.

`src/lib/supabase.js`

- Creates the Supabase client when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present.
- Provides session, auth subscription, email/password signup and login, password reset, sign-out, and user profile helpers.
- Reads existing profiles before creating missing ones, preserving saved display names and shelf preferences at sign-in. Email synchronization updates only email/timestamp; shelf saves update only `navigation_shelves`/timestamp, and display-name saves preserve navigation.

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
- Defines app shell, header, bottom navigation, and safe-area spacing helpers for iOS `viewport-fit=cover` layouts.
- Sets global page background/text rendering.
- Defines `.cover-fallback` styling.

## Design Priorities

- Prioritize phone layouts first when changing UI; desktop refinements should not compromise the mobile view.
- Treat the app as dark-first/dark-only for now. Avoid light base surfaces that rely on `dark:` overrides for primary shells like headers, page backgrounds, nav, cards, and modals.

`package.json`

- Contains Vite and verification scripts:
  - `npm run dev`
  - `npm run lint`
  - `npm test`
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

Run automated tests:

```bash
npm test
```

After the customizable-navigation and Profile/Settings updates, `npm run lint`, all 22 Node tests, `npm run build`, and `git diff --check` passed. Browser checks covered 320px/375px phone and 1280px desktop layouts, touch/keyboard reordering, modal focus, save failure/retry, hidden-shelf access, Home fallback, and recent/cold view restoration. Signed-in name/sign-out flows, second-device preference loading, and account switching were checked with a mocked backend. Isolated PostgreSQL checks covered migration reruns, array validation, new-profile defaults, and profile ownership policies. These checks did not change the hosted database; use `QA_CHECKLIST.md` for deployment/device verification.

After adding History, `npm run lint`, all 28 Node tests, `npm run build`, and `git diff --check` passed. Six History tests cover year options, monthly grouping, intersecting filters, unknown dates, date/status changes, and time-zone boundaries. Isolated local-demo browser checks covered 320px/375px/1280px layouts, long-title/fallback-cover overflow, Profile/History navigation and focus, hidden shelves, period/media filters, recent reload restoration, malformed filters, cold Home restoration, empty/unknown-only/Want-only libraries, and editing an undated title into a month-only completion. No browser errors were reported. No hosted data or schema was changed.

History control spacing uses native selects with custom, inset chevrons and reserved text padding. The selectors wrap at constrained widths; filter buttons and icons resist shrinking, and disclosure controls have internal padding. The completion summary is an inline count with the selected period; tighter top spacing brings the timeline higher on phones. History titles allow two lines while creators stay on one truncated line. Follow-up browser checks at 320px, 375px, 500px, 640px, and 1280px with 100%/200% text verified arrow bounds, selected-text fit, button height, and control overflow. Lint and build passed after the spacing and density adjustments.

## Profile, Settings, And Navigation Preferences

- The global header opens Profile. Profile focuses on identity and library activity; its gear opens Settings. Back to profile returns to the compact header and focuses the gear. Settings stays outside the customizable bottom menu.
- Settings → Library → Customize shelves lets users select/reorder one to four media categories. All four are selected initially, ordered Books, Manga, Movies, TV; there is no onboarding prompt.
- The sheet uses a local draft. Its preview shares the actual menu layout; Save applies changes only after persistence succeeds. Cancel, Close, or Escape discard edits. Reset restores defaults in the draft until Save is pressed.
- One to four shelves form a shelf-only pill with equal-width tabs; the pill shrinks with fewer selections. Add lives at the top-left of the centered-logo header on Library views and retains the current shelf's Search title/Manual entry flow. Profile remains top-right. The mobile header omits the tagline.
- Home uses the same shelf selection/order without Add. Entering Home from a hidden category chooses the first selected shelf and clears old-category lookup results. Saving preferences also falls back if the current category was hidden.
- Hiding a shortcut never deletes media or removes a category from Profile stats, recently added items, or editor category choices. Hidden shelves remain accessible through Profile and recent Library reloads; no bottom tab is active while viewing them.
- Account preferences use `user_profiles.navigation_shelves`, a non-null `text[]` with one to four unique IDs from `books`, `manga`, `movies`, `tv`. The database default is `['books', 'manga', 'movies', 'tv']`. Existing profile ownership policies apply. Signed-in preferences load across devices at sign-in/reload; local demo preferences stay in this browser.
- Apply `supabase/migrations/20261020020000_add_navigation_shelves.sql` to existing databases before cloud customization. The base schema includes the same column/constraint. A missing column leaves default navigation usable and produces an actionable Save error without losing the draft. The hosted migration was not applied during this implementation.

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

## Internal Lookup Endpoints

Books and Manga use internal Netlify/Vite endpoints as a small backend aggregation layer:

- `/api/lookup/books`
- `/api/lookup/manga`

In local development, `vite.config.js` mounts the Netlify function handlers directly so the same paths work under `npm run dev`. In production, `netlify.toml` and `public/_redirects` route those paths to Netlify Functions.

Both endpoints:

- Return normalized lookup result objects for the React add/edit flow.
- Include lightweight in-memory caching with a 6 hour TTL and a 100-entry cap per warm function instance.
- Return cache metadata in the response body and `X-Lookup-Cache` response header.
- Include source metadata for debugging provider decisions, especially cover art selection.

The source metadata currently travels with lookup results but is not persisted into Supabase.

## Open Library Book Lookup

Books include Open Library-powered results in the unified add/edit lookup through `/api/lookup/books`.

The lookup:

- Accepts English or Korean search text.
- Can search all languages, Korean-only results, or English-only results.
- Uses Open Library search via `https://openlibrary.org/search.json`.
- Fetches Open Library edition data for top results via each work's `editions.json` endpoint, but only as hidden cover candidates.
- Fetches Open Library work detail JSON for top results so work descriptions can populate the saved synopsis.
- Prefers English edition cover art for English books when available, scoring cover id quality, title fit, normal print format, common US trade publishers, proximity to first publication, metadata completeness, and noisy edition terms.
- Keeps the displayed title as the Open Library work title while using selected edition metadata for cover/publisher/page details.
- Returns source metadata including work id, hidden edition id, cover source, cover preference, edition score, and preferred language match status.
- Does not require a local API key.
- Fills title, author, cover image URL, publisher, page count, and synopsis fields when available.
- Automatically marks Korean-language book results as `korean-book`.
- Saves titles and authors exactly as normalized from the lookup response.

## Aladin Korean Book Lookup

Books include an Aladin-powered Korean book lookup panel in the add/edit form.

The lookup:

- Accepts Korean title or author search text.
- Uses a local Vite `/api/aladin/books` route that calls Aladin `ItemSearch.aspx` with `SearchTarget=Book`.
- Uses the Netlify Function at `/api/aladin/books` in production.
- Fills Korean title, author, cover image URL, and notes with Aladin metadata.
- Automatically marks selected results as `korean-book`.
- Saves Korean titles and authors exactly as returned by the API.

The local Aladin key is read server-side by the Vite route from:

```text
VITE_ALADIN_TTB_KEY
```

## MangaDex Manga Lookup

Manga include a MangaDex-powered lookup panel in the add/edit form through `/api/lookup/manga`.

The lookup:

- Searches manga by title via `https://api.mangadex.org/manga` and queries AniList alongside MangaDex so popular canonical series can outrank MangaDex variants or side entries.
- Requests `cover_art`, `author`, and `artist` relationships from MangaDex.
- Fetches cover records from `https://api.mangadex.org/cover` for returned manga ids.
- Prefers true volume 1 cover art over collected or omnibus English editions when available.
- Uses Open Library as a hidden English cover enrichment source, but penalizes VIZBIG/3-in-1/omnibus-style editions so they do not replace faithful first-volume covers.
- Falls back to the MangaDex main cover from the manga search response.
- Uses Jikan as a targeted cover fallback when MangaDex has no usable cover, matching by MAL id when available or by title/alternate title.
- Uses Jikan as a fallback when MangaDex/AniList cannot return usable search results.
- Does not require a local API key.
- Fills title, author/artist, cover image URL, synopsis, and available volume/chapter fields from MangaDex/AniList/Jikan-normalized metadata.
- Uses safe-for-work search results.
- Returns source metadata including MangaDex id, MAL id, Open Library cover metadata when used, cover source, cover volume, cover locale, and whether a fallback was used.
- Saves title and author/artist exactly as normalized from the lookup response.

## UX And Product Notes

- The first screen is the actual tracker app, not a marketing page.
- The app is now oriented around mobile-first web use, with desktop treated as a responsive expansion.
- Mobile browsing uses compact media rows with poster thumbnails for faster scanning.
- Shelf browsing supports a list view and a poster grid view.
- Poster grid view keeps at least three columns on narrow screens.
- Mobile category switching uses a fixed bottom navigation bar.
- The mobile bottom navigation defaults to Books, Manga, Movies, TV. Users can choose/reorder one to four shelves through Profile → Settings → Library → Customize shelves. The pill contains equal-width shelf tabs and shrinks with fewer selections; the customization preview uses the same layout.
- Add is a neutral top-left header action with a bright white plus, visible border, centered wordmark, and top-right Profile. It opens Search title / Manual entry below the trigger. Add and Profile use matching 44px button sizes. The tagline is hidden on phones. The header blends into the page with a transparent background and no divider; backdrop blur and mobile sticky positioning remain.
- Profile access lives in the top-right app header, not in the bottom pill.
- The Home category selector mirrors the user's selected bottom-nav shelves and order without the Add action. Entering Home from a hidden shelf selects the first visible shelf. Hidden library destinations, including recent-page restores, remain valid.
- Home/auth wordmark screens reserve iOS safe-area space so the `shelvd` mark stays below the translucent status-bar blur on devices using `viewport-fit=cover`.
- Desktop and tablet show a compact top header with the brand action and profile action above the main content.
- The previous "All completed" route/control has been removed for now.
- The active shelf is controlled with a two-option segmented control.
- The add/edit form opens as a modal sheet instead of living as a permanent sidebar.
- The top-left header Add menu is available on shelf views.
- Completed items show ratings; planned items do not.
- Want items can be moved to Completed from the shelf cards or detail overlay; the app asks for a rating before saving the move.
- Delete actions use a confirmation dialog before removing an item.
- The display label adapts to category intent:
  - Books and Manga use "Want to Read"
  - Movies and TV Shows use "Want to Watch"
- The stored status value remains the exact shared value: `Want to Watch/Read`.

## Possible Next Steps

- Apply `supabase/migrations/20261020020000_add_navigation_shelves.sql` to existing databases before using cloud shelf customization. Existing profiles receive the default four-shelf order; no library items change.

- Apply `supabase/migrations/20261020010000_add_finished_month.sql` to existing Supabase databases before deploying date tracking. It includes both date columns and preserves existing exact dates. No historical completion dates are inferred automatically from `status_changed_at` or `added_at`; the account-specific script in `supabase/scripts` is an explicitly authorized exception and skips existing month-only dates too.

- Add import/export JSON for backups.
- Extend History with richer/shareable monthly and yearly recaps; basic dated totals and monthly browsing are implemented. Preserve exact/month-only precision and keep unknown completion dates explicit.
- Persist external source ids/source metadata in Supabase if refresh-metadata workflows become important.
- Keep extracting focused hooks/components from `src/App.jsx` as new workflows grow.
- Expand component/interaction coverage with Vitest and React Testing Library; the existing date/navigation tests use the Node test runner.
- Add a future `media_titles` table if shared canonical media metadata, global stats, or recommendations become product priorities.

## Header And Shelf Navigation — October 25, 2026

- Approved design: centered wordmark, neutral top-left Add on Library, top-right Profile, transparent divider-free header, desktop-only tagline, and a shelf-only bottom pill. One to four selected shelves get equal-width tabs and a pill that shrinks with the count. Four shelves remain the default; no extra minimum is imposed.
- `AppHeader` owns header layout; `HeaderAddMenu` owns Add interaction; `BottomNav` places the shared `ShelfNavigationPill`, which also renders the customization preview. `App` determines when contextual Add is available and connects the existing search/manual flows.
- Home/auth layouts, library data, saved preferences, and schema are unchanged. Games and More navigation remain future possibilities; the app still has four media categories.
- Reverting remains supported. The complete layout/refactor is grouped in the commit titled `Refine header and shelf navigation`; use a new Git revert commit after publication to undo it without rewriting shared history. The pre-change baseline is `10372c3`. Local original-file snapshots and the full trial patch also live under `.git/codex-ui-trials/header-add-20261025/`; the manifest includes the new `src/components/HeaderAddMenu.jsx` file that must be removed when restoring the original snapshots. Intermediate colored-button, divider, and background versions are saved in that directory for reverting individual styling changes.
- Validation after component extraction: `npm run lint`, all 22 Node tests, `npm run build`, and `git diff --check` passed. Browser checks covered one to four shelves at 320px, 375px, and 1280px, centered wordmark, equal-width touch targets, no horizontal overflow, keyboard/outside menu dismissal, Manual entry, Search title, category context, Profile/Settings, and local customization save/reload. No hosted database changes were made.
- Follow-up typography adjustment: reduced every media shelf heading from 26.4px to 22px on mobile and from 30px to 24px on larger screens, retaining its weight. Validation for the combined History and heading changes: all 28 Node tests, lint, production build, and `git diff --check` passed.
