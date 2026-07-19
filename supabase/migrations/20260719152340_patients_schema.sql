-- ---------------------------------------------------------------------------
-- Patients (belong to a single project)
-- ---------------------------------------------------------------------------

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  cpf text not null check (cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$'),
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, cpf)
);

create index patients_project_id_idx
  on public.patients (project_id);

create trigger patients_set_updated_at
  before update on public.patients
  for each row
  execute function public.set_updated_at();

alter table public.patients enable row level security;

-- Admins can manage patients in any org project; operators only in projects
-- they belong to (mirrors project_members access pattern).

create policy "patients_select"
  on public.patients
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      where p.id = patients.project_id
        and public.is_org_admin(p.organization_id)
    )
    or public.is_project_member(patients.project_id)
  );

create policy "patients_insert"
  on public.patients
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.projects p
      where p.id = project_id
        and public.is_org_admin(p.organization_id)
    )
    or public.is_project_member(project_id)
  );

create policy "patients_update"
  on public.patients
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      where p.id = patients.project_id
        and public.is_org_admin(p.organization_id)
    )
    or public.is_project_member(patients.project_id)
  )
  with check (
    exists (
      select 1
      from public.projects p
      where p.id = project_id
        and public.is_org_admin(p.organization_id)
    )
    or public.is_project_member(project_id)
  );

create policy "patients_delete"
  on public.patients
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      where p.id = patients.project_id
        and public.is_org_admin(p.organization_id)
    )
    or public.is_project_member(patients.project_id)
  );

grant select, insert, update, delete on table public.patients to authenticated;
