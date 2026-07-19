'use client';

import { deletePatient } from '@/app/(protected)/projects/[projectId]/patients/actions';
import { Button } from '@/components/ui/button';

export function DeletePatientButton({
  projectId,
  patientId,
  patientName,
}: {
  projectId: string;
  patientId: string;
  patientName: string;
}) {
  return (
    <form
      action={deletePatient}
      onSubmit={(event) => {
        if (!confirm(`Delete patient ${patientName}? This cannot be undone.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="patientId" value={patientId} />
      <Button type="submit" variant="destructive" size="sm">
        Delete
      </Button>
    </form>
  );
}
