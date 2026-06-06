-- ============================================================================
-- Scout interest: a scout's private watchlist of players. Visible only to the
-- scout who created it and to the watched player ("scouts watching me").
-- ============================================================================

create type scout_interest_status as enum ('watching', 'contacted', 'archived');

create table scout_interests (
  id         bigint generated always as identity primary key,
  scout_id   uuid not null references profiles(id) on delete cascade,
  player_id  uuid not null references profiles(id) on delete cascade,
  note       text,
  status     scout_interest_status not null default 'watching',
  created_at timestamptz not null default now(),
  unique (scout_id, player_id)
);

create index scout_interests_player_idx on scout_interests (player_id);
create index scout_interests_scout_idx  on scout_interests (scout_id);

alter table scout_interests enable row level security;

-- Read: the scout themselves, or the player being watched.
create policy "read scout_interests" on scout_interests
  for select using (scout_id = auth.uid() or player_id = auth.uid());
-- Write: only the scout manages their own rows.
create policy "insert scout_interest" on scout_interests
  for insert with check (scout_id = auth.uid());
create policy "update scout_interest" on scout_interests
  for update using (scout_id = auth.uid()) with check (scout_id = auth.uid());
create policy "delete scout_interest" on scout_interests
  for delete using (scout_id = auth.uid());

grant select, insert, update, delete on scout_interests to authenticated;
