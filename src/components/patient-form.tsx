'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';

import {
  createPatient,
  updatePatient,
  type PatientFormState,
} from '@/app/(protected)/projects/[projectId]/patients/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCpf } from '@/lib/utils';

export type PatientFormValues = {
  id: string;
  firstName: string;
  lastName: string;
  cpf: string;
  phone: string;
};

const initialState: PatientFormState = {};

export function PatientForm({
  projectId,
  patient,
}: {
  projectId: string;
  patient?: PatientFormValues;
}) {
  const isEditing = Boolean(patient);
  const action = isEditing ? updatePatient : createPatient;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [cpf, setCpf] = useState(patient?.cpf ?? '');

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit patient' : 'Add patient'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Update the patient details below.'
            : 'Enter the patient details for this project.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="patient-form" action={formAction} className="space-y-6">
          <input type="hidden" name="projectId" value={projectId} />
          {patient ? <input type="hidden" name="patientId" value={patient.id} /> : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                defaultValue={patient?.firstName}
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                defaultValue={patient?.lastName}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              name="cpf"
              type="text"
              inputMode="numeric"
              placeholder="123.456.789-00"
              value={cpf}
              onChange={(event) => setCpf(formatCpf(event.target.value))}
              maxLength={14}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={patient?.phone}
              placeholder="e.g. (11) 98765-4321"
              required
            />
          </div>

          {state.error ? <p className="text-destructive text-sm">{state.error}</p> : null}
        </form>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          render={<Link href={`/projects/${projectId}`} />}
          nativeButton={false}
        >
          Cancel
        </Button>
        <Button type="submit" form="patient-form" disabled={pending}>
          {pending
            ? isEditing
              ? 'Saving...'
              : 'Creating...'
            : isEditing
              ? 'Save changes'
              : 'Create patient'}
        </Button>
      </CardFooter>
    </Card>
  );
}
