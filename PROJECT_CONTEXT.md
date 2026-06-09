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
- OMDb lookup for Movies and TV Shows
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
- OMDb API for movie and TV show lookup

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

Movies and TV Shows include an OMDb lookup panel in the add/edit form.

The lookup:

- Searches OMDb by title with `s`.
- Restricts results to `type=movie` for Movies and `type=series` for TV Shows.
- Fetches selected result details by IMDb id with `i`.
- Fills title, creator/director, poster URL, and notes with relevant OMDb metadata.
- Leaves the user's personal 1-5 star rating separate from OMDb's IMDb score.

The local API key is read from:

```text
VITE_OMDB_API_KEY
```

Because this is a frontend-only app, any Vite environment variable used by the browser is included in the built client bundle. Treat the current setup as appropriate for a personal/local app, not a private production secret.

## UX And Product Notes

- The first screen is the actual tracker app, not a marketing page.
- The UI is intentionally compact and utility-focused.
- Category tabs are shown at the top.
- The active shelf is controlled with a two-option segmented control.
- The add/edit form is placed in a right-side panel on desktop and below the shelf content on smaller screens.
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
