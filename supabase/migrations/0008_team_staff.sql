-- ============================================================================
-- Team staff: coaches / scouts / analysts attached to a team, kept separate
-- from the playing roster (team_members). Same owner-writes model as the rest:
-- public read, only the team's manager (or the staffer themselves) may change.
-- ============================================================================

create type team_staff_role as enum ('coach', 'scout', 'analyst');

create table team_staff (
  team_id  uuid not null references teams(id) on delete cascade,
  user_id  uuid not null references profiles(id) on delete cascade,
  role     team_staff_role not null,
  added_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create index team_staff_user_idx on team_staff (user_id);

alter table team_staff enable row level security;

create policy "read team_staff"   on team_staff for select using (true);
create policy "insert team_staff"  on team_staff for insert with check (public.is_team_manager(team_id));
create policy "update team_staff"  on team_staff for update using (public.is_team_manager(team_id)) with check (public.is_team_manager(team_id));
create policy "delete team_staff"  on team_staff for delete using (public.is_team_manager(team_id) or user_id = auth.uid());

grant select on team_staff to anon, authenticated;
grant insert, update, delete on team_staff to authenticated;
