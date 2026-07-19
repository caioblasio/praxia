import { redirect } from 'next/navigation';

import { PatientForm } from '@/components/patient-form';
import { getProjectAccess } from '@/lib/auth/project-access';
import { createClient } from '@/lib/supabase/server';

export default async function NewPatientPage(props: PageProps<'/projects/[projectId]/patients/new'>) {
  const { projectId } = await props.params;

  const access = await getProjectAccess(projectId);

  if (!access?.canManagePatients) {
    redirect(`/projects/${projectId}`);
  }

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!project) {
    redirect('/projects');
  }

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <PatientForm projectId={projectId} />
    </div>
  );
}
