# Supabase setup for RTR

The app now uses Supabase (Postgres + Auth + RLS) as its backend.

## 1. Create the project

1. Go to <https://supabase.com> → **New project**. Pick a name + region close to
   your users. Save the database password somewhere safe.
2. When it's ready, open **Settings → API** and copy:
   - **Project URL** → `.env` as `VITE_SUPABASE_URL`
   - **anon public** key → `.env` as `VITE_SUPABASE_ANON_KEY`

## 2. Enable Discord login

1. In Supabase: **Authentication → Providers → Discord** → enable it.
2. It shows a **redirect/callback URL** like
   `https://<project>.supabase.co/auth/v1/callback`.
3. In the [Discord Developer Portal](https://discord.com/developers/applications)
   → your app → **OAuth2 → Redirects**, add that Supabase callback URL.
4. Copy your Discord **Client ID** + **Client Secret** into the Supabase Discord
   provider fields and save. (The secret now lives in Supabase, not our repo.)
5. In Supabase **Authentication → URL Configuration**, set **Site URL** to
   `http://localhost:5173` (add your production URL later) and add
   `http://localhost:5173/auth/discord/callback` to **Redirect URLs**.

## 3. Apply the schema

**Option A — SQL editor (quickest):** open **SQL Editor** in Supabase and run,
in order, the contents of:

1. `migrations/0001_core.sql`
2. `migrations/0002_functions.sql`
3. `migrations/0003_rls.sql`
4. `seed.sql`

**Option B — Supabase CLI:**

```bash
supabase link --project-ref <your-ref>
supabase db push          # applies migrations/
# then run seed.sql via the SQL editor or psql
```

## 4. Run the app

```bash
npm run dev
```

Open <http://localhost:5173/login> → **Continue with Discord**. On first login a
`profiles` row is created automatically, and you'll be sent to onboarding.

## Notes

- The **anon key is publishable** (safe in the frontend). RLS is what protects
  data — never use the `service_role` key in the browser.
- Ratings can only be changed through the SQL functions in
  `0002_functions.sql` (`apply_elo_match`, `apply_endorsement`,
  `apply_achievement`, `admin_adjust_rating`); direct client writes are blocked
  by RLS.
- To make yourself an admin: in the SQL editor run
  `update profiles set is_admin = true where email = 'you@example.com';`
