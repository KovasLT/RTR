# Ratings-Only Guide — Strip RTR Down to the Rating System

This guide explains **how to remove everything except the rating system**, and
then **suggestions for improving the rating system** itself.

> Read this before deleting anything. The rating engine has a few dependencies
> (auth, profiles, roles) that *must* stay or ratings won't work. Everything else
> — teams, scouting, endorsements feature, news, directory, profiles editing —
> can go.

---

## ⭐ At a glance — the only things you MUST keep

If you remember nothing else, keep exactly this. Everything not on this list can
be deleted.

### ✅ KEEP (the rating system + what it needs to work)

**Database**
- 🟢 `ratings` + `rating_events` tables — *the scores and their history*
- 🟢 The enums `subject_type`, `rating_reason`, `user_role`
- 🟢 ALL of `0002_functions.sql` — *the rating engine (Elo, deltas, triggers)*
- 🟢 `profiles` + `user_roles` tables — *ratings attach to these / get seeded by these*
- 🟢 Auth (Discord login) — *identifies who a rating belongs to*

**Frontend**
- 🟢 `src/lib/supabase.js`, `src/hooks/useAuth.jsx` — *connection + login*
- 🟢 `src/hooks/useRankings.js` + `useAdmin.js` — *read/adjust ratings* (edit, see ⚠️)
- 🟢 A leaderboard page (`Players.jsx` / `Teams.jsx`) + `Login.jsx` + `DiscordCallback.jsx`

### ❌ REMOVE (every other feature)

> 🔴 Teams · 🔴 Scouting · 🔴 Endorsements feature · 🔴 News · 🔴 Community
> 🔴 Talent directory · 🔴 Profile view/edit & onboarding · 🔴 Dashboard

In SQL terms: **drop migrations `0007`–`0011`** (and trim `0001`/`0003`/`0004`).
In the app: **delete the matching pages, hooks, and components.**

### ⚠️ The one gotcha

