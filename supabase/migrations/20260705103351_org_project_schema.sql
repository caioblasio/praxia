-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.organization_role as enum ('admin', 'operator');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role public.organization_role not null default 'operator',
  created_at timestamptz not null default now()
);

create index organization_members_organization_id_idx
  on public.organization_members (organization_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create index projects_organization_id_idx
  on public.projects (organization_id);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index project_members_user_id_idx
  on public.project_members (user_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row
  execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create or replace function public.validate_project_member_org()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  user_org_id uuid;
  project_org_id uuid;
begin
  select organization_id
  into user_org_id
  from public.organization_members
  where user_id = new.user_id;

  if user_org_id is null then
    raise exception 'User is not a member of any organization';
  end if;

  select organization_id
  into project_org_id
  from public.projects
  where id = new.project_id;

  if project_org_id is null then
    raise exception 'Project does not exist';
  end if;

  if user_org_id <> project_org_id then
    raise exception 'User must belong to the same organization as the project';
  end if;

  return new;
end;
$$;

create trigger project_members_validate_org
  before insert or update on public.project_members
  for each row
  execute function public.validate_project_member_org();

-- ---------------------------------------------------------------------------
-- Helper functions (security invoker, for RLS)
-- ---------------------------------------------------------------------------

create or replace function public.current_user_organization_id()
returns uuid
language sql
stable
security invoker
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
security invoker
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
security invoker
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
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members
    where user_id = (select auth.uid())
      and project_members.project_id = is_project_member.project_id
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;

-- organizations
create policy "organizations_select"
  on public.organizations
  for select
  to authenticated
  using (public.is_org_member(id));

create policy "organizations_update"
  on public.organizations
  for update
  to authenticated
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

-- profiles
create policy "profiles_select"
  on public.profiles
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or (
      public.current_user_organization_id() is not null
      and exists (
        select 1
        from public.organization_members om
        where om.user_id = profiles.id
          and om.organization_id = public.current_user_organization_id()
      )
    )
  );

create policy "profiles_update"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- organization_members
create policy "organization_members_select"
  on public.organization_members
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "organization_members_insert"
  on public.organization_members
  for insert
  to authenticated
  with check (public.is_org_admin(organization_id));

create policy "organization_members_update"
  on public.organization_members
  for update
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "organization_members_delete"
  on public.organization_members
  for delete
  to authenticated
  using (public.is_org_admin(organization_id));

-- projects
create policy "projects_select"
  on public.projects
  for select
  to authenticated
  using (
    public.is_org_admin(organization_id)
    or (
      public.is_org_member(organization_id)
      and public.is_project_member(id)
    )
  );

create policy "projects_insert"
  on public.projects
  for insert
  to authenticated
  with check (public.is_org_admin(organization_id));

create policy "projects_update"
  on public.projects
  for update
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy "projects_delete"
  on public.projects
  for delete
  to authenticated
  using (public.is_org_admin(organization_id));

-- project_members
create policy "project_members_select"
  on public.project_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      where p.id = project_members.project_id
        and public.is_org_admin(p.organization_id)
    )
    or public.is_project_member(project_id)
  );

create policy "project_members_insert"
  on public.project_members
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.projects p
      where p.id = project_id
        and public.is_org_admin(p.organization_id)
    )
  );

create policy "project_members_delete"
  on public.project_members
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      where p.id = project_members.project_id
        and public.is_org_admin(p.organization_id)
    )
  );
