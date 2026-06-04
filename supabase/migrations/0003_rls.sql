-- ============================================================================
-- Row-Level Security
--   * Reference + public data: world-readable.
--   * Profiles / roles / role-profiles: readable by all, writable only by the
--     owner (auth.uid()).
--   * ratings / rating_events: readable by all, NO client writes — only the
--     SECURITY DEFINER functions in 0002 may mutate them.
-- ============================================================================

alter table regions                      enable row level security;
alter table lanes                        enable row level security;
alter table ranks                        enable row level security;
alter table heroes                       enable row level security;
alter table profiles                     enable row level security;
alter table user_roles                   enable row level security;
alter table player_profiles              enable row level security;
alter table coach_profiles               enable row level security;
alter table scout_profiles               enable row level security;
alter table tournament_manager_profiles  enable row level security;
alter table team_manager_profiles        enable row level security;
alter table ratings                      enable row level security;
alter table rating_events                enable row level security;

-- ---- Public read on reference + public data ------------------------------
create policy "read regions"       on regions       for select using (true);
create policy "read lanes"         on lanes         for select using (true);
create policy "read ranks"         on ranks         for select using (true);
create policy "read heroes"        on heroes        for select using (true);
create policy "read profiles"      on profiles      for select using (true);
create policy "read user_roles"    on user_roles    for select using (true);
create policy "read ratings"       on ratings       for select using (true);
create policy "read rating_events" on rating_events for select using (true);

-- ---- profiles: owner can insert/update own row ---------------------------
create policy "insert own profile" on profiles
  for insert with check (auth.uid() = id);
create policy "update own profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---- user_roles: owner manages their own roles ---------------------------
create policy "insert own role" on user_roles
  for insert with check (auth.uid() = user_id);
create policy "delete own role" on user_roles
  for delete using (auth.uid() = user_id);

-- ---- Role profiles: public read; owner writes ----------------------------
-- player_profiles
create policy "read player_profiles"   on player_profiles for select using (true);
create policy "insert own player_prof" on player_profiles for insert with check (auth.uid() = user_id);
create policy "update own player_prof" on player_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own player_prof" on player_profiles for delete using (auth.uid() = user_id);

-- coach_profiles
create policy "read coach_profiles"    on coach_profiles for select using (true);
create policy "insert own coach_prof"  on coach_profiles for insert with check (auth.uid() = user_id);
create policy "update own coach_prof"  on coach_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own coach_prof"  on coach_profiles for delete using (auth.uid() = user_id);

-- scout_profiles
create policy "read scout_profiles"    on scout_profiles for select using (true);
create policy "insert own scout_prof"  on scout_profiles for insert with check (auth.uid() = user_id);
create policy "update own scout_prof"  on scout_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own scout_prof"  on scout_profiles for delete using (auth.uid() = user_id);

-- tournament_manager_profiles
create policy "read tm_profiles"   on tournament_manager_profiles for select using (true);
create policy "insert own tm_prof" on tournament_manager_profiles for insert with check (auth.uid() = user_id);
create policy "update own tm_prof" on tournament_manager_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own tm_prof" on tournament_manager_profiles for delete using (auth.uid() = user_id);

-- team_manager_profiles
create policy "read mgr_profiles"   on team_manager_profiles for select using (true);
create policy "insert own mgr_prof" on team_manager_profiles for insert with check (auth.uid() = user_id);
create policy "update own mgr_prof" on team_manager_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own mgr_prof" on team_manager_profiles for delete using (auth.uid() = user_id);

-- Note: no INSERT/UPDATE/DELETE policies on ratings or rating_events, so all
-- direct client writes are denied. The rating functions run as SECURITY
-- DEFINER and bypass RLS.