`useRankings.js` references the **teams** tables. If you remove teams, you **must
edit `useRankings.js`** (details in [Part 3](#-important-caveat--userankingsjs-depends-on-teams)) or the leaderboard breaks.

*(Full keep/remove tables, exact files, and step order are in Parts 2–4 below.)*

---

## Part 1 — What the rating system actually is

The rating system is a small, self-contained core:

**Database (the engine):**
- **Enums:** `subject_type`, `rating_reason`, `user_role` (`0001_core.sql`)
- **Tables:** `ratings` (current score per subject) and `rating_events`
  (append-only history ledger) (`0001_core.sql`)
- **Functions/triggers** (`0002_functions.sql`):
  - `ensure_rating`, `apply_rating_delta` — the low-level writers
  - `apply_elo_match` — head-to-head Elo update (players or teams)
  - `apply_endorsement`, `apply_achievement`, `admin_adjust_rating` — other delta sources
  - `handle_new_role` trigger — seeds a 1200 rating + an `initial` ledger row when a role is added
  - `handle_new_user` trigger — creates a `profiles` row on signup

**Dependencies it can't live without:**
- **Auth + `profiles`** — every rating is attached to a subject (a profile id or
  team id); `rating_events.created_by` references `profiles`.
- **`user_roles`** — the `handle_new_role` trigger is what *seeds* a subject's
  rating. Without roles, nothing gets an initial rating.

Everything else in the schema (teams, staff, scout interests, endorsement
records, news, role-specific profile tables) is **feature data**, not the engine.

---

## Part 2 — Backend: what to keep vs remove

### Keep these migrations (the engine + its dependencies)

| File | Keep? | Notes |
| --- | --- | --- |
| `0001_core.sql` | ✅ Keep (trim) | Keep the enums, `profiles`, `user_roles`, `ratings`, `rating_events`, and their indexes. You *may* drop the role-specific profile tables (`player_profiles`, `coach_profiles`, `scout_profiles`, `tournament_manager_profiles`, `team_manager_profiles`) and the reference tables (`regions`, `lanes`, `ranks`, `heroes`) — but if you drop `regions` you must also drop `profiles.region_id`, and if you drop `lanes`/`ranks` you must drop `player_profiles` too. |
| `0002_functions.sql` | ✅ Keep all | This is the rating engine. |
| `0003_rls.sql` | ✅ Keep (trim) | Keep policies on `profiles`, `user_roles`, `ratings`, `rating_events`. Delete policy statements for any table you removed. |
| `0004_grants.sql` | ✅ Keep (trim) | Keep grants for the tables you kept; drop the rest. |
| `0005_admin.sql` | ✅ Keep | Provides `admin_adjust_rating` authorization + `set_user_admin`. Needed if admins adjust ratings. |
| `0006_superuser.sql` | ⚪ Optional | Only if you want the superuser tier. |

### Remove these migrations (the non-rating features)

| File | What it adds — safe to drop |
| --- | --- |
| `0007_teams.sql` | Teams, rosters, applications |
| `0008_team_staff.sql` | Team staff roles |
| `0009_scout_interests.sql` | Scouting interest records |
| `0010_endorsements.sql` | The endorsement **feature** table (the `apply_endorsement` *function* stays in `0002`) |
| `0011_news.sql` | News feed |

### Easiest path

- **Fresh database:** run `0001`–`0006` (optionally `seed.sql` for reference
  data), and simply **don't run** `0007`–`0011`.
- **Existing database:** `drop table ... cascade;` the feature tables added by
  `0007`–`0011` (teams, team_members, team_staff, applications, scout_interests,
  endorsements, news). `cascade` removes their policies/grants too.

> ⚠️ **Note on team ratings:** with teams removed, nothing auto-seeds a `team`
> rating. You can still rate any team id by calling
> `select ensure_rating('team', '<uuid>');` (or `apply_elo_match` auto-creates
> it). Player/coach/scout ratings keep seeding via `handle_new_role`.

---

## Part 3 — Frontend: what to keep vs remove

### Keep (the minimum to log in + see/adjust ratings)

| File | Why |
| --- | --- |
| `src/main.jsx`, `src/App.jsx` | App bootstrap + routing (trim the route list, see below) |
| `src/index.css` | Styles |
| `src/lib/supabase.js` | Database/auth connection |
| `src/hooks/useAuth.jsx` | Login + who-am-I + `isAdmin` |
| `src/hooks/useRankings.js` | Leaderboards backed by ratings — **must be edited**, see caveat |
| `src/hooks/useAdmin.js` | Rating ledger reads + `admin_adjust_rating` |
| `src/app-constants.jsx` | UI text (trim unused keys) |
| `src/components/Header.jsx`, `Footer.jsx`, `LoadingSpinner.jsx` | Layout (trim nav links) |
| `src/components/Sparkline.jsx` | Rating-history mini chart |
| `src/components/admin/AdminRatings.jsx` | Admin rating-adjust panel (optional but recommended) |
| `src/pages/Login.jsx`, `src/pages/DiscordCallback.jsx` | Auth flow |
| A leaderboard page — `src/pages/Players.jsx` and/or `Teams.jsx` | The rating display |
| `src/pages/AdminDashboard.jsx` | Optional, trimmed to just the ratings panel |

### Remove

| File(s) | Feature being removed |
| --- | --- |
| `src/pages/Directory.jsx` | Talent directory |
| `src/pages/ProfileView.jsx`, `ProfileEdit.jsx` | Profiles / onboarding |
| `src/pages/TeamManage.jsx` | Teams |
| `src/pages/News.jsx`, `Community.jsx` | News / community |
| `src/pages/Dashboard.jsx`, `Home.jsx` | Optional — or keep a trimmed landing |
| `src/hooks/useTeams.js`, `useScouting.js`, `useEndorsements.js`, `useNews.js`, `useProfiles.js` | Their features |
| `src/hooks/useReferenceData.js` | Only if you no longer show lane/rank/region |
| `src/hooks/useData.js` | Legacy JSON loader |
| `src/components/admin/AdminReference.jsx`, `AdminUsers.jsx` (optional), `NewsFeed.jsx`, `ConfirmDialog.jsx` (if unused) | Their features |

### ⚠️ Important caveat — `useRankings.js` depends on teams

`usePlayerRankings` joins `team_members`/`teams` (for the player's team name) and
`useTeamRankings` reads the whole `teams` table. **If you remove the teams
tables, you must edit `useRankings.js`:**

- In `usePlayerRankings`, delete the `memberships:team_members(team:teams(name))`
  part of the select and the `team:` field in the mapping.
- Either delete `useTeamRankings` entirely, or rewrite it to read team ids from
  the `ratings` table (`subject_type = 'team'`) instead of the `teams` table.

### Trim the routes in `src/App.jsx`

Keep only:
```jsx
<Route path="/" element={<Players />} />          {/* or your leaderboard */}
<Route path="/login" element={<Login />} />
<Route path="/auth/discord/callback" element={<DiscordCallback />} />
<Route path="/admin" element={<AdminDashboard />} />   {/* optional */}
```
Delete the lazy `import(...)` lines and `<Route>`s for every page you removed,
and remove the matching nav links in `Header.jsx`.

---

## Part 4 — Suggested removal order (safe)

1. **Branch first:** `git checkout -b ratings-only`.
2. **Frontend routes/nav:** trim `App.jsx` and `Header.jsx` so nothing links to
   pages you're about to delete (prevents broken imports).
3. **Delete frontend pages/hooks/components** from the "Remove" lists.
4. **Fix `useRankings.js`** per the caveat above.
5. **Run `npm run lint` and `npm run dev`** — fix any leftover imports until it
   builds and the leaderboard loads.
6. **Backend:** on a fresh DB, just run `0001`–`0006`; on an existing DB, drop the
   `0007`–`0011` tables with `cascade`.
7. **Trim `app-constants.jsx`** to drop now-unused text (cosmetic, last).

> Do frontend before backend so you can confirm the UI still builds against the
> live database before you change the schema.

---

## Part 5 — Suggestions to improve the rating system

The current engine is a clean, ledger-backed Elo with a fixed K-factor of 32.
Ideas to make it more accurate and robust, roughly in priority order:

1. **Dynamic K-factor (provisional ratings).** New subjects should move faster.
   Use a higher K (e.g. 40) while `games_count` is low and step it down (32 →
   24 → 16) as they play more. The `ratings.games_count` column already exists —
   read it inside `apply_elo_match`.

2. **Idempotent match application.** Add a `unique` constraint or guard so the
   same match (`source_id`) can't be applied twice and double-count. Today a
   repeated call would apply the delta again.

3. **Rating uncertainty (consider Glicko-2).** Plain Elo has no notion of
   confidence or inactivity. Glicko-2 adds a rating *deviation* that widens when a
   subject is inactive and tightens with play — fairer matchmaking and
   leaderboards. Bigger change, but the ledger design supports migrating to it.

4. **Inactivity decay / rating floor.** Optionally nudge long-inactive ratings
   toward the mean (or apply a soft decay), and set a floor so no one drops below,
   say, 800. Drive it off `ratings.last_event_at`.

5. **Margin-of-victory / series weighting.** Scale the Elo delta by score
   difference or best-of length (a 3–0 sweep should move ratings more than a 3–2).
   Add an optional multiplier parameter to `apply_elo_match`.

6. **Seasons.** Snapshot `ratings` at season end into a `rating_seasons` table,
   then soft-reset live ratings toward 1200 (e.g. `new = 1200 + (old-1200)*0.5`).
   Gives fresh competition without losing history.

7. **Endorsement abuse controls.** `apply_endorsement` clamps each call to 1–25
   but there's no per-pair limit. Add: one endorsement per endorser→subject per
   period, diminishing returns, and weight by the *endorser's* own standing so
   low-rated accounts can't farm points.

8. **Tiered achievements table.** Replace the free-form `p_delta` in
   `apply_achievement` with a lookup table of named achievements → fixed deltas,
   so awards are consistent and auditable.

9. **Integrity check / replay.** Add a function that recomputes a subject's rating
   by replaying its `rating_events` and flags any mismatch with `ratings.rating`.
   Cheap tamper/Drift detection on top of the existing ledger.

10. **Cached leaderboards + percentiles.** For scale, back leaderboards with a
    materialized view (refreshed on rating change) and show each subject's
    percentile / displayed tier band derived from their numeric rating.

11. **Draw & forfeit handling.** `apply_elo_match` already accepts `0.5` for
    draws; add an explicit forfeit path (e.g. apply a fixed penalty rather than a
    full Elo exchange) and record the reason in the ledger `note`.

---

## Where to read more

- The rating SQL: `supabase/migrations/0001_core.sql` (tables) and
  `0002_functions.sql` (engine).
- How the app reads ratings: `src/hooks/useRankings.js`, `src/hooks/useAdmin.js`.
- The overall picture: [`CODE_WALKTHROUGH.md`](CODE_WALKTHROUGH.md) →
  "The Rating System".
