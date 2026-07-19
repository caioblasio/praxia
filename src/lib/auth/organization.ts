import { createClient } from '@/lib/supabase/server';
import type { Enums } from '@/lib/supabase/database.types';

import { getAuthenticatedUser } from './session';

export type UserOrganization = {
  id: string;
  name: string;
  role: Enums<'organization_role'>;
};

export async function getUserOrganization(): Promise<UserOrganization | null> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organization_members')
    .select('role, organizations(id, name)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const organization = data?.organizations;

  if (!organization) {
    return null;
  }

  return {
    id: organization.id,
    name: organization.name,
    role: data.role,
  };
}
