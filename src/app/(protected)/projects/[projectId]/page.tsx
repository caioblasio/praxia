import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeftIcon } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProjectPage(props: PageProps<'/projects/[projectId]'>) {
  const { projectId } = await props.params;

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, project_members(count)')
    .eq('id', projectId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!project) {
    notFound();
  }

  const memberCount = project.project_members[0]?.count ?? 0;

  return (
    <div className="flex flex-1 flex-col px-6 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <Button
          render={<Link href="/projects" />}
          nativeButton={false}
          variant="ghost"
          className="-ml-3"
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Back to projects
        </Button>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-2xl">{project.name}</CardTitle>
            <CardDescription>
              {memberCount} {memberCount === 1 ? 'operator' : 'operators'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
