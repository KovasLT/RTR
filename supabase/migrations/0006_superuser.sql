-- ============================================================================
-- Super user layer. A super user is a higher-privileged admin: they inherit
-- every admin capability (same dashboard, RLS, functions) and additionally are
-- the only ones who can grant/revoke the super user flag itself.
-- ============================================================================

-- ---- Column --------------------------------------------------------------
alter table profiles
  add column if not exists is_superuser boolean not null default false;

-- ---- Helper: is the current user a super user? ---------------------------
create or replace function public.is_superuser()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and is_superuser
  );
$$;

grant execute on function public.is_superuser() to anon, authenticated;

-- ---- Super users count as admins everywhere ------------------------------
-- Folding is_superuser into is_admin() means all existing admin gating (RLS
-- policies, SECURITY DEFINER functions, the admin dashboard) applies to super
-- users automatically — they share the admin dashboard, as intended.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (is_admin or is_superuser)
  );
$$;

-- ---- Protect both privilege flags from self-promotion --------------------
-- Replaces 0005's trigger: is_admin still requires an admin to change it, and
-- is_superuser requires a super user to change it. auth.uid() is null in the
-- SQL editor, which is how the first super user is bootstrapped below.
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

  if new.is_superuser is distinct from old.is_superuser
     and auth.uid() is not null
     and not public.is_superuser() then
    raise exception 'only super users can change super user status';
  end if;

  return new;
end;
$$;

-- ---- Only the super user may grant/revoke admin --------------------------
-- Overrides 0005's set_user_admin (which allowed any admin to make admins).
-- Now admin status can only be changed by a super user.
create or replace function public.set_user_admin(p_user uuid, p_is_admin boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_superuser() then
    raise exception 'not authorized';
  end if;
  update profiles set is_admin = p_is_admin, updated_at = now() where id = p_user;
end;
$$;

-- The super user flag itself is granted by manual DB update only — there is no
-- function (and thus no frontend path) to create a super user. The protect
-- trigger above still blocks any client-side change to is_superuser.
drop function if exists public.set_user_superuser(uuid, boolean);

-- ---- Bootstrap the first super user --------------------------------------
-- You are currently the only user. Re-run with a where-clause once there are
-- more accounts (e.g. where handle = 'your-handle').
update profiles set is_superuser = true;
