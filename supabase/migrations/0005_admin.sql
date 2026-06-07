-- ============================================================================
-- Admin layer: a secure is_admin() helper, protection against self-promotion,
-- admin management functions, and admin-write access to reference tables.
-- ============================================================================

-- ---- Helper: is the current user an admin? -------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and is_admin
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---- Close the self-promotion hole ---------------------------------------
-- Our "update own profile" RLS policy would otherwise let any user set
-- is_admin = true on themselves. This trigger blocks changes to is_admin
-- unless the change is made by an existing admin (or server-side, where
-- auth.uid() is null — e.g. the SQL editor bootstrapping the first admin).
create or replace function public.protect_is_admin()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'only admins can change admin status';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_is_admin on profiles;
create trigger profiles_protect_is_admin
  before update on profiles
  for each row execute function public.protect_is_admin();

-- ---- Admin: promote / demote another user --------------------------------
create or replace function public.set_user_admin(p_user uuid, p_is_admin boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update profiles set is_admin = p_is_admin, updated_at = now() where id = p_user;
end;
$$;

grant execute on function public.set_user_admin(uuid, boolean) to authenticated;

-- ---- Admin: remove a role from a user ------------------------------------
create or replace function public.admin_remove_role(p_user uuid, p_role user_role)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  delete from user_roles where user_id = p_user and role = p_role;
end;
$$;

grant execute on function public.admin_remove_role(uuid, user_role) to authenticated;

-- ---- Admins may manage reference data ------------------------------------
-- (Public read policies already exist; these add admin write. Permissive
--  policies are OR-ed, so reads stay open to everyone.)
create policy "admin write regions" on regions
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write lanes" on lanes
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write ranks" on ranks
  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin write heroes" on heroes
  for all using (public.is_admin()) with check (public.is_admin());
