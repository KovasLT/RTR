-- ============================================================================
-- DEMO SEED — clean, real-named demo data. Run AFTER reset.sql (and after
-- 0001–0008 + seed.sql). This is the single source of demo content: it replaces
-- the old seed_dummy.sql + seed_rosters.sql (whose overlap caused duplicates).
--
--  Creates 4 fully-staffed teams, each with:
--    * a team manager (owner),
--    * 5 players (one per lane, first is captain), ratings varied,
--    * 1 coach + 1 scout in team_staff,
--  plus 3 free-agent players (looking for a team) for the directory.
--
--  All are fake auth.users (no password, cannot log in). Deterministic UUIDs +
--  `on conflict do nothing` make it safe to re-run. NONE are admin/super user.
-- ============================================================================

-- Session-temp helper to insert a fake auth user (the on-signup trigger then
-- creates the matching profile). Auto-dropped at end of session.
create or replace function pg_temp.demo_user(p_id uuid, p_email text, p_name text)
returns void language plpgsql as $fn$
begin
  insert into auth.users
    (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, email_confirmed_at)
  values
    (p_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email,
     '{"provider":"email","providers":["email"]}',
     jsonb_build_object('user_name', p_name, 'full_name', p_name),
     now(), now(), now())
  on conflict (id) do nothing;
end;
$fn$;

do $$
declare
  names text[] := array[
    'Liam Carter','Noah Bennett','Ethan Brooks','Lucas Hayes','Mason Reed','Oliver Price',
    'James Foster','Henry Ward','Leo Sullivan','Jack Morgan','Daniel Cole','Owen Hughes',
    'Gabriel Ross','Nathan Perry','Adrian Gray','Caleb Hunt','Dylan Shaw','Aaron Webb',
    'Isaac Dean','Julian Fox','Marcus Bell','Victor Lane','Felix Stone','Hugo Marsh',
    'Theo Park','Elias Wood','Aiden Cross','Ryan Frost','Simon Vale','Oscar King',
    'Diego Marin','Andre Silva','Kenji Tanaka','Mateo Rossi','Sven Larsson','Omar Haddad',
    'Yusuf Demir','Arjun Mehta','Ravi Kapoor','Chen Wei'
  ];
  team_names   text[] := array['Aurora Esports','Vortex Gaming','Eclipse Squad','Nova Esports'];
  team_tags    text[] := array['AUR','VTX','ECL','NOVA'];
  team_regions text[] := array['WEU','EEU','NA','SEA'];
  team_states  text[] := array['active','recruiting','active','recruiting'];
  lane_ids  bigint[];
  rank_ids  bigint[];
  ti int; i int; pc int := 0;
  uid uuid; tid uuid; v_region bigint;
begin
  select array_agg(id order by sort)       into lane_ids from lanes;
  select array_agg(id order by tier_order) into rank_ids from ranks;

  for ti in 1..array_length(team_names, 1) loop
    select id into v_region from regions where code = team_regions[ti];
    tid := md5('demo-team-' || ti)::uuid;

    -- ---- Team manager (owner) ---------------------------------------------
    pc := pc + 1; uid := md5('demo-user-' || pc)::uuid;
    perform pg_temp.demo_user(uid, 'demo' || pc || '@test.dev', names[pc]);
    update profiles set country_iso = 'SE', region_id = v_region where id = uid;
    insert into user_roles (user_id, role) values (uid, 'team_manager') on conflict do nothing;
    insert into team_manager_profiles (user_id) values (uid) on conflict (user_id) do nothing;

    -- ---- Team -------------------------------------------------------------
    insert into teams (id, name, tag, region_id, manager_id, status, recruitment_note)
    values (tid, team_names[ti], team_tags[ti], v_region, uid, team_states[ti]::team_status,
            'Recruiting dedicated, motivated players.')
    on conflict (id) do nothing;
    if (select rating from ratings where subject_type = 'team' and subject_id = tid) = 1200 then
      perform apply_rating_delta('team', tid, (ti * 37) % 150, 'achievement', null, 'Seed');
    end if;

    -- ---- 5 players (one per lane) -----------------------------------------
    for i in 1..5 loop
      pc := pc + 1; uid := md5('demo-user-' || pc)::uuid;
      perform pg_temp.demo_user(uid, 'demo' || pc || '@test.dev', names[pc]);
      update profiles set country_iso = 'GB', region_id = v_region where id = uid;
      insert into user_roles (user_id, role) values (uid, 'player') on conflict do nothing;
      insert into player_profiles (user_id, lane_id, rank_id, server, looking_for_team)
      values (uid, lane_ids[i], rank_ids[1 + (pc % array_length(rank_ids, 1))], 'EU', false)
      on conflict (user_id) do nothing;
      insert into team_members (team_id, user_id, lane_id, is_captain)
      values (tid, uid, lane_ids[i], (i = 1)) on conflict do nothing;
      if (select rating from ratings where subject_type = 'player' and subject_id = uid) = 1200 then
        perform apply_rating_delta('player', uid, (pc * 23) % 260, 'achievement', null, 'Seed');
      end if;
    end loop;

    -- ---- Coach ------------------------------------------------------------
    pc := pc + 1; uid := md5('demo-user-' || pc)::uuid;
    perform pg_temp.demo_user(uid, 'demo' || pc || '@test.dev', names[pc]);
    update profiles set country_iso = 'US', region_id = v_region where id = uid;
    insert into user_roles (user_id, role) values (uid, 'coach') on conflict do nothing;
    insert into coach_profiles (user_id, specialties, experience_years)
      values (uid, 'Macro, drafting, VOD review', 4 + ti) on conflict (user_id) do nothing;
    insert into team_staff (team_id, user_id, role) values (tid, uid, 'coach') on conflict do nothing;

    -- ---- Scout ------------------------------------------------------------
    pc := pc + 1; uid := md5('demo-user-' || pc)::uuid;
    perform pg_temp.demo_user(uid, 'demo' || pc || '@test.dev', names[pc]);
    update profiles set country_iso = 'AE', region_id = v_region where id = uid;
    insert into user_roles (user_id, role) values (uid, 'scout') on conflict do nothing;
    insert into scout_profiles (user_id, org, regions)
      values (uid, 'Talent Watch', 'WEU, EEU') on conflict (user_id) do nothing;
    insert into team_staff (team_id, user_id, role) values (tid, uid, 'scout') on conflict do nothing;
  end loop;

  -- ---- 3 free-agent players (looking for a team) --------------------------
  for i in 1..3 loop
    pc := pc + 1; uid := md5('demo-user-' || pc)::uuid;
    perform pg_temp.demo_user(uid, 'demo' || pc || '@test.dev', names[pc]);
    update profiles set country_iso = 'PL', region_id = (select id from regions where code = 'EEU') where id = uid;
    insert into user_roles (user_id, role) values (uid, 'player') on conflict do nothing;
    insert into player_profiles (user_id, lane_id, rank_id, server, looking_for_team)
    values (uid, lane_ids[1 + (i % array_length(lane_ids, 1))], rank_ids[1 + (pc % array_length(rank_ids, 1))], 'EEU', true)
    on conflict (user_id) do nothing;
    if (select rating from ratings where subject_type = 'player' and subject_id = uid) = 1200 then
      perform apply_rating_delta('player', uid, (pc * 23) % 260, 'achievement', null, 'Seed');
    end if;
  end loop;

  raise notice 'Seeded % people across % teams (+3 free agents).', pc, array_length(team_names, 1);
end $$;
