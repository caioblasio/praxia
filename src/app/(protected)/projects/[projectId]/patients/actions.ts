'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getProjectAccess } from '@/lib/auth/project-access';
import { createClient } from '@/lib/supabase/server';

export type PatientFormState = {
  error?: string;
};

const patientSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF must be in the format 123.456.789-00.'),
  phone: z.string().trim().min(1, 'Phone number is required.'),
});

function parsePatientForm(formData: FormData) {
  return patientSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    cpf: formData.get('cpf'),
    phone: formData.get('phone'),
  });
}

export async function createPatient(
  _prevState: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  const projectId = formData.get('projectId');

  if (typeof projectId !== 'string' || !projectId) {
    return { error: 'Project is required.' };
  }

  const parsed = parsePatientForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const access = await getProjectAccess(projectId);

  if (!access?.canManagePatients) {
    return { error: 'You do not have permission to create patients for this project.' };
  }

  const { firstName, lastName, cpf, phone } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from('patients').insert({
    project_id: projectId,
    first_name: firstName,
    last_name: lastName,
    cpf,
    phone,
  });

  if (error) {
    if (error.code === '23505') {
      return { error: 'A patient with this CPF already exists in this project.' };
    }

    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function updatePatient(
  _prevState: PatientFormState,
  formData: FormData,
): Promise<PatientFormState> {
  const projectId = formData.get('projectId');
  const patientId = formData.get('patientId');

  if (typeof projectId !== 'string' || !projectId) {
    return { error: 'Project is required.' };
  }

  if (typeof patientId !== 'string' || !patientId) {
    return { error: 'Patient is required.' };
  }

  const parsed = parsePatientForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const access = await getProjectAccess(projectId);

  if (!access?.canManagePatients) {
    return { error: 'You do not have permission to update patients for this project.' };
  }

  const { firstName, lastName, cpf, phone } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from('patients')
    .update({
      first_name: firstName,
      last_name: lastName,
      cpf,
      phone,
    })
    .eq('id', patientId)
    .eq('project_id', projectId);

  if (error) {
    if (error.code === '23505') {
      return { error: 'A patient with this CPF already exists in this project.' };
    }

    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

export async function deletePatient(formData: FormData): Promise<void> {
  const projectId = formData.get('projectId');
  const patientId = formData.get('patientId');

  if (typeof projectId !== 'string' || !projectId) {
    throw new Error('Project is required.');
  }

  if (typeof patientId !== 'string' || !patientId) {
    throw new Error('Patient is required.');
  }

  const access = await getProjectAccess(projectId);

  if (!access?.canManagePatients) {
    throw new Error('You do not have permission to delete patients for this project.');
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', patientId)
    .eq('project_id', projectId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/projects/${projectId}`);
}
