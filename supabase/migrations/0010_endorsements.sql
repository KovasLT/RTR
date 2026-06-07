-- ============================================================================
-- Endorsements: peer endorsement of a subject's role. Each endorsement records
-- who endorsed whom (one per endorser+subject) and applies a bounded rating
-- delta through the existing engine. Self-endorsement is blocked.
-- ============================================================================

create table endorsements (
  id           bigint generated always as identity primary key,
  endorser_id  uuid not null references profiles(id) on delete cascade,
  subject_type subject_type not null,
  subject_id   uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (endorser_id, subject_type, subject_id)
);

create index endorsements_subject_idx on endorsements (subject_type, subject_id);

alter table endorsements enable row level security;
-- Public read (counts + "did I endorse"); writes only via the functions below.
create policy "read endorsements" on endorsements for select using (true);
grant select on endorsements to anon, authenticated;

-- Endorse a subject. Idempotent: re-endorsing is a no-op (no double rating).
create or replace function public.endorse_subject(p_subject_type subject_type, p_subject_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'must be signed in'; end if;
  if p_subject_id = auth.uid() then raise exception 'cannot endorse yourself'; end if;

  insert into endorsements (endorser_id, subject_type, subject_id)
  values (auth.uid(), p_subject_type, p_subject_id)
  on conflict do nothing;

  if found then
    perform apply_rating_delta(p_subject_type, p_subject_id, 15, 'endorsement', null, 'Peer endorsement', auth.uid());
  end if;
end;
$$;

grant execute on function public.endorse_subject(subject_type, uuid) to authenticated;

-- Withdraw an endorsement; reverses the delta only if one existed.
create or replace function public.unendorse_subject(p_subject_type subject_type, p_subject_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  delete from endorsements
   where endorser_id = auth.uid() and subject_type = p_subject_type and subject_id = p_subject_id;
  if found then
    perform apply_rating_delta(p_subject_type, p_subject_id, -15, 'endorsement', null, 'Endorsement withdrawn', auth.uid());
  end if;
end;
$$;

grant execute on function public.unendorse_subject(subject_type, uuid) to authenticated;
