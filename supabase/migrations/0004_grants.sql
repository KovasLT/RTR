-- ============================================================================
-- Grant table/function privileges to the API roles.
-- RLS still controls WHICH ROWS each user can see/modify; these GRANTs are the
-- table-level access that PostgREST requires on top of RLS. (Needed because
-- objects created via raw SQL don't inherit Supabase's auto-grants.)
-- ============================================================================

grant usage on schema public to anon, authenticated;

-- Read for everyone; writes for signed-in users (RLS narrows the rows, and the
-- ratings tables have no write policy so they stay read-only to clients).
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to authenticated;

-- Apply the same defaults to objects created by future migrations.
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public
  grant execute on functions to authenticated;
