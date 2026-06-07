-- ============================================================================
-- RESET — remove all DUMMY / demo content while leaving SUPER USERS untouched.
--
--  Removes: every fake (@test.dev) user and everything that cascades from them
--           (profiles, roles, role-profiles, team_members, team_staff,
--           applications, and any teams they managed), plus any leftover team
--           not owned by a super user, plus orphaned rating-ledger rows.
--  Keeps:   reference data, your real Discord accounts, and — fully intact —
--           any super user's profile, roles, role-profiles, ratings and teams.
--
--  After this, run seed_demo.sql for fresh demo data (it doesn't touch you).
-- ============================================================================

-- 1. Delete all fake seed users. Their profiles cascade-delete, which in turn
--    cascades their roles, role-profiles, team memberships, staff rows,
--    applications, and any teams they manage. Super users (real Discord logins)
--    are never @test.dev, so they and everything they own are left alone.
delete from auth.users where email like '%@test.dev';

-- 2. Safety net: drop any team NOT owned by a super user (dummy teams are
--    already gone via cascade above; this catches anything else). Teams owned
--    by a super user are preserved.
delete from teams
where manager_id not in (select id from profiles where is_superuser);

-- 3. Prune the rating ledger for subjects that no longer exist. Ratings for
--    surviving subjects — i.e. super users and the teams they kept — remain.
delete from rating_events
where (subject_type =  'team' and subject_id not in (select id from teams))
   or (subject_type <> 'team' and subject_id not in (select id from profiles));

delete from ratings
where (subject_type =  'team' and subject_id not in (select id from teams))
   or (subject_type <> 'team' and subject_id not in (select id from profiles));
