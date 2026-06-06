# Read Me First — For Non-Developers

This page explains RTR in plain English: **what it is, what the pieces are, and
what's worth looking at** — no coding knowledge needed. If a word looks
technical, there's a "what that means" note next to it.

---

## What is RTR, in one sentence?

RTR is a **website for the Honor of Kings community** where players build a
profile, join teams, get scouted, and earn a **rating** (a single score, like a
chess Elo) that goes up or down based on results and recommendations.

---

## Think of it like a restaurant

A website like this has two halves. The restaurant analogy makes it easy:

| Part | Restaurant version | RTR version | What it does |
| --- | --- | --- | --- |
| **Front of house** | The dining room guests see | The **website pages** (in a folder called `src`) | Everything a visitor looks at and clicks |
| **Kitchen** | Where food is made & stored | The **database** (a service called **Supabase**) | Stores all the real information — profiles, teams, ratings — and decides who's allowed to see or change what |

> **What "database" means:** a secure place on the internet where all the
> information lives. It's not in this folder of files — it lives in an online
> service called **Supabase**. The files here are just the "dining room" that
> talks to it.

When someone uses the site, the dining room (pages) sends a request to the
kitchen (database), the kitchen checks the rules, and sends back the answer.

---

## How people get in: Discord login

There's **no username/password** to manage. People sign in with their **Discord**
account (the chat app gamers use). RTR trusts Discord to confirm who they are.
That's the only way in.

---

## What "the rating" is (the heart of the project)

Every player, team, coach, and scout has **one number** — their rating. The
important rule:

> **Nobody can edit their own rating.** Ratings only change through the system's
> own rules (match results, endorsements, achievements, or an admin adjustment).
> This is on purpose, so the scores can be trusted and can't be faked.

---

## The documents you'll see (and which to open)

This project comes with a few guide files. Here's which is which, so you know
where to go:

| File | Who it's for | Open it when… |
| --- | --- | --- |
| **NON-DEVELOPER-README.md** (this one) | You, the non-coder | You want the big picture in plain words |
| **DOCS-MAP.md** | Everyone | You're not sure which doc to open |
| **START HERE.md** | Whoever sets it up technically | You're handing the project to a developer to get it running |
| **README.md** | Developers | A developer wants the quick technical overview |
| **CODE_WALKTHROUGH.md** | Developers | A developer wants to understand how it's built |
| **supabase/README.md** | Developers | Setting up the "kitchen" (the database) |

👉 **If you just want it running, hand a developer the `START HERE.md` file.** It
has every technical step written out.

---

## What the folders are (a quick map)

You don't need to touch these, but here's what you're looking at if you peek:

- **`src`** — the website itself (the pages and buttons people see). "src" is
  short for *source*, meaning the source of the website.
- **`src/pages`** — each file here is one screen of the site (Home, Teams,
  Players, Profile, Admin, etc.).
- **`supabase`** — instructions for setting up the kitchen (database). Mostly used
  once, during setup.
- **`public`** — images and a few simple data files.
- **`node_modules`** — auto-generated helper code the site depends on. **Ignore
  it entirely** — it's not written by anyone here and is rebuilt automatically.

> **Rule of thumb:** if a folder or file name looks technical and you didn't
> create it, you can safely leave it alone. Changing files here without knowing
> what they do can break the site.

---

## How to navigate the code (in simple terms)

You don't need to *read* the code to *find your way around* it. Think of the
project like a filing cabinet: **folders are drawers, files are documents.**

### 1. How to open and look at the project

