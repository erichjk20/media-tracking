# shelvd

Track your media without the noise.

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `supabase/schema.sql`.
4. Copy your project URL and anon key into `.env.local`:

```text
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

If those variables are missing or Supabase is unavailable, the app falls back to browser `localStorage`.
