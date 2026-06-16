# slayerref.md — RTR Project State & Architecture Reference

> Snapshot taken on **2026-06-17** (branch `kovas_changes`). This is a living reference of where the project actually is, not where the docs say it should be.

---

## 1. What RTR is now

RTR (Rising Teams Rating) started as a static, read-only esports rankings SPA. It has **pivoted into a Honor of Kings (HoK) tournament-hosting + talent-discovery + recruitment platform** running on **Supabase**.

- **Frontend:** React 19 + Vite 8 + React Router 7 + Tailwind 3 + **TanStack React Query 5**
- **Backend:** Supabase (Postgres + Auth + RLS + Storage + one Edge Function)
- **Auth:** Discord-only, via Supabase's Discord OAuth provider
- **Language:** JavaScript only (`.jsx` / `.js`) — no TypeScript
- **Ratings:** one unified Elo scale (1200 baseline) for every subject (players, teams, coaches, scouts, managers), written server-side only via SQL functions + a `rating_events` ledger. Clients cannot write ratings directly.

---

## 2. Architecture

### High-level data flow

```
┌─────────────────────────────────────────────────────────────┐
│  React App (Vite)                                            │
│                                                              │
│  Pages (src/pages) ── render ──> Components (src/components)  │
│        │                                                     │
│        └── consume ──> Hooks (src/hooks)                     │
│                            │                                 │
│            ┌───────────────┴───────────────┐                 │
│            │                               │                 │
│   React Query hooks            Legacy useData (static JSON)  │
│   (Supabase-backed)                        │                 │
│            │                               │                 │
└────────────┼───────────────────────────────┼────────────────┘
             │                               │
             ▼                               ▼
   src/lib/supabase.js              public/data/*.json
   (Postgres + Auth + RLS,          (teams, players, events,
    RPC functions, Storage)          stats, community)
```

### Auth & session

- `src/hooks/useAuth.jsx` — `AuthProvider` context. Loads the Supabase session, the `profiles` row, and the user's `user_roles`. Exposes `user`, `roles`, `isAuthenticated`, `needsOnboarding`, `loginWithDiscord`, `logout`.
git - `isAdmin` = `profiles.is_admin || profiles.is_superuser`; `isSuperuser` distinguishes the higher tier.
- A signed-in user with **zero roles** is sent to onboarding.

### Routing (`src/App.jsx`)

| Route | Page | Notes |
|---|---|---|
| `/` | Home | landing / stats |
| `/teams`, `/players` | Teams, Players | leaderboards |
| `/community`, `/news` | Community, News | |
| `/directory` | Directory | talent directory |
| `/login`, `/auth/discord/callback` | Login, DiscordCallback | Discord OAuth |
| `/onboarding`, `/profile/edit`, `/profile`, `/profile/:id` | ProfileEdit / ProfileView | |
| `/dashboard` | Dashboard | role-aware hub (see §3) |
| `/tournaments` | TournamentsPage | |
| `/team/:id` | TeamManage | |
| `/player/:id` | PlayerPage | |
| `/admin` | AdminDashboard | admin/superuser only |

### Hooks layer (`src/hooks/`) — the real data API

All Supabase access is funneled through React Query hooks:

`useAuth`, `useProfiles`, `useTeams`, `useTournaments`, `useMatches`, `useMatchResolvers`, `useRankings`, `useScouting`, `useEndorsements`, `useNews`, `useDirectMessages`, `useTeamTournamentInvitations`, `useReferenceData`, `useAdmin`, and the legacy `useData`.

### Tables & RPCs the frontend talks to

**Tables (`.from(...)`):** `profiles`, `user_roles`, `player_profiles`, `coach_profiles`, `scout_profiles`, `team_manager_profiles`, `tournament_manager_profiles`, `teams`, `team_members`, `team_staff`, `applications`, `scout_interests`, `endorsements`, `ratings`, `rating_events`, `news_posts`, `matches`, `reported_matches`, `scheduled_matches`, `scrim_posts`, `conversations`, `messages`, `tournaments`, `tournament_teams`, `tournament_players`, `tournament_brackets`, `tournament_invitations`, reference tables `lanes` / `ranks` / `regions`.

**RPC functions (SECURITY DEFINER):** `report_match_outcome`, `report_match_immediate`, `report_player_match_immediate`, `confirm_match_outcome`, `resolve_match_with_all_members`, `get_player_matches`, `get_user_matches`, `award_tournament_bonus_elo`, `admin_adjust_rating`, `admin_remove_role`, `set_user_admin`, `respond_to_application`, `withdraw_application`, `review_news_post`.

### Supabase project layout (`supabase/`)

