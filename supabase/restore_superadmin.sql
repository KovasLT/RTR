-- ============================================================================
-- RESTORE SUPER ADMIN — re-create the super user's "one of everything" test
-- setup (all roles + role-profile rows + a personal team). Use this only if a
-- previous reset wiped it; the current reset.sql leaves super users untouched.
--
-- Scoped to the first super user (where is_superuser). Idempotent — safe to
-- re-run; existing rows are left as-is.
-- ============================================================================

-- All five roles (each insert seeds that subject's rating via the trigger).
insert into user_roles (user_id, role)
select p.id, r.role
from (select id from profiles where is_superuser order by created_at limit 1) p
cross join (values
  ('player'::user_role), ('coach'), ('scout'), ('team_manager'), ('tournament_manager')
) r(role)
on conflict do nothing;

-- Role detail rows.
insert into player_profiles (user_id, lane_id, rank_id, server, looking_for_team)
select p.id, (select id from lanes where name = 'Clash Lane'),
       (select id from ranks where name = 'Grandmaster'), 'EU', false
from (select id from profiles where is_superuser order by created_at limit 1) p
on conflict (user_id) do nothing;

insert into coach_profiles (user_id, specialties, experience_years)
select p.id, 'Full-roster coaching', 8
from (select id from profiles where is_superuser order by created_at limit 1) p
on conflict (user_id) do nothing;

insert into scout_profiles (user_id, org, regions)
select p.id, 'RTR Internal', 'GLOBAL'
from (select id from profiles where is_superuser order by created_at limit 1) p
on conflict (user_id) do nothing;

insert into tournament_manager_profiles (user_id, org)
select p.id, 'RTR Events'
from (select id from profiles where is_superuser order by created_at limit 1) p
on conflict (user_id) do nothing;

insert into team_manager_profiles (user_id)
select p.id
from (select id from profiles where is_superuser order by created_at limit 1) p
on conflict (user_id) do nothing;

-- A personal team (fixed id, idempotent). The team trigger seeds its rating.
insert into teams (id, name, tag, region_id, manager_id, status, recruitment_note)
select 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Titans', 'TT',
       (select id from regions where code = 'WEU'), p.id, 'recruiting',
       'Test team — looking for a mid laner.'
from (select id from profiles where is_superuser order by created_at limit 1) p
on conflict (id) do nothing;
