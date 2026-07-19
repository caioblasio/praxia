import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeftIcon, PlusIcon } from 'lucide-react';

import { DeletePatientButton } from '@/components/delete-patient-button';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getProjectAccess } from '@/lib/auth/project-access';
import { createClient } from '@/lib/supabase/server';

export default async function ProjectPage(props: PageProps<'/projects/[projectId]'>) {
  const { projectId } = await props.params;

  const [access, supabase] = await Promise.all([getProjectAccess(projectId), createClient()]);

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

  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('id, first_name, last_name, cpf, phone')
    .eq('project_id', projectId)
    .order('last_name')
    .order('first_name');

  if (patientsError) {
    throw new Error(patientsError.message);
  }

  const memberCount = project.project_members[0]?.count ?? 0;
  const canManagePatients = access?.canManagePatients ?? false;

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

        <div className="mt-8 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Patients</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Patients registered in this project.
            </p>
          </div>
          {canManagePatients ? (
            <Button
              render={<Link href={`/projects/${projectId}/patients/new`} />}
              nativeButton={false}
            >
              <PlusIcon data-icon="inline-start" />
              Add patient
            </Button>
          ) : null}
        </div>

        {!patients?.length ? (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>No patients yet</CardTitle>
              <CardDescription>
                {canManagePatients
                  ? 'Add the first patient for this project.'
                  : 'No patients have been added to this project.'}
              </CardDescription>
            </CardHeader>
            {canManagePatients ? (
              <CardContent>
                <Button
                  render={<Link href={`/projects/${projectId}/patients/new`} />}
                  nativeButton={false}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add patient
                </Button>
              </CardContent>
            ) : null}
          </Card>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium">First name</th>
                  <th className="px-4 py-3 font-medium">Last name</th>
                  <th className="px-4 py-3 font-medium">CPF</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  {canManagePatients ? (
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">{patient.first_name}</td>
                    <td className="px-4 py-3">{patient.last_name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{patient.cpf}</td>
                    <td className="px-4 py-3">{patient.phone}</td>
                    {canManagePatients ? (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            render={
                              <Link
                                href={`/projects/${projectId}/patients/${patient.id}/edit`}
                              />
                            }
                            nativeButton={false}
                          >
                            Edit
                          </Button>
                          <DeletePatientButton
                            projectId={projectId}
                            patientId={patient.id}
                            patientName={`${patient.first_name} ${patient.last_name}`}
                          />
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
