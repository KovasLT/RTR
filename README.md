# RTR — Rising Teams Rating

A **Honor of Kings (HoK)** tournament-hosting, talent-discovery, and recruitment
platform. Players, teams, coaches, scouts, and managers each carry a single
unified Elo rating that moves through verified match results, endorsements, and
achievements.

Built with **React 19 + Vite** on the frontend and **Supabase**
(Postgres + Auth + Row-Level Security + Storage) on the backend. Authentication
is **Discord-only**, via Supabase's Discord provider.

---

## Quick Start

### Prerequisites

- **Node.js 18+** and **npm 9+**
- A **Supabase project** (free tier is fine) — see [Backend setup](#backend-setup) below
- A **Discord application** for OAuth login

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and fill in your Supabase credentials
(**Supabase dashboard → Settings → API**):

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```

> The `anon` key is publishable and is meant to live in the frontend — RLS is
> what protects your data. Never put the `service_role` key in `.env`.

`.env` is gitignored. If these vars are missing the app still boots, but shows a
"setup needed" state instead of crashing.

### 3. Set up the backend

The database schema, auth, and seed data live in [`supabase/`](supabase/). Follow
**[`supabase/README.md`](supabase/README.md)** for the full walkthrough. In short:

1. Enable the **Discord** provider in Supabase Auth and wire up the callback URL.
2. In the Supabase **SQL Editor**, run the migrations in order, then the seed:
   - `supabase/migrations/0001_core.sql` … through the latest `00NN_*.sql`
   - `supabase/seed.sql`
3. (Optional) make yourself an admin:
   ```sql
   update profiles set is_admin = true where email = 'you@example.com';
   ```

### 4. Run the app

```bash
npm run dev
```

Open **http://localhost:5173**, click **Continue with Discord**. On first login a
`profiles` row is created automatically and you're sent to onboarding.

---

## Available Scripts

```bash
npm run dev      # Start dev server with HMR (http://localhost:5173)
npm run build    # Production build with code splitting
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint over the codebase
```

---

## Tech Stack

| Layer       | Choice                                                        |
| ----------- | ------------------------------------------------------------ |
| UI          | React 19, React Router DOM 7                                  |
| Build       | Vite 8 (HMR, route-based code splitting)                      |
| Styling     | Tailwind CSS 3                                                |
| Data        | TanStack React Query 5 + `@supabase/supabase-js`             |
| Backend     | Supabase (Postgres, Auth, RLS, Storage)                      |
| Auth        | Discord OAuth via Supabase (PKCE flow)                        |

---

## Project Structure

```
src/
├── app-constants.jsx   # ALL UI copy (no hardcoded strings in components)
├── App.jsx             # Router, providers (React Query + Auth), layout
├── lib/supabase.js     # Shared Supabase browser client
├── hooks/              # React Query data hooks + useAuth context
├── components/         # Reusable UI (Header, Footer, admin/, ...)
└── pages/              # Route-level components (lazy loaded)

supabase/
├── migrations/         # Ordered SQL: schema, functions, RLS, grants, features
├── seed.sql            # Reference + demo data
└── README.md           # Full backend setup guide
```

For a deeper tour of how it all fits together, see
**[`CODE_WALKTHROUGH.md`](CODE_WALKTHROUGH.md)**.

---

## How ratings work

Every subject — player, team, coach, scout, manager — sits on **one Elo scale
(1200 baseline)**. Ratings are **never written from the client**: there is no RLS
write policy on the rating tables. Instead, all changes flow through
`SECURITY DEFINER` SQL functions (`apply_elo_match`, `apply_endorsement`,
`apply_achievement`, `admin_adjust_rating`) which append to a `rating_events`
ledger. This keeps the rating system tamper-resistant and auditable.

---

## Conventions

- **All UI text** lives in `src/app-constants.jsx` — components hold no string
  literals except dynamic data.
- **No hardcoded data** — everything comes from Supabase (including reference
  tables: lanes, ranks, regions, heroes).
- **JavaScript only** (`.jsx` / `.js`), no TypeScript.

## License

MIT License — see LICENSE file for details.
