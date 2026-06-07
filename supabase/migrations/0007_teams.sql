-- ============================================================================
-- Phase 2 (slice 1): Teams, rosters & applications.
--   * Teams carry a 'team' Elo (subject_type already includes 'team'). Because
--     ratings.subject_id is uuid, teams.id is uuid too.
--   * Owner-writes RLS (manager_id = auth.uid()), mirroring profiles/role rows.
--   * The two-sided application flow (accept inserts a roster row the applicant
--     can't write) runs through SECURITY DEFINER RPCs, like the rating engine.
-- ============================================================================

-- ---- Enums ---------------------------------------------------------------
create type team_status        as enum ('recruiting', 'active', 'inactive');
create type application_type   as enum ('apply', 'invite');
create type application_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');

-- ---- Tables --------------------------------------------------------------
create table teams (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  tag              text,
  logo_url         text,
  region_id        bigint references regions(id),
  manager_id       uuid not null references profiles(id) on delete cascade,
  status           team_status not null default 'recruiting',
  recruitment_note text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table team_members (
  team_id    uuid not null references teams(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  lane_id    bigint references lanes(id),
  is_captain boolean not null default false,
  joined_at  timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table applications (
  id           bigint generated always as identity primary key,
  team_id      uuid not null references teams(id) on delete cascade,
  applicant_id uuid not null references profiles(id) on delete cascade,
  type         application_type not null,
  status       application_status not null default 'pending',
  message      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- At most one open (pending) application per (team, applicant).
create unique index applications_one_open
  on applications (team_id, applicant_id) where status = 'pending';

create index teams_manager_idx        on teams (manager_id);
create index team_members_user_idx    on team_members (user_id);
create index applications_team_idx    on applications (team_id, status);
create index applications_applicant_idx on applications (applicant_id, status);

-- ---- Team rating bootstrap (mirrors handle_new_role in 0002) --------------
create or replace function public.handle_new_team()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare v_rating int;
begin
  perform ensure_rating('team', new.id);
  select rating into v_rating
  from ratings where subject_type = 'team' and subject_id = new.id;

  if not exists (
    select 1 from rating_events where subject_type = 'team' and subject_id = new.id
  ) then
    insert into rating_events (subject_type, subject_id, delta, new_rating, reason)
    values ('team', new.id, 0, v_rating, 'initial');
  end if;

  return new;
end;
$$;

create trigger on_team_created
  after insert on teams
  for each row execute function public.handle_new_team();

-- ---- Helper: does the current user manage this team? ----------------------
create or replace function public.is_team_manager(p_team_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.teams where id = p_team_id and manager_id = auth.uid()
  );
$$;

grant execute on function public.is_team_manager(uuid) to anon, authenticated;

-- ---- RLS -----------------------------------------------------------------
alter table teams        enable row level security;
alter table team_members enable row level security;
alter table applications enable row level security;

-- teams: public read; owner (manager) writes
create policy "read teams"   on teams for select using (true);
create policy "insert team"  on teams for insert with check (auth.uid() = manager_id);
create policy "update team"  on teams for update using (auth.uid() = manager_id) with check (auth.uid() = manager_id);
create policy "delete team"  on teams for delete using (auth.uid() = manager_id);

-- team_members: public read (rosters are public); manager writes; member may leave
create policy "read team_members"   on team_members for select using (true);
create policy "insert team_member"  on team_members for insert with check (public.is_team_manager(team_id));
create policy "update team_member"  on team_members for update using (public.is_team_manager(team_id)) with check (public.is_team_manager(team_id));
create policy "delete team_member"  on team_members for delete using (public.is_team_manager(team_id) or user_id = auth.uid());

-- applications: visible to applicant + team manager; insert by the initiating
-- party. Status changes (accept/reject/withdraw) go through the RPCs below, so
-- there are deliberately no UPDATE/DELETE policies.
create policy "read applications" on applications
  for select using (applicant_id = auth.uid() or public.is_team_manager(team_id));
create policy "insert application" on applications
  for insert with check (
    (type = 'apply'  and applicant_id = auth.uid())
    or (type = 'invite' and public.is_team_manager(team_id))
  );

-- ---- SECURITY DEFINER RPCs for the application lifecycle ------------------
-- Accept/reject: manager handles 'apply', invited player handles 'invite'.
create or replace function public.respond_to_application(p_app_id bigint, p_accept boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare a applications%rowtype;
begin
  select * into a from applications where id = p_app_id;
  if a.id is null then raise exception 'application not found'; end if;
  if a.status <> 'pending' then raise exception 'application is not pending'; end if;

  if a.type = 'apply' then
    if not public.is_team_manager(a.team_id) then raise exception 'not authorized'; end if;
  else -- invite: only the invited player may respond
    if a.applicant_id <> auth.uid() then raise exception 'not authorized'; end if;
  end if;

  if p_accept then
    insert into team_members (team_id, user_id)
    values (a.team_id, a.applicant_id)
    on conflict (team_id, user_id) do nothing;
    update applications set status = 'accepted', updated_at = now() where id = p_app_id;
  else
    update applications set status = 'rejected', updated_at = now() where id = p_app_id;
  end if;
end;
$$;

grant execute on function public.respond_to_application(bigint, boolean) to authenticated;

-- Applicant cancels their own pending application.
create or replace function public.withdraw_application(p_app_id bigint)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update applications
     set status = 'withdrawn', updated_at = now()
   where id = p_app_id and applicant_id = auth.uid() and status = 'pending';
  if not found then raise exception 'not authorized or not pending'; end if;
end;
$$;

grant execute on function public.withdraw_application(bigint) to authenticated;

-- Remove a roster member: the team's manager, or the member leaving themselves.
create or replace function public.remove_team_member(p_team_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not (public.is_team_manager(p_team_id) or p_user_id = auth.uid()) then
    raise exception 'not authorized';
  end if;
  delete from team_members where team_id = p_team_id and user_id = p_user_id;
end;
$$;

grant execute on function public.remove_team_member(uuid, uuid) to authenticated;

-- ---- Grants (explicit; raw-SQL tables don't inherit Supabase auto-grants) --
grant select on teams, team_members, applications to anon, authenticated;
grant insert, update, delete on teams, team_members, applications to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
