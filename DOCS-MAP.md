# Docs Map — What to Look for Where

This project has several guide files. This page is the **map**: it tells you which
one to open depending on who you are and what you're trying to do, so you never
have to guess.

---

## Start by picking who you are

| You are… | Open this first | Then maybe… |
| --- | --- | --- |
| **Not a coder**, want the big picture | [`NON-DEVELOPER-README.md`](NON-DEVELOPER-README.md) | This map |
| **Taking over the project** / need it running | [`START HERE.md`](START HERE.md) | `supabase/README.md` |
| **A developer**, new to the code | [`README.md`](README.md) → [`CODE_WALKTHROUGH.md`](CODE_WALKTHROUGH.md) | `CLAUDE.md` |
| **Setting up the database/backend** | [`supabase/README.md`](supabase/README.md) | `START HERE.md` |

---

## Every document at a glance

| File | Audience | What's inside | Open it when… |
| --- | --- | --- | --- |
| **[NON-DEVELOPER-README.md](NON-DEVELOPER-README.md)** | Non-coders | Plain-English explanation of the project, how to navigate the files, and what's built today | You want to understand RTR without any technical background |
| **[START HERE.md](START%20HERE.md)** | Whoever sets it up | Full handover + step-by-step local setup (Supabase, Discord login, database, running it), troubleshooting, checklist | You're getting the project running on a machine for the first time |
| **[README.md](README.md)** | Developers | Quick technical overview, tech stack, quick-start commands, project structure, how ratings work | A developer wants the fast technical summary |
| **[CODE_WALKTHROUGH.md](CODE_WALKTHROUGH.md)** | Developers | How the code is organised: architecture, routing, auth, data layer, backend, common flows | A developer needs to understand or change how it's built |
| **[supabase/README.md](supabase/README.md)** | Developers | Backend setup: creating the Supabase project, Discord auth, applying the database schema | Setting up or fixing the database (the "backend") |
| **[CLAUDE.md](CLAUDE.md)** | Developers / AI tools | The project's rules and conventions (e.g. all text in one file, no hardcoded data) | Writing code and want to follow house style |
| **[DOCS-MAP.md](DOCS-MAP.md)** (this file) | Everyone | The index of all the docs | You're not sure which doc to read |

---

## "I want to…" → go here

| I want to… | Read this |
| --- | --- |
| Understand what RTR even is, simply | `NON-DEVELOPER-README.md` |
| Get the app running on my computer | `START HERE.md` |
| Set up the database / Discord login | `supabase/README.md` (full steps also in `START HERE.md`) |
| See what features already exist | `NON-DEVELOPER-README.md` → "What's built right now"; or `src/App.jsx` |
| Learn how the code is structured | `CODE_WALKTHROUGH.md` |
| Find which file is a given screen | `NON-DEVELOPER-README.md` → "How to navigate the code" |
| Change the wording shown on the site | Edit `src/app-constants.jsx` (background in `CODE_WALKTHROUGH.md`) |
| Make myself an admin | `START HERE.md` → "Make yourself an admin / superuser" |
| Add demo/test data | `START HERE.md` → "Demo data" |
| Fix a setup problem (login fails, no data, errors) | `START HERE.md` → "Troubleshooting" |
| Follow the project's coding conventions | `CLAUDE.md` |

---

## Where things live (the project itself, not docs)

| If you're looking for… | It's here |
| --- | --- |
| The website screens (pages) | `src/pages/` |
| Reusable building blocks (header, footer, dialogs) | `src/components/` |
| The list of all pages / web addresses | `src/App.jsx` |
| The "waiters" that fetch data | `src/hooks/` |
| All the text shown on the site | `src/app-constants.jsx` |
| The database setup (schema, security, seed data) | `supabase/` |
| Images and a few static files | `public/` |
| Auto-generated helper code (ignore it) | `node_modules/` |

---

## Suggested reading order

1. **[NON-DEVELOPER-README.md](NON-DEVELOPER-README.md)** — the big picture in plain words.
2. **[DOCS-MAP.md](DOCS-MAP.md)** — this file, so you know what else exists.
3. **[START HERE.md](START%20HERE.md)** — get it running (or hand it to a developer).
4. **[README.md](README.md)** + **[CODE_WALKTHROUGH.md](CODE_WALKTHROUGH.md)** — for developers going deeper.
5. **[supabase/README.md](supabase/README.md)** + **[CLAUDE.md](CLAUDE.md)** — backend setup and coding conventions.
