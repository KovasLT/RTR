# RTR Code Walkthrough

A guide to the Rising Teams Rating (RTR) codebase: how the frontend, data layer,
and Supabase backend fit together.

> RTR began as a static, read-only rankings SPA backed by JSON files. It is now a
> **Honor of Kings tournament + talent + recruitment platform** backed by
> **Supabase**. A couple of legacy pages still read the old JSON files (noted
> below); everything new goes through Supabase.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Entry Points & Providers](#entry-points--providers)
- [Routing](#routing)
- [Authentication](#authentication)
- [Data Layer (React Query + Supabase)](#data-layer-react-query--supabase)
- [The Backend (`supabase/`)](#the-backend-supabase)
- [The Rating System](#the-rating-system)
- [Pages & Components](#pages--components)
- [Conventions](#conventions)
- [File Organization](#file-organization)
- [Common Flows](#common-flows)
- [Where to Start](#where-to-start)

## Overview

RTR lets the HoK community run on a shared, tamper-resistant rating system.
Players build profiles, join team rosters, and get scouted; managers run teams
and respond to applications; admins manage reference data and rating
adjustments. Key ideas:

- **Discord-only auth** through Supabase.
- **One unified Elo scale** for every kind of subject.
- **Server-authoritative writes** for anything that affects a rating.
- **All UI copy centralized** in `app-constants.jsx`; **no hardcoded data**.

## Architecture

```
┌──────────────────────────────────────────────┐
│                  Browser (React 19)            │
│  ┌────────────────────────────────────────┐   │
│  │  React Router  →  Lazy-loaded Pages     │   │
│  ├────────────────────────────────────────┤   │
│  │  AuthProvider (useAuth context)         │   │
│  │  QueryClientProvider (React Query)      │   │
│  ├────────────────────────────────────────┤   │
│  │  Hooks: useTeams, useProfiles, ...      │   │
│  │         → src/lib/supabase.js client    │   │
│  └───────────────────┬────────────────────┘   │
└──────────────────────┼─────────────────────────┘
                       │  HTTPS (anon key + JWT)
                       ▼
┌──────────────────────────────────────────────┐
│                   Supabase                     │
│  Auth (Discord)  •  Postgres  •  Storage       │
│  Row-Level Security  +  SECURITY DEFINER RPCs  │
└──────────────────────────────────────────────┘
```

The browser only ever holds the **anon key**. Read access is governed by RLS
policies; sensitive writes (ratings, application accept/withdraw, member removal)
go through `SECURITY DEFINER` database functions called via `supabase.rpc(...)`.

## Entry Points & Providers

### `index.html`
Root HTML: page shell, FontAwesome via CDN, and the `#root` mount point.

### `src/main.jsx`
Bootstraps React and renders `<App />` inside `<StrictMode>`.

### `src/App.jsx`
The composition root. It wraps the app in two providers and defines the layout +
routes:

```jsx
<QueryClientProvider client={queryClient}>   // React Query cache
  <AuthProvider>                              // Supabase auth/session context
    <Router>
      <Header />
      <main><Suspense fallback={<LoadingSpinner/>}><Routes>…</Routes></Suspense></main>
      <Footer />
    </Router>
  </AuthProvider>
</QueryClientProvider>
```

Every page is `React.lazy()`-imported, so each route is its own chunk and loads
behind a `<Suspense>` boundary.

## Routing

Defined in `src/App.jsx`:

| Path                        | Component         | Notes                                              |
| --------------------------- | ----------------- | -------------------------------------------------- |
| `/`                         | `HomeRoute`       | Renders `Dashboard` if signed in, else `Home`      |
| `/teams`                    | `Teams`           | Teams leaderboard                                  |
| `/players`                  | `Players`         | Player rankings                                    |
| `/community`                | `Community`       | Community resources (legacy JSON data)             |
| `/news`                     | `News`            | News feed                                          |
| `/directory`                | `Directory`       | Searchable role directory (players/coaches/…)      |
| `/login`                    | `Login`           | "Continue with Discord"                            |
| `/register`                 | →`/login`         | Discord-only, so register === login                |
| `/onboarding`               | `ProfileEdit`     | First-run profile setup (shares the edit form)     |
| `/profile/edit`             | `ProfileEdit`     | Edit own profile                                   |
| `/profile`, `/profile/:id`  | `ProfileView`     | View own / another profile                         |
| `/dashboard`                | `Dashboard`       | Signed-in home                                     |
| `/team/:id`                 | `TeamManage`      | Manage a team (roster, applications, staff)        |
| `/admin`                    | `AdminDashboard`  | Admin/superuser tools                              |
| `/auth/discord/callback`    | `DiscordCallback` | OAuth redirect target                              |

`HomeRoute` is the one piece of route logic worth knowing: it reads `useAuth()`
and swaps the landing page for the dashboard once a session exists.

## Authentication

Lives in **`src/hooks/useAuth.jsx`** — a context provider exposing a stable
surface to the whole app.

- On mount it calls `supabase.auth.getSession()` and subscribes to
  `onAuthStateChange`. Whenever the session changes it reloads the user's
  `profiles` row **and** their `user_roles`.
- `loginWithDiscord()` kicks off `supabase.auth.signInWithOAuth({ provider:
  'discord' })` with a redirect to `/auth/discord/callback` (PKCE flow).
- `mapUser()` flattens the auth user + profile row into the `user` object the UI
  expects (`username`, `handle`, `avatar`, `isAdmin`, `isSuperuser`, …). Note
  `isAdmin` is true for **either** `is_admin` or `is_superuser`; `isSuperuser`
  distinguishes the higher tier.
- `needsOnboarding` is `true` when a user is signed in but has **no roles yet** —
  that's what gates the onboarding flow.

Consume it anywhere with `const { user, isAuthenticated, isLoading, ... } = useAuth()`.

If Supabase env vars are absent, `isSupabaseConfigured()` is false and the
provider short-circuits into a non-loading, signed-out state so the app still
renders.

## Data Layer (React Query + Supabase)

`src/lib/supabase.js` exports a single shared browser client (PKCE, persisted
session, auto-refresh), plus `isSupabaseConfigured()`. It's `null` when env vars
are missing so callers can degrade gracefully.

Each feature has a hook in `src/hooks/` that wraps **TanStack React Query**
around Supabase queries/mutations. The shared pattern: queries are `enabled`
only when `supabase` exists (and the needed id is present), mutations call
`invalidateQueries` on success to keep the cache fresh, and a small `unwrap`
helper throws on `{ error }`.

| Hook                   | Responsibility                                                     |
| ---------------------- | ----------------------------------------------------------------- |
| `useAuth.jsx`          | Session, profile, roles, login/logout (context, not React Query)  |
| `useReferenceData.js`  | `regions`, `lanes`, `ranks`, `heroes` — cached forever (`staleTime: Infinity`) |
| `useProfiles.js`       | Profile fetch/update; directory listings                          |
| `useTeams.js`          | Teams, rosters, staff, applications + all team mutations/RPCs      |
| `useRankings.js`       | Leaderboards / ranking reads                                      |
| `useScouting.js`       | Scout interests                                                    |
| `useEndorsements.js`   | Endorsements between users                                         |
| `useNews.js`           | News feed                                                          |
| `useAdmin.js`          | Admin reads + rating-adjustment RPCs                              |
| `useData.js`           | **Legacy** — fetches `public/data/*.json`; used only by `Home` and `Community` |

`useTeams.js` is the richest example. Reads use Supabase's nested-select syntax
to pull a team with its `members`, `staff`, and `applications` in one round-trip,
then it joins in the team's Elo from the `ratings` table. Writes that touch
ratings or lifecycle state go through RPCs — e.g. `respond_to_application`,
`withdraw_application`, `remove_team_member` — never raw table writes.

## The Backend (`supabase/`)

SQL is split into ordered migration files; apply them in order in the Supabase
**SQL Editor**, then run `seed.sql`. See `supabase/README.md` for the full guide.

| File                          | Purpose                                                |
| ----------------------------- | ------------------------------------------------------ |
| `0001_core.sql`               | Core tables: profiles, roles, reference data, ratings  |
| `0002_functions.sql`          | Rating functions (`apply_elo_match`, endorsements, …)  |
| `0003_rls.sql`                | Row-Level Security policies                             |
| `0004_grants.sql`             | Table grants for `anon` / `authenticated` (see note)   |
| `0005_admin.sql`              | Admin flags & tooling                                  |
| `0006_superuser.sql`          | Superuser tier                                         |
| `0007_teams.sql`              | Teams, members, applications + lifecycle RPCs          |
| `0008_team_staff.sql`         | Team staff roles                                       |
| `0009_scout_interests.sql`    | Scouting interest records                              |
| `0010_endorsements.sql`       | Endorsements                                           |
| `0011_news.sql`               | News feed                                              |
| `seed.sql` / `seed_demo.sql`  | Reference data and demo content                        |

**Gotcha:** tables created via raw SQL are **not** auto-granted to the
`anon`/`authenticated` roles. RLS controls *which rows* are visible, but you also
need the `GRANT`s in `0004_grants.sql`, or PostgREST returns
`42501 permission denied`.

Reference data is fixed by product decision:
- **Rank ladder:** Bronze, Silver, Gold, Platinum, Diamond, Master, Grandmaster,
  Mythic, Epic, Legend (no King/Glory).
- **Lanes:** Clash Lane, Jungle, Mid Lane, Farm Lane, Roaming.

## The Rating System

One unified Elo scale, **1200 baseline**, for every subject (players, teams,
coaches, scouts, managers). The client **cannot** write ratings — there is no
RLS write policy on the rating tables. All changes:

1. Go through a `SECURITY DEFINER` function: `apply_elo_match` (match results),
   `apply_endorsement`, `apply_achievement`, or `admin_adjust_rating`.
2. Append a row to the **`rating_events` ledger** for auditability.
3. Update the derived `ratings` table that the UI reads.

This is why hooks read `ratings` directly but always mutate via `supabase.rpc()`.

## Pages & Components

**Pages (`src/pages/`)** are route-level and lazy-loaded:
`Home`, `Dashboard`, `Teams`, `Players`, `Directory`, `ProfileView`,
`ProfileEdit` (also onboarding), `TeamManage`, `News`, `Community`, `Login`,
`DiscordCallback`, `AdminDashboard`.

**Components (`src/components/`)** are reusable UI:
- `Header.jsx` — nav + branding, active-route highlighting, auth-aware actions.
- `Footer.jsx` — copyright/legal text.
- `LoadingSpinner.jsx` — Suspense fallback and loading states.
- `ConfirmDialog.jsx` — confirmation modal for destructive actions.
- `NewsFeed.jsx`, `Sparkline.jsx` — feature widgets.
- `admin/` — `AdminOverview`, `AdminRatings`, `AdminReference`, `AdminUsers`,
  the panels composed by `AdminDashboard`.

## Conventions

- **Text constants:** all UI copy lives in `src/app-constants.jsx`. Components
  reference `APP_CONSTANTS.*` rather than inline strings.
- **No hardcoded data:** dynamic content comes from Supabase (or, for the two
  legacy pages, JSON). Reference tables are data too.
- **JavaScript only:** `.jsx`/`.js`, no TypeScript. JSDoc provides type hints.
- **Server-authoritative ratings:** never write ratings from the client.

## File Organization

```
src/
├── app-constants.jsx       # All UI text and labels
├── main.jsx                # React bootstrap
├── App.jsx                 # Providers, router, layout
├── index.css               # Global styles + Tailwind layers
│
├── lib/
│   └── supabase.js         # Shared Supabase client + isSupabaseConfigured()
│
├── hooks/                  # React Query data hooks + useAuth context
│   ├── useAuth.jsx         #   session / profile / roles
│   ├── useReferenceData.js #   regions, lanes, ranks, heroes
│   ├── useProfiles.js  useTeams.js  useRankings.js
│   ├── useScouting.js  useEndorsements.js  useNews.js  useAdmin.js
│   └── useData.js          #   legacy JSON loader (Home + Community only)
│
├── components/             # Reusable UI
│   ├── Header.jsx  Footer.jsx  LoadingSpinner.jsx
│   ├── ConfirmDialog.jsx  NewsFeed.jsx  Sparkline.jsx
│   └── admin/              #   AdminOverview/Ratings/Reference/Users
│
└── pages/                  # Route-level, lazy-loaded

supabase/
├── migrations/             # Ordered SQL (schema → functions → RLS → grants → features)
├── seed.sql  seed_demo.sql # Reference + demo data
├── reset.sql  restore_superadmin.sql
└── README.md               # Backend setup guide

public/data/                # Legacy JSON consumed by useData.js
```

## Common Flows

### First login (onboarding)
```
1. User clicks "Continue with Discord" on /login
2. loginWithDiscord() → Supabase OAuth → Discord → /auth/discord/callback
3. DiscordCallback finalizes the session; AuthProvider loads profile + roles
4. No roles yet → needsOnboarding is true → ProfileEdit (onboarding)
5. User picks role(s)/details; profile + user_roles rows are written
6. HomeRoute now renders Dashboard
```

### Player applies to a team
```
1. Player opens a recruiting team (useRecruitingTeams / TeamManage view)
2. useTeamMutations().applyToTeam inserts an application (type: 'apply')
3. Manager sees it in TeamManage (useTeam pulls applications)
4. Manager accepts → respond_to_application RPC (SECURITY DEFINER)
5. RPC adds the roster member and invalidates ['teams']/['applications']
6. React Query refetches; both UIs update
```

### Admin adjusts a rating
```
1. Admin opens /admin → AdminRatings
2. Submits an adjustment → admin_adjust_rating RPC
3. RPC writes a rating_events ledger row + updates ratings
4. Affected leaderboards/profiles reflect the new value on next fetch
```

## Where to Start

- **New to the code?** Read `App.jsx` (wiring) → `hooks/useAuth.jsx` (sessions)
  → `lib/supabase.js` → one feature hook like `hooks/useTeams.js`.
- **Adding a feature?** Add a migration in `supabase/migrations/`, a hook in
  `src/hooks/`, a page/route in `src/App.jsx`, and any copy in `app-constants.jsx`.
- **Changing copy?** Edit `src/app-constants.jsx`.
- **Backend changes?** Write SQL in `supabase/migrations/`; remember RLS *and*
  grants, and keep rating writes inside `SECURITY DEFINER` functions.
