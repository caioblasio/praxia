-- Manual seed example for local development.
-- Run with: supabase db reset (applies migrations then seed.sql)
-- Or paste into the Supabase SQL editor (uses service role, bypasses RLS).
--
-- Replace the placeholder UUID with an existing auth.users.id after sign-up.

-- insert into public.organizations (name)
-- values ('Acme Corp')
-- returning id;

-- insert into public.organization_members (user_id, organization_id, role)
-- values (
--   '00000000-0000-0000-0000-000000000000',
--   '00000000-0000-0000-0000-000000000001',
--   'admin'
-- );

-- insert into public.projects (organization_id, name)
-- values (
--   '00000000-0000-0000-0000-000000000001',
--   'First Project'
-- )
-- returning id;

-- insert into public.project_members (project_id, user_id)
-- values (
--   '00000000-0000-0000-0000-000000000002',
--   '00000000-0000-0000-0000-000000000000'
-- );
