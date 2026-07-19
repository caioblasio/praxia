-- RLS policies call membership helpers that read the same tables, causing
-- infinite recursion ("stack depth limit exceeded"). Helpers run as definer
-- so internal lookups bypass RLS; they still only use auth.uid().

create policy "organization_members_select_self"
  on public.organization_members
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.current_user_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.organization_members
  where user_id = (select auth.uid());
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where user_id = (select auth.uid())
      and organization_id = org_id
  );
$$;

create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where user_id = (select auth.uid())
      and organization_id = org_id
      and role = 'admin'::public.organization_role
  );
$$;

create or replace function public.is_project_member(project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members
    where user_id = (select auth.uid())
      and project_members.project_id = is_project_member.project_id
  );
$$;

revoke execute on function public.current_user_organization_id() from public, anon;
revoke execute on function public.is_org_member(uuid) from public, anon;
revoke execute on function public.is_org_admin(uuid) from public, anon;
revoke execute on function public.is_project_member(uuid) from public, anon;
