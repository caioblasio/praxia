import { notFound, redirect } from 'next/navigation';

import { PatientForm } from '@/components/patient-form';
import { getProjectAccess } from '@/lib/auth/project-access';
import { createClient } from '@/lib/supabase/server';

export default async function EditPatientPage(
  props: PageProps<'/projects/[projectId]/patients/[patientId]/edit'>,
) {
  const { projectId, patientId } = await props.params;

  const access = await getProjectAccess(projectId);

  if (!access?.canManagePatients) {
    redirect(`/projects/${projectId}`);
  }

  const supabase = await createClient();
  const { data: patient, error } = await supabase
    .from('patients')
    .select('id, first_name, last_name, cpf, phone, project_id')
    .eq('id', patientId)
    .eq('project_id', projectId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!patient) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <PatientForm
        projectId={projectId}
        patient={{
          id: patient.id,
          firstName: patient.first_name,
          lastName: patient.last_name,
          cpf: patient.cpf,
          phone: patient.phone,
        }}
      />
    </div>
  );
}
