# shelvd

Track your media without the noise.

## App Flow

Signed-in users land on a centered quick-log homepage. Choose a media type, search a title, and the add sheet opens with lookup results for that category. The add sheet keeps the shelf choice fast with a Done/Want segmented control, so the homepage stays focused on finding the media first.

Lookup results populate the form and cover art automatically. The add sheet shows a cover preview by default; users can add, change, remove, or paste a cover URL only when they need to override the sourced image. Library browsing, stats, and recently added items live outside the homepage so the first screen stays focused on logging.

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/schema.sql`.
4. In Supabase Auth, make sure the Email provider is enabled with password sign-in and user signups, and add your local/production site URL to the allowed redirect URLs.
5. Copy your project URL and anon key into `.env.local`:

```text
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
ALADIN_TTB_KEY=your-aladin-ttb-key
```

When Supabase is configured, users can create an account or sign in with email and password, and their private library rows are scoped by Supabase Auth + row-level security.

If you already have personal rows in `library_items`, sign in once with your email and run the one-time backfill SQL at the bottom of `supabase/schema.sql` so those rows belong to your auth user. Rerun the schema after backfilling to make `library_items.user_id` required.

If the Supabase variables are missing, the app runs as a local development/demo tracker using browser `localStorage`.

## Free Production Deployment

The app is configured for Netlify Free hosting with Supabase Free for auth and data.

1. Push this repo to GitHub.
2. In Netlify, create a new site from the GitHub repo.
3. Use these build settings:

```text
Build command: npm run build
Publish directory: dist
```

4. Add these Netlify environment variables:

```text
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_OMDB_API_KEY=your-omdb-api-key
VITE_TMDB_ACCESS_TOKEN=your-tmdb-v4-read-access-token
VITE_TMDB_API_KEY=your-tmdb-v3-api-key
ALADIN_TTB_KEY=your-aladin-ttb-key
```

`ALADIN_TTB_KEY` is used by the Netlify Function at `/api/aladin/books`, so the Korean book lookup key is not exposed in the browser bundle.

5. In Supabase Auth settings, add your Netlify production URL to the allowed redirect URLs.
6. If the Supabase schema has not been created yet, run `supabase/schema.sql` in the Supabase SQL editor.
7. Deploy from Netlify.

Netlify reads `netlify.toml`, builds the Vite app into `dist`, serves it as a single-page app, and routes `/api/aladin/books` to the production function.

## Free Local Auth Testing

Use local Supabase when you need to test email/password sign-in and password reset flows without spending money or hitting hosted email limits.

1. Install Docker Desktop, OrbStack, or another Docker-compatible runtime.
2. Initialize Supabase locally if this repo does not already have `supabase/config.toml`:

```bash
npx supabase init
```

3. In `supabase/config.toml`, set the Auth site URL for the local Vite URL you will use. Vite usually starts on `http://localhost:5173`; if it prints another port, use that printed URL instead.

```toml
[auth]
site_url = "http://localhost:5173"
additional_redirect_urls = ["http://localhost:5173", "http://127.0.0.1:5173"]
```

4. Start the local Supabase stack:

```bash
npx supabase start
```

5. Copy the local API URL and anon key printed by the command into `.env.local`:

```text
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

6. Open local Supabase Studio at `http://localhost:54323`, paste `supabase/schema.sql` into the SQL editor, and run it.
7. Start the app with `npm run dev`.
8. Create a test user in local Supabase Studio under Authentication.
9. Sign in with that user's email and password. For password resets, open the local email inbox at `http://localhost:54324` to grab the reset link.

## Development Checks

```bash
npm run lint
npm run build
```
