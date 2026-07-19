import Link from 'next/link';
import { PlusIcon } from 'lucide-react';

import { getUserOrganization } from '@/lib/auth/organization';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProjectsPage() {
  const [organization, supabase] = await Promise.all([getUserOrganization(), createClient()]);

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, created_at, project_members(count)')
    .order('name');

  if (projectsError) {
    throw new Error(projectsError.message);
  }

  const isAdmin = organization?.role === 'admin';

  return (
    <div className="flex flex-1 flex-col px-6 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My Projects</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {organization?.name ?? 'Not assigned to an organization'}
            </p>
          </div>
          {isAdmin ? (
            <Button render={<Link href="/projects/new" />} nativeButton={false}>
              <PlusIcon data-icon="inline-start" />
              New project
            </Button>
          ) : null}
        </div>

        {!organization ? (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>No organization</CardTitle>
              <CardDescription>
                You are not assigned to an organization yet. Contact an administrator to get access.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : !projects?.length ? (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>No projects yet</CardTitle>
              <CardDescription>
                {isAdmin
                  ? 'Create your first project to get started.'
                  : 'Ask an admin to add you to a project.'}
              </CardDescription>
            </CardHeader>
            {isAdmin ? (
              <CardContent>
                <Button render={<Link href="/projects/new" />} nativeButton={false}>
                  <PlusIcon data-icon="inline-start" />
                  Create project
                </Button>
              </CardContent>
            ) : null}
          </Card>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {projects.map((project) => {
              const memberCount = project.project_members[0]?.count ?? 0;

              return (
                <li key={project.id}>
                  <Link href={`/projects/${project.id}`} className="block">
                    <Card className="transition-colors hover:bg-accent/50">
                      <CardHeader>
                        <CardTitle>{project.name}</CardTitle>
                        <CardDescription>
                          {memberCount} {memberCount === 1 ? 'operator' : 'operators'}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
