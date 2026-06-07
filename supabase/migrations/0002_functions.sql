-- ============================================================================
-- Functions & triggers: profile bootstrap + the unified Elo rating engine.
-- All rating mutations go through SECURITY DEFINER functions so that clients
-- (which have no INSERT/UPDATE rights on ratings) can never edit ratings
-- directly — only via these audited paths.
-- ============================================================================

-- ---- Create a profile row when a new auth user signs up ------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, discord_id, handle, display_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data->>'provider_id',
    coalesce(new.raw_user_meta_data->>'user_name',
             new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- Ensure a ratings row exists for a subject ---------------------------
create or replace function public.ensure_rating(
  p_subject_type subject_type,
  p_subject_id   uuid
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into ratings (subject_type, subject_id)
  values (p_subject_type, p_subject_id)
  on conflict (subject_type, subject_id) do nothing;
end;
$$;

-- ---- Seed a rating + 'initial' ledger entry when a role is added ---------
create or replace function public.handle_new_role()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_subj subject_type;
  v_rating int;
begin
  v_subj := new.role::text::subject_type;
  perform ensure_rating(v_subj, new.user_id);

  select rating into v_rating
  from ratings where subject_type = v_subj and subject_id = new.user_id;

  if not exists (
    select 1 from rating_events
    where subject_type = v_subj and subject_id = new.user_id
  ) then
    insert into rating_events (subject_type, subject_id, delta, new_rating, reason)
    values (v_subj, new.user_id, 0, v_rating, 'initial');
  end if;

  return new;
end;
$$;

create trigger on_user_role_created
  after insert on user_roles
  for each row execute function public.handle_new_role();

-- ---- Generic: apply a rating delta + write a ledger entry -----------------
create or replace function public.apply_rating_delta(
  p_subject_type subject_type,
  p_subject_id   uuid,
  p_delta        int,
  p_reason       rating_reason,
  p_source_id    uuid default null,
  p_note         text default null,
  p_actor        uuid default null
) returns int
language plpgsql security definer set search_path = public
as $$
declare v_new int;
begin
  perform ensure_rating(p_subject_type, p_subject_id);

  update ratings
     set rating        = rating + p_delta,
         games_count   = games_count + case when p_reason = 'match_result' then 1 else 0 end,
         last_event_at = now()
   where subject_type = p_subject_type and subject_id = p_subject_id
  returning rating into v_new;

  insert into rating_events
    (subject_type, subject_id, delta, new_rating, reason, source_id, note, created_by)
  values
    (p_subject_type, p_subject_id, p_delta, v_new, p_reason, p_source_id, p_note, p_actor);

  return v_new;
end;
$$;

-- ---- Elo update for a head-to-head result (players or teams) --------------
-- p_score_a: 1 = A won, 0 = A lost, 0.5 = draw.
create or replace function public.apply_elo_match(
  p_subject_type subject_type,
  p_a            uuid,
  p_b            uuid,
  p_score_a      numeric,
  p_source_id    uuid default null,
  p_k            int default 32
) returns void
language plpgsql security definer set search_path = public
as $$
declare ra int; rb int; ea numeric; da int; db int;
begin
  perform ensure_rating(p_subject_type, p_a);
  perform ensure_rating(p_subject_type, p_b);

  select rating into ra from ratings where subject_type = p_subject_type and subject_id = p_a;
  select rating into rb from ratings where subject_type = p_subject_type and subject_id = p_b;

  ea := 1.0 / (1.0 + power(10.0, (rb - ra) / 400.0));
  da := round(p_k * (p_score_a - ea));
  db := round(p_k * ((1 - p_score_a) - (1 - ea)));

  perform apply_rating_delta(p_subject_type, p_a, da, 'match_result', p_source_id);
  perform apply_rating_delta(p_subject_type, p_b, db, 'match_result', p_source_id);
end;
$$;

-- ---- Endorsement (non-competitive roles): bounded delta ------------------
create or replace function public.apply_endorsement(
  p_subject_type subject_type,
  p_subject_id   uuid,
  p_weight       int default 10
) returns int
language plpgsql security definer set search_path = public
as $$
declare v_delta int;
begin
  v_delta := least(greatest(p_weight, 1), 25); -- clamp 1..25
  return apply_rating_delta(
    p_subject_type, p_subject_id, v_delta, 'endorsement', null, 'endorsement', auth.uid()
  );
end;
$$;

-- ---- Verified achievement: fixed tiered delta ----------------------------
create or replace function public.apply_achievement(
  p_subject_type subject_type,
  p_subject_id   uuid,
  p_delta        int,
  p_note         text default null
) returns int
language plpgsql security definer set search_path = public
as $$
begin
  return apply_rating_delta(
    p_subject_type, p_subject_id, p_delta, 'achievement', null, p_note, auth.uid()
  );
end;
$$;

-- ---- Admin override ------------------------------------------------------
create or replace function public.admin_adjust_rating(
  p_subject_type subject_type,
  p_subject_id   uuid,
  p_delta        int,
  p_note         text
) returns int
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin) then
    raise exception 'not authorized';
  end if;
  return apply_rating_delta(
    p_subject_type, p_subject_id, p_delta, 'admin_adjustment', null, p_note, auth.uid()
  );
end;
$$;
