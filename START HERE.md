# START HERE — RTR Handover & Local Setup

Welcome. This is the **one document to read first** when you take over RTR. It
covers what the project is, everything you need to configure, and the exact steps
to get it running on your machine.

> **TL;DR:** install Node deps → create a Supabase project → enable Discord login
> → run the SQL migrations + seed → put two keys in `.env` → `npm run dev`.
> Full detail below.

---

## 1. What is RTR?

RTR (Rising Teams Rating) is a **Honor of Kings (HoK)** tournament-hosting,
talent-discovery, and recruitment platform.

- Players, teams, coaches, scouts, and managers each carry **one unified Elo
  rating** (1200 baseline) that moves via verified results, endorsements, and
  achievements.
- **Frontend:** React 19 + Vite + React Router + Tailwind, data via TanStack
  React Query.
- **Backend:** Supabase — Postgres + Auth + Row-Level Security + Storage.
- **Login:** Discord only, through Supabase's Discord provider.
- **Language:** JavaScript only (`.jsx` / `.js`), no TypeScript.

### Companion docs

| Doc                                          | What it's for                              |
| -------------------------------------------- | ------------------------------------------ |
| **`START HERE.md`** (this file)              | Handover + full local setup                |
| [`README.md`](README.md)                     | Project overview + quick start             |
| [`CODE_WALKTHROUGH.md`](CODE_WALKTHROUGH.md) | How the codebase fits together             |
| [`supabase/README.md`](supabase/README.md)  | Backend / Supabase setup reference         |
| [`CLAUDE.md`](CLAUDE.md)                      | Conventions & rules for the codebase       |

---

## 2. Prerequisites

Install these before you start:

- **Node.js 18+** and **npm 9+** — check with `node -v` and `npm -v`.
- A **Supabase account** (free tier is fine) — <https://supabase.com>.
- A **Discord account** + access to the **Discord Developer Portal** —
  <https://discord.com/developers/applications>.
- **Git**, and a code editor (VS Code recommended).

