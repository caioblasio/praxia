import { getUserOrganization } from '@/lib/auth/organization';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const [organization, supabase] = await Promise.all([getUserOrganization(), createClient()]);

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name')
    .order('name');

  if (projectsError) {
    throw new Error(projectsError.message);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Organization</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {organization?.name ?? 'Not assigned to an organization'}
        </h1>
        {organization ? (
          <p className="mt-2 text-sm text-zinc-500 capitalize dark:text-zinc-400">
            Signed in as {organization.role}
          </p>
        ) : null}

        <h2 className="mt-8 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Projects visible to your account
        </h2>

        {!projects?.length ? (
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            No projects yet. Org admins can create projects and assign members.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {projects.map((project) => (
              <li
                key={project.id}
                className="rounded-lg border border-zinc-200 px-4 py-3 text-zinc-900 dark:border-zinc-800 dark:text-zinc-100"
              >
                {project.name}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
