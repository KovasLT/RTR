-- ============================================================================
-- Community news / blog. Anyone signed in can submit a post; it stays 'pending'
-- until an admin approves it. Approved posts are world-readable (homepage feed).
-- ============================================================================

create type news_status as enum ('pending', 'approved', 'rejected');

create table news_posts (
  id          bigint generated always as identity primary key,
  author_id   uuid not null references profiles(id) on delete cascade,
  title       text not null,
  body        text not null,
  image_url   text,
  status      news_status not null default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index news_status_idx on news_posts (status, created_at desc);
create index news_author_idx on news_posts (author_id);

alter table news_posts enable row level security;

-- Read: approved is public; authors see their own; admins see everything.
create policy "read news" on news_posts for select using (
  status = 'approved' or author_id = auth.uid() or public.is_admin()
);
-- Insert: a signed-in user creates their own post, forced to 'pending'.
create policy "insert news" on news_posts for insert with check (
  author_id = auth.uid() and status = 'pending'
);
-- Update: authors may edit their own *pending* post (cannot self-approve);
-- admins may edit any post.
create policy "author update news" on news_posts for update
  using (author_id = auth.uid() and status = 'pending')
  with check (author_id = auth.uid() and status = 'pending');
create policy "admin update news" on news_posts for update
  using (public.is_admin()) with check (public.is_admin());
-- Delete: the author or an admin.
create policy "delete news" on news_posts for delete
  using (author_id = auth.uid() or public.is_admin());

grant select on news_posts to anon, authenticated;
grant insert, update, delete on news_posts to authenticated;

-- Admin approve/reject; records the reviewer.
create or replace function public.review_news_post(p_id bigint, p_approved boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update news_posts
     set status      = case when p_approved then 'approved'::news_status else 'rejected'::news_status end,
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         updated_at  = now()
   where id = p_id;
end;
$$;

grant execute on function public.review_news_post(bigint, boolean) to authenticated;
