# shelvd

Track your media without the noise.

## App Flow

Signed-in users land on a centered quick-log homepage. Choose a media type, search a title, and the add sheet opens with lookup results for that category. The add sheet keeps the shelf choice fast with a Completed/Want segmented control, so the homepage stays focused on finding the media first.

Lookup results populate the form and cover art automatically. The add sheet shows a cover preview by default; users can add, change, remove, or paste a cover URL only when they need to override the sourced image. Library browsing, stats, and recently added items live outside the homepage so the first screen stays focused on logging.

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/schema.sql`.
4. In Supabase Auth, make sure Email provider magic links are enabled and add your local/production site URL to the allowed redirect URLs.
5. Copy your project URL and anon key into `.env.local`:

```text
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

When Supabase is configured, users sign in with an email magic link and their private library rows are scoped by Supabase Auth + row-level security.

If you already have personal rows in `library_items`, sign in once with your email and run the one-time backfill SQL at the bottom of `supabase/schema.sql` so those rows belong to your auth user. Rerun the schema after backfilling to make `library_items.user_id` required.

If the Supabase variables are missing, the app runs as a local development/demo tracker using browser `localStorage`.

## Free Local Auth Testing

Use local Supabase when you need to test magic-link sign-in repeatedly without spending money or hitting hosted email limits.

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
7. Start the app with `npm run dev`, sign in, then open the local email inbox at `http://localhost:54324` to grab the magic link.

## Development Checks

```bash
npm run lint
npm run build
```
