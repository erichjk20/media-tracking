# Project Context

## Goal

Build a lightweight personal media library tracker web app using React, Vite, and Tailwind CSS.

The app tracks exactly five media categories:

- Books
- Movies
- TV Shows
- Anime
- Manga

Each category has exactly two shelves:

- Completed
- Want to Watch/Read

There is intentionally no "In Progress" shelf.

Each media item contains:

- Title
- Creator/Author
- Rating, from 1 to 5 stars, only for Completed items
- Personal Notes
- Image URL for cover art

## Current Implementation

This is a client-only React app. It stores library data in `localStorage` under the key `media-shelf-items`.

The main app supports:

- Category switching
- Shelf switching between Completed and Want to Watch/Read
- Add, edit, and delete media items
- Search across title, creator, and notes
- OMDb lookup for Movies, TV Shows, and Anime
- Open Library lookup for Books
- Per-category counts
- Cover image display from an image URL
- Fallback cover treatment when no image URL is provided
- Star rating input for Completed items only
- Starter sample data for all categories

## Tech Stack

- React 19
- Vite 7
- Tailwind CSS 3
- lucide-react for icons
- OMDb API for movie, TV show, and anime lookup
- Open Library API for book lookup

## Project Structure

Tracked/source files:

```text
.
├── .gitignore
├── README.md
├── PROJECT_CONTEXT.md
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── src
    ├── App.jsx
    ├── index.css
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

- Contains the full application UI and state logic.
- Defines categories, statuses, sample data, item CRUD behavior, filtering, search, rating component, and form handling.
- Persists all media items to `localStorage`.

`src/index.css`

- Imports Tailwind layers.
- Defines the reusable `.input` component class.
- Sets global page background/text rendering.
- Defines `.cover-fallback` styling.

`package.json`

- Contains Vite scripts:
  - `npm run dev`
  - `npm run build`
  - `npm run preview`

`.env.local`

- Stores `VITE_OMDB_API_KEY` for local development.
- This file is ignored by Git.

`.env.example`

- Documents the required OMDb environment variable shape.

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

The production build was last verified successfully after the initial implementation.

## OMDb Integration

Movies, TV Shows, and Anime include an OMDb lookup panel in the add/edit form.

The lookup:

- Searches OMDb by title with `s`.
- Restricts results to `type=movie` for Movies and `type=series` for TV Shows.
- Restricts Anime searches to `type=series` so the Anime category stays focused on shows.
- Fetches selected result details by IMDb id with `i`.
- Fills title, creator/director, poster URL, and notes with relevant OMDb metadata.
- Leaves the user's personal 1-5 star rating separate from OMDb's IMDb score.

## TMDb Korean Lookup

Movies and TV Shows include a TMDb-powered Korean media lookup panel in the add/edit form.

The lookup:

- Accepts English or Korean search text.
- Searches TMDb movie results for Movies.
- Searches TMDb TV results for TV Shows.
- Supports English or Korean result language display.
- Fills title, creator/director, poster URL, and notes with TMDb metadata.
- Automatically marks Korean movie results as `korean-movie` when TMDb country data includes `KR`.
- Automatically marks Korean TV results as `kdrama` when TMDb origin country data includes `KR`.

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
- `anime-movie`
- `korean-movie`

TV Shows support a lightweight `subtype` field:

- `tv`
- `kdrama`

Existing saved book items without a subtype are normalized to `book` at load time. Existing saved movie items without a subtype are normalized to `movie` at load time. Existing saved TV items without a subtype are normalized to `tv` at load time.

The Books shelf includes an `All / Books / Korean` filter. The Movies shelf includes an `All / Movies / Anime / Korean` filter. The TV Shows shelf includes an `All / TV / K-Drama` filter. Korean books stay under Books, anime movies and Korean movies stay under Movies, K-Dramas stay under TV Shows, and the Anime category is reserved for anime series.

The local API key is read from:

```text
VITE_OMDB_API_KEY
```

Because this is a frontend-only app, any Vite environment variable used by the browser is included in the built client bundle. Treat the current setup as appropriate for a personal/local app, not a private production secret.

## Open Library Lookup

Books include an Open Library-powered lookup panel in the add/edit form.

The lookup:

- Accepts English or Korean search text.
- Can search all languages, Korean-only results, or English-only results.
- Uses Open Library search via `https://openlibrary.org/search.json`.
- Does not require a local API key.
- Fills title, author, cover image URL, and notes with Open Library metadata.
- Automatically marks Korean-language book results as `korean-book`.
- Saves titles and authors exactly as returned by the API.

## UX And Product Notes

- The first screen is the actual tracker app, not a marketing page.
- The app is now oriented around mobile-first web use, with desktop treated as a responsive expansion.
- Mobile browsing uses compact media rows with poster thumbnails for faster scanning.
- Shelf browsing supports a list view and a poster grid view.
- Poster grid view keeps at least three columns on narrow screens.
- Mobile category switching uses a fixed bottom navigation bar.
- Desktop and tablet show a compact top header with search and a category grid below it.
- The previous "All completed" route/control has been removed for now.
- The active shelf is controlled with a two-option segmented control.
- The add/edit form opens as a modal sheet instead of living as a permanent sidebar.
- A floating add button is available on shelf views.
- Completed items show ratings; planned items do not.
- The display label adapts to category intent:
  - Books and Manga use "Want to Read"
  - Movies, TV Shows, and Anime use "Want to Watch"
- The stored status value remains the exact shared value: `Want to Watch/Read`.

## Current Git State Notes

At the time this context file was created, the app files are newly added and may still be uncommitted.

`node_modules/` and `dist/` may exist locally because dependencies were installed and the build was run, but they should not be committed.

## Possible Next Steps

- Add import/export JSON for backups.
- Add sorting controls, such as rating, title, or recently added.
- Add validation or image preview error handling for broken cover URLs.
- Split `src/App.jsx` into smaller components if the app grows.
- Add tests with Vitest and React Testing Library.
- Replace `localStorage` with a backend or sync service if multi-device access becomes important.
