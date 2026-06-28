# shelvd

Track your media without the noise.

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

## Development Checks

```bash
npm run lint
npm run build
```
