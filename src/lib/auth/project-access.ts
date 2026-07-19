import { createClient } from '@/lib/supabase/server';

import { getAuthenticatedUser } from './session';
import { getUserOrganization } from './organization';

export type ProjectAccess = {
  organizationId: string;
  isAdmin: boolean;
  canManagePatients: boolean;
};

export async function getProjectAccess(projectId: string): Promise<ProjectAccess | null> {
  const [user, organization] = await Promise.all([
    getAuthenticatedUser(),
    getUserOrganization(),
  ]);

  if (!user || !organization) {
    return null;
  }

  const isAdmin = organization.role === 'admin';

  if (isAdmin) {
    return {
      organizationId: organization.id,
      isAdmin: true,
      canManagePatients: true,
    };
  }

  const supabase = await createClient();
  const { data: membership, error } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    organizationId: organization.id,
    isAdmin: false,
    canManagePatients: Boolean(membership),
  };
}
