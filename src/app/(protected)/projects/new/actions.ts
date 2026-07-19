'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getUserOrganization } from '@/lib/auth/organization';
import { createClient } from '@/lib/supabase/server';

export type CreateProjectState = {
  error?: string;
};

const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required.'),
  memberIds: z.array(z.string().uuid()).default([]),
});

export async function createProject(
  _prevState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const parsed = createProjectSchema.safeParse({
    name: formData.get('name'),
    memberIds: formData.getAll('memberIds').filter((value) => typeof value === 'string'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }

  const organization = await getUserOrganization();

  if (!organization || organization.role !== 'admin') {
    return { error: 'Only organization admins can create projects.' };
  }

  const { name, memberIds } = parsed.data;
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({ name, organization_id: organization.id })
    .select('id')
    .single();

  if (projectError) {
    return { error: projectError.message };
  }

  if (memberIds.length > 0) {
    const { error: membersError } = await supabase.from('project_members').insert(
      memberIds.map((user_id) => ({
        project_id: project.id,
        user_id,
      })),
    );

    if (membersError) {
      return { error: membersError.message };
    }
  }

  revalidatePath('/projects');
  redirect('/projects');
}