- Install a free editor called **VS Code** (<https://code.visualstudio.com>).
  Think of it as "Microsoft Word, but for project files."
- Open it, choose **File → Open Folder**, and pick the `RTR` folder.
- On the **left side** you'll see the list of folders and files — this is the
  **Explorer**. Click any arrow (▸) to open a folder, click a file to view it.
  Looking is completely safe; nothing changes unless you type and **save**.

### 2. How to read a file or folder name

Names are written to tell you what's inside. A few patterns:

- **Folders** are categories: `pages` (the screens), `components` (reusable
  building blocks), `hooks` (helpers that fetch information).
- **`.jsx` / `.js`** at the end just means "a website code file." You can ignore
  the ending and read the name — e.g. `Teams.jsx` is the **Teams** screen.
- **CAPITALS at the start** (like `Header.jsx`, `Footer.jsx`) are visual pieces of
  the page. The name says what it is.

### 3. How to find a specific screen

Every page of the website is one file in **`src/pages`**. The file name matches
the screen:

| If you want to look at… | Open this file |
| --- | --- |
| The welcome/landing page | `src/pages/Home.jsx` |
| The signed-in home | `src/pages/Dashboard.jsx` |
| The teams list | `src/pages/Teams.jsx` |
| The players list | `src/pages/Players.jsx` |
| A person's profile | `src/pages/ProfileView.jsx` |
| The login screen | `src/pages/Login.jsx` |
| The admin controls | `src/pages/AdminDashboard.jsx` |

So: *want to know what's on the Teams screen?* → open `src/pages` → click
`Teams.jsx`.

### 4. How the pieces connect (the simple version)

```
A visitor opens a web address  (e.g. /teams)
        │
        ▼
The "router" picks the matching screen   →  src/App.jsx decides this
        │
        ▼
The screen file shows the layout          →  e.g. src/pages/Teams.jsx
        │
        ▼
A "hook" fetches the real data            →  files in src/hooks
        │
        ▼
The data comes from the database (Supabase)
```

- **`src/App.jsx`** is the **table of contents** — it lists every web address
  (`/teams`, `/players`, `/profile`, …) and which screen each one shows. If you
  ever wonder "what pages exist?", this one file answers it.
- **`src/hooks`** are the **waiters** — small files whose only job is to go fetch
  information from the kitchen (database) and bring it to a screen.

### 5. How to search instead of hunting

You rarely need to dig folder by folder. In VS Code press **Ctrl+Shift+F**
(Windows) or **Cmd+Shift+F** (Mac) to **search the whole project for words**.
Type a phrase you see on the website (for example a heading) and it jumps you to
the file that contains it. This is the fastest way to find "where does this text
come from?"

### 6. A safe 5-minute tour

Try this, just to get comfortable (you won't break anything by looking):

1. Open `src/App.jsx` → skim the list of addresses to see every page that exists.
2. Open `src/pages/Home.jsx` → that's the first screen visitors see.
3. Open `src/app-constants.jsx` → this is where the **words** on the site live.
4. Use **Ctrl/Cmd+Shift+F** and search for a word you saw on the live site.

---

## Understanding what's built right now (the current state)

A project like this is built in stages. Here's where RTR is **today**, in plain
terms — what already works, and what's planned but not built yet. This helps you
know what you can actually click on versus what's still a future idea.

### ✅ What already works

- **Sign in with Discord** — people log in with their Discord account.
- **Profiles & onboarding** — after first login, a person sets up their profile
  and picks their role(s): player, coach, scout, team manager, or tournament
  manager. *(Screen: `ProfileEdit.jsx`; viewing one: `ProfileView.jsx`.)*
- **A personal dashboard** — signed-in users get a home screen summarising their
  stuff. *(Screen: `Dashboard.jsx`.)*
- **The talent directory** — browse everyone with a profile and filter by role,
  lane, rank, region, or name. This is the "find people" feature.
  *(Screen: `Directory.jsx`.)*
- **Teams & rosters** — managers can create a team, build a roster, add staff
  (coach/scout), and players can **apply to teams** or be **invited**; the manager
  accepts or declines. *(Screen: `TeamManage.jsx`.)*
- **Scouting & endorsements** — scouts can register interest in players, and
  people can endorse each other (which feeds into ratings).
- **Leaderboards / rankings** — teams and players ranked by their rating.
  *(Screens: `Teams.jsx`, `Players.jsx`.)*
- **News** — a simple updates feed. *(Screen: `News.jsx`.)*
- **Admin controls** — trusted admins get a dashboard to manage users, reference
  data, and rating adjustments. *(Screen: `AdminDashboard.jsx`.)*
- **The rating engine** — the behind-the-scenes scoring that all of the above
  feeds into, kept tamper-proof in the database.

### 🚧 Planned but not built yet

- **Running actual tournaments** (creating brackets, recording match results that
  automatically move ratings). The *role* "tournament manager" exists, but the
  tournament-hosting screens themselves are a future stage.

> The honest summary: **the "who's who" and "team building" parts are working
> today; the "run a live tournament" part is the next big piece to build.**

### How to confirm this for yourself

The clearest proof of what exists is the **table of contents file**,
`src/App.jsx`. Every screen listed there is a real, built page. If something
isn't listed there, it isn't part of the site yet. (See the "How the pieces
connect" section above for how to read it.)

---

## What YOU can look at and understand

If you want to get a feel for the product without any code:

1. **Get it running** (or ask a developer to), then just **click around the live
   site** — that's the real thing, and it's the best way to understand it.
2. **The wording on the site** (headings, button labels) all lives in **one
   file** so it's easy to change without breaking anything:
   `src/app-constants.jsx`. If you ever want to tweak the text the site shows,
   that's the place — ideally with a developer's help the first time.

---

## What you should NOT do

- Don't edit files inside **`node_modules`** (it's machine-generated).
- Don't put **passwords or secret keys** into any file that gets saved to the
  shared project — secrets live in the Supabase service, not in these files.
- Don't change the **rating rules** or **database files** without a developer —
  those are the trustworthy core of the platform.

---

## Quick glossary

- **Repository / repo** — this whole folder of project files.
- **Frontend** — the part people see and click (the "dining room").
- **Backend / database** — where information is stored and protected (the
  "kitchen"); here it's **Supabase**.
- **Supabase** — the online service that stores the data and handles login.
- **Discord login** — signing in using a Discord account instead of a password.
- **Rating / Elo** — the single score each player or team carries.
- **Admin / Superuser** — a trusted person with extra controls (managing data,
  adjusting ratings).
- **`.env` file** — a small settings file holding the keys that connect the
  website to its database. It's kept private, not shared.

---

**The short version:** RTR is a Honor of Kings community site (dining room) backed
by a secure online database (kitchen), where people log in with Discord and carry
a trustworthy rating. To see it for real, have someone follow **START HERE.md**,
then click around.