- `migrations/0001_core … 0011_news` (core, functions, RLS, grants, admin, superuser, teams, team_staff, scout_interests, endorsements, news)
- `functions/discord-match-notification` — Edge Function
- `seed.sql`, `seed_demo.sql`, `reset.sql`, `restore_superadmin.sql`, `README.md`
- Project ref: `ngrlfkgzwojoqheklwuq`. Frontend reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from `.env`.

> ⚠️ **Schema drift:** committed migrations stop at `0011_news`, but the app actively uses `matches`, `reported_matches`, `scheduled_matches`, `scrim_posts`, `conversations`, `messages`, `tournaments*`, `tournament_brackets/invitations/players/teams`, and the match/tournament/chat RPCs. Those objects exist in the live DB (applied via the Supabase SQL Editor) but are **not captured as migration files in the repo**. See §5.

---

## 3. Roles — what each does

There are **5 user roles** (`user_role` enum) plus **admin / superuser** flags. A user can hold multiple roles. On the Dashboard each role renders its own panel (`RolePanel` → panel component). Admins see *all* role panels.

| Role | Dashboard panel | What they do |
|---|---|---|
| **player** | `PlayerPanel` | Maintain a player profile (lanes, rank, region), receive team invites, report 1v1/team match results, get endorsed/scouted, carry a player Elo. |
| **team_manager** | `TeamManagerPanel` (in `Dashboard.jsx`) + `/team/:id` (`TeamManage`) | Create & manage teams, review/accept applications, manage roster (`team_members`) and staff (`team_staff`), enter tournaments, report team matches. |
| **coach** | `CoachPanel` | Coach profile, endorsements, attach to teams as staff; carries a coach Elo moved by endorsements/achievements. |
| **scout** | `ScoutPanel` | Watchlist + `scout_interests` (express interest in players), recruitment-side discovery; carries a scout Elo. |
| **tournament_manager** | `TournamentManagerPanel` (`src/components/tournament-manager/`) | Create/run tournaments: creation wizard, match pool, scheduling, brackets (`react-brackets` via `BracketRenderer`), invitations, standings; awards bonus Elo on placement. |

**Admin / Superuser** (`/admin`, `AdminDashboard` + `src/components/admin/`):
- `AdminOverview`, `AdminUsers` (grant/remove roles, set admin), `AdminRatings` (manual Elo adjustments via `admin_adjust_rating`), `AdminReference` (lanes/ranks/regions/heroes), `AdminTasks` (approve reported matches, review news posts).
- Superuser is the higher tier; `restore_superadmin.sql` exists to recover it.

**Cross-cutting features (not a role):**
- **Direct chat** — `ChatContext` / `ChatModal` / `ChatWindow` / `MessageInbox`, backed by `conversations` + `messages` (`useDirectMessages`). Used for team invites and confirmations as chat messages (`InvitationMessage`).
- **Match reporting & confirmation** — `ReportMatch` page + `RecentMatches`; reported matches require admin approval (`reported_matches` + resolver RPCs).

---

## 4. Is all data from the DB?

**No — most is, but not all.** There are two data sources live at once:

### From Supabase (the platform proper)
Auth, profiles, roles, teams, rosters/staff, applications, scouting, endorsements, ratings/rating_events, **news (`news_posts`)**, matches, tournaments, brackets, scrims, and chat — all via React Query hooks and RPCs.

### Still from static JSON (legacy `useData` → `public/data/*.json`)
`src/hooks/useData.js` fetches `teams.json`, `players.json`, `news.json`, `events.json`, `community.json`, `stats.json`. It is still consumed by:

- **`src/pages/Home.jsx`** — landing-page stat counters (`teams.length`, `players.length`, `stats.eventsRecorded`) and the **Upcoming Events** list come from JSON. (Home's *news* feed does use the DB via `NewsFeed`/`news_posts`.)
- **`src/pages/Community.jsx`** — community lists from `community.json`.

**Implication:** the headline numbers on the homepage and the events/community sections are **stale static files, not live DB data**. Everything behind login (dashboard, teams, tournaments, matches, scouting, chat) is fully DB-backed.

---

## 5. Notable risks / open items

1. **Migration drift** — Live tournament/match/chat schema isn't in `supabase/migrations/`. A fresh `supabase` setup from the repo would **not** reproduce the current DB. Recommend back-filling migrations `0012+` for matches, tournaments, scrims, and conversations/messages.
2. **Dual data source** — Home/Community on static JSON contradicts the project's "no hardcoded data / all from DB" rule. Migrate these to Supabase (live counts + an events/community table) to retire `useData`.
3. **`graphify-out/` is dirty in git** — generated graph artifacts (and an AST cache) are tracked/untracked in the working tree; consider gitignoring `graphify-out/`.

---

## 6. Build & run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
npm run lint
```

Requires `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
