-- ============================================================================
-- RTR Honor of Kings platform — core schema (MVP: identity, roles, ratings)
-- ============================================================================

-- ---- Enum types ----------------------------------------------------------
create type user_role as enum (
  'player', 'coach', 'scout', 'tournament_manager', 'team_manager'
);

-- Subjects that can carry a rating. Superset of user_role (adds 'team').
create type subject_type as enum (
  'player', 'team', 'coach', 'scout', 'tournament_manager', 'team_manager'
);

create type rating_reason as enum (
  'initial', 'match_result', 'endorsement', 'achievement', 'admin_adjustment'
);

-- ---- Reference tables (seeded; editable, not hardcoded in the app) --------
create table regions (
  id   bigint generated always as identity primary key,
  code text unique not null,
  name text not null,
  sort int not null default 0
);

create table lanes (
  id   bigint generated always as identity primary key,
  name text unique not null,
  sort int not null default 0
);

create table ranks (
  id         bigint generated always as identity primary key,
  name       text unique not null,
  tier_order int not null
);

create table heroes (
  id        bigint generated always as identity primary key,
  name      text unique not null,
  lane_id   bigint references lanes(id),
  image_url text
);

-- ---- Identity ------------------------------------------------------------
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  discord_id   text,
  handle       text,
  display_name text,
  avatar_url   text,
  email        text,
  bio          text,
  country_iso  text,
  region_id    bigint references regions(id),
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table user_roles (
  user_id    uuid not null references profiles(id) on delete cascade,
  role       user_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- ---- Role-specific profiles (HoK details live here) ----------------------
create table player_profiles (
  user_id          uuid primary key references profiles(id) on delete cascade,
  lane_id          bigint references lanes(id),
  rank_id          bigint references ranks(id),
  hero_pool        jsonb not null default '[]'::jsonb,
  server           text,
  looking_for_team boolean not null default false,
  availability     text,
  updated_at       timestamptz not null default now()
);

create table coach_profiles (
  user_id          uuid primary key references profiles(id) on delete cascade,
  specialties      text,
  experience_years int,
  availability     text,
  updated_at       timestamptz not null default now()
);

create table scout_profiles (
  user_id    uuid primary key references profiles(id) on delete cascade,
  org        text,
  regions    text,
  updated_at timestamptz not null default now()
);

create table tournament_manager_profiles (
  user_id    uuid primary key references profiles(id) on delete cascade,
  org        text,
  updated_at timestamptz not null default now()
);

create table team_manager_profiles (
  user_id    uuid primary key references profiles(id) on delete cascade,
  updated_at timestamptz not null default now()
);

-- ---- Ratings (single unified Elo scale across all subjects) --------------
create table ratings (
  subject_type  subject_type not null,
  subject_id    uuid not null,
  rating        int not null default 1200,
  games_count   int not null default 0,
  last_event_at timestamptz,
  primary key (subject_type, subject_id)
);

-- Append-only ledger: rating history + leaderboards derive from this.
create table rating_events (
  id           bigint generated always as identity primary key,
  subject_type subject_type not null,
  subject_id   uuid not null,
  delta        int not null,
  new_rating   int not null,
  reason       rating_reason not null,
  source_id    uuid,
  note         text,
  created_by   uuid references profiles(id),
  created_at   timestamptz not null default now()
);

-- ---- Indexes -------------------------------------------------------------
create index rating_events_subject_idx
  on rating_events (subject_type, subject_id, created_at desc);
create index user_roles_role_idx on user_roles (role);
create index player_profiles_lane_idx on player_profiles (lane_id);
create index player_profiles_rank_idx on player_profiles (rank_id);
create index profiles_region_idx on profiles (region_id);