No global CLIs are strictly required. The Supabase CLI is optional (you can do
everything from the Supabase dashboard's SQL Editor).

---

## 3. Local setup, step by step

### Step 1 — Get the code & install dependencies

**How to do it:**

1. **Clone the repo.** Replace `<repo-url>` with the actual URL (from your Git
   host's green "Code" button → copy HTTPS or SSH):
   ```bash
   git clone <repo-url>
   ```
2. **Enter the folder** the clone created:
   ```bash
   cd RTR
   ```
3. **Install dependencies.** This reads `package.json` and creates `node_modules/`
   (a few hundred MB; takes a minute or two):
   ```bash
   npm install
   ```
   ✅ Success looks like `added N packages` with no red `ERR!` lines. If you see
   an engine error, your Node is too old — install Node 18+ and retry.

### Step 2 — Create a Supabase project

This is your backend (database + auth). You only do this once.

**How to do it:**

1. Go to <https://supabase.com> and **sign in** (GitHub login is easiest).
2. On the dashboard click **New project**. If prompted, create/choose an
   **organization** first (any name).
3. Fill the form:
   - **Name:** e.g. `rtr` (anything).
   - **Database Password:** click **Generate a password**, then **copy it and
     store it in your password manager**. You'll need it for direct DB access and
     it's not shown again.
   - **Region:** pick the one geographically closest to your users.
4. Click **Create new project** and wait ~2 minutes while it provisions (the
   header shows "Setting up project…").
5. When it's ready, in the left sidebar go to **Settings (gear icon) → API**.
   Leave this tab open — in **Step 5** you'll copy:
   - **Project URL** (under *Project URL*), e.g. `https://abcd1234.supabase.co`
   - **anon public** key (under *Project API keys* → the row labelled `anon`
     `public`). Use the **anon** key, **not** `service_role`.

### Step 3 — Enable Discord login

The app only supports Discord login, so you must connect a Discord OAuth app to
Supabase. This is a three-way wiring: Discord ↔ Supabase ↔ your local app.

**How to do it:**

1. **Turn on the provider in Supabase.** In the left sidebar go to
   **Authentication → Sign In / Providers** (or **Providers**), find **Discord**
   in the list, and toggle it **on**. A panel expands showing two empty fields
   (Client ID, Client Secret) and a **Callback URL (for OAuth)** that looks like
   `https://<your-project>.supabase.co/auth/v1/callback`. **Copy that callback
   URL** — you need it in the next step. Leave this panel open.
2. **Create the Discord application.** In a new tab open the
   [Discord Developer Portal](https://discord.com/developers/applications) →
   **New Application** → give it a name (e.g. `RTR`) → **Create**.
3. **Register the redirect.** In your Discord app's sidebar go to
   **OAuth2** → under **Redirects** click **Add Redirect**, paste the Supabase
   **callback URL** from step 1, and **Save Changes**.
4. **Copy Discord credentials into Supabase.** Still under **OAuth2** in Discord:
   - Copy the **Client ID** → paste into the Supabase Discord panel's
     **Client ID** field.
   - Click **Reset Secret** (or **Copy** if already shown) to get the
     **Client Secret** → paste into Supabase's **Client Secret** field.
   - Back in Supabase, click **Save**. *(The secret now lives in Supabase, never
     in this repo.)*
5. **Set the app URLs in Supabase.** Go to **Authentication → URL Configuration**:
   - **Site URL:** set to `http://localhost:5173`.
   - **Redirect URLs:** click **Add URL** and add
     `http://localhost:5173/auth/discord/callback`. Save.
   - (When you deploy, come back and add your production domain in both places.)

> Mismatched URLs are the #1 cause of login failures. The Discord redirect must
> be the **Supabase** callback; the Supabase redirect/site URLs must be your
> **localhost** app. See troubleshooting if login bounces back with an error.

### Step 4 — Apply the database schema

Now create the tables, functions, security policies, and reference data. You run
SQL files **in order** in Supabase's built-in editor — no local DB needed.

**How to do it:**

1. In the Supabase sidebar open **SQL Editor** and click **+ New query**.
2. For **each file below, in this exact order**:
   a. Open the file from this repo (e.g. `supabase/migrations/0001_core.sql`) in
      your code editor.
   b. **Select all** (Ctrl/Cmd+A) and **copy** its *contents*.
   c. **Paste** into the Supabase SQL Editor.
   d. Click **Run** (or Ctrl/Cmd+Enter). Wait for **Success. No rows returned**.
   e. Clear the editor (or open a new query) and repeat with the next file.

   Run them in this order:
   ```
   supabase/migrations/0001_core.sql
   supabase/migrations/0002_functions.sql
   supabase/migrations/0003_rls.sql
   supabase/migrations/0004_grants.sql
   supabase/migrations/0005_admin.sql
   supabase/migrations/0006_superuser.sql
   supabase/migrations/0007_teams.sql
   supabase/migrations/0008_team_staff.sql
   supabase/migrations/0009_scout_interests.sql
   supabase/migrations/0010_endorsements.sql
   supabase/migrations/0011_news.sql
   ```
3. Finally, run the reference-data seed the same way (regions, lanes, ranks,
   heroes):
   ```
   supabase/seed.sql
   ```
4. **Verify it worked:** in the sidebar open **Table Editor** — you should now see
   tables like `profiles`, `teams`, `ratings`, `regions`, `lanes`, `ranks`. Open
   `ranks` and confirm you see the 10 HoK tiers.

> **Don't skip `0004_grants.sql`.** Tables created via raw SQL are *not*
> auto-granted to the `anon`/`authenticated` roles. Without it the app gets
> `42501 permission denied` from PostgREST even though RLS is correct.

*Order matters:* later files reference objects created by earlier ones, so running
out of order will throw "relation/function does not exist" errors.

*(Optional — Supabase CLI instead of the editor: `supabase link --project-ref
<ref>` then `supabase db push`, then run `seed.sql` via the editor/psql.)*

### Step 5 — Configure the frontend environment

Tell the React app where your Supabase project is.

**How to do it:**

1. **Create your `.env`** by copying the template:
   ```bash
   cp .env.example .env
   ```
   (On Windows PowerShell: `Copy-Item .env.example .env`.)
2. **Open `.env`** in your editor. It has two empty variables.
3. **Paste the values from Step 2** (Supabase **Settings → API**):
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_public_key
   ```
   - `VITE_SUPABASE_URL` = the **Project URL**.
   - `VITE_SUPABASE_ANON_KEY` = the **anon public** key (a long `eyJ...` string).
4. **Save the file.** No quotes, no trailing spaces, no line breaks in the key.

- `.env` is **gitignored** (only `.env.example` is committed) — never commit it.
- The **anon key is publishable** and is meant to live in the frontend. RLS
  protects the data. **Never** put the `service_role` key in `.env` or the browser.

### Step 6 — Run the app

**How to do it:**

1. From the project root, start the dev server:
   ```bash
   npm run dev
   ```
2. Vite prints a local URL. Open **http://localhost:5173** in your browser.
3. You'll land on the public landing page. Click **Login** → **Continue with
   Discord** → authorize the app on Discord's prompt.
4. Discord redirects you back; on **first login** a `profiles` row is created
   automatically and you're taken to **onboarding** to set up your profile/role.

✅ If you see the landing page and can log in, you're done. If the page shows a
"setup needed" state or login errors out, see **Section 9 — Troubleshooting**.

---

## 4. Make yourself an admin / superuser

Some areas (the `/admin` dashboard, rating tools) require elevated flags. You set
them in the database after your account exists.

**How to do it:**

1. **Log in once** with Discord (Step 6) so your `profiles` row is created.
2. In Supabase open **SQL Editor → + New query**.
3. Paste **one** of these (replace the email with the one on your Discord account)
   and click **Run**:
   ```sql
   -- Admin (access to /admin tools):
   update profiles set is_admin = true where email = 'you@example.com';

   -- Superuser (higher tier; also gets admin):
   update profiles set is_superuser = true where email = 'you@example.com';
   ```
   You should see **Success. 1 row(s) affected**. (If it says 0 rows, the email
   doesn't match — check the exact value in the `profiles` table.)
4. **Refresh the app** (or log out and back in). The **Admin** area is now
   available in the nav.

---

## 5. Demo data (optional but recommended for testing)

Without demo data the directory and team pages look empty. This seeds realistic
content so you can click around.

**How to do it:**

1. Confirm migrations `0001`–`0008` and `seed.sql` are already applied (Step 4).
2. In Supabase **SQL Editor**, paste the contents of `supabase/seed_demo.sql` and
   click **Run**.
3. Reload the app and open **Directory** / **Teams** — you'll now see populated
   teams and players.

This creates 4 fully-staffed teams (manager + 5 players + coach + scout each) and
3 free-agent players. They are fake `@test.dev` users — they **cannot log in**,
none are admins, and the script is safe to re-run.

### Resetting demo data

Run these the same way (paste contents into SQL Editor → **Run**):

- **`supabase/reset.sql`** — removes all fake `@test.dev` users and their
  teams/data, **leaving real Discord accounts and any superuser fully intact**.
  Run `seed_demo.sql` again afterward for fresh demo content.
- **`supabase/restore_superadmin.sql`** — re-creates the "one of everything" setup
  (all five roles + role profiles + a personal team) for the first superuser, if a
  reset ever wiped it.

---

## 6. Everyday commands

```bash
npm run dev      # Dev server with HMR  → http://localhost:5173
npm run build    # Production build
npm run preview  # Preview the production build locally
npm run lint     # ESLint over the codebase
```

---

## 7. How auth & ratings work (so you don't trip over them)

- **Auth** is a context in `src/hooks/useAuth.jsx`. It tracks the Supabase
  session, loads the user's `profiles` row + `user_roles`, and exposes
  `loginWithDiscord()`, `logout()`, `user`, `isAuthenticated`, `needsOnboarding`.
  A signed-in user with **no roles yet** is sent to onboarding.
- **Ratings are server-authoritative.** The client cannot write them — there is
  no RLS write policy on the rating tables. All changes go through
  `SECURITY DEFINER` SQL functions (`apply_elo_match`, `apply_endorsement`,
  `apply_achievement`, `admin_adjust_rating`) which append to a `rating_events`
  ledger. Hooks read the `ratings` table but always mutate via `supabase.rpc()`.

See [`CODE_WALKTHROUGH.md`](CODE_WALKTHROUGH.md) for the full tour.

---

## 8. Locked product decisions (don't silently change)

- **Backend = Supabase**; frontend stays React 19 + Vite + React Query.
- **Auth = Discord only** via Supabase.
- **One Elo scale (1200) for every subject**, written only server-side.
- **JavaScript only**, no TypeScript.
- **All UI copy** lives in `src/app-constants.jsx`; **no hardcoded data** —
  everything (including reference tables) comes from Supabase.
- **HoK rank ladder:** Bronze, Silver, Gold, Platinum, Diamond, Master,
  Grandmaster, Mythic, Epic, Legend (no King/Glory).
- **HoK lanes:** Clash Lane, Jungle, Mid Lane, Farm Lane, Roaming.

---

## 9. Troubleshooting

| Symptom                                              | Likely cause / fix                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| App shows a "setup needed" state, no data           | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` missing in `.env`. Restart dev server after editing `.env`. |
| `42501 permission denied` in network/console        | `0004_grants.sql` wasn't run. Apply it.                                             |
| Discord login fails / redirect error               | Callback URL mismatch. Re-check Step 3 (Supabase callback in Discord; Site URL + redirect URL in Supabase). |
| Logged in but stuck on onboarding                   | Expected on first login (no roles yet). Complete the profile form.                 |
| Empty directory / no teams                          | Run `supabase/seed_demo.sql` (after migrations + `seed.sql`).                       |
| Can't reach `/admin`                                 | Set `is_admin` (or `is_superuser`) on your profile (Section 4), then refresh.       |
| Env changes not picked up                            | Vite only reads `.env` at startup — stop and re-run `npm run dev`.                  |

---

## 10. Handover checklist

- [ ] Repo cloned, `npm install` succeeds, `npm run dev` starts.
- [ ] Supabase project created; **Project URL** + **anon key** in `.env`.
- [ ] Discord OAuth app created; callback + redirect URLs configured.
- [ ] Migrations `0001`–`0011` + `seed.sql` applied (in order).
- [ ] Logged in with Discord; `profiles` row created.
- [ ] Made yourself `is_admin` / `is_superuser`; `/admin` works.
- [ ] (Optional) `seed_demo.sql` run for demo content.
- [ ] You have the Supabase **database password** and **dashboard access** for
      the project, and credentials for the Discord application.

Welcome aboard. 🚀
