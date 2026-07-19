import { redirect } from 'next/navigation';

import { ProjectForm } from '@/components/project-form';
import { getUserOrganization } from '@/lib/auth/organization';
import { createClient } from '@/lib/supabase/server';

export default async function NewProjectPage() {
  const organization = await getUserOrganization();

  if (!organization || organization.role !== 'admin') {
    redirect('/projects');
  }

  const supabase = await createClient();

  const { data: memberships, error: membershipsError } = await supabase
    .from('organization_members')
    .select('user_id, role')
    .eq('organization_id', organization.id);

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  const userIds = memberships?.map((membership) => membership.user_id) ?? [];

  const { data: profiles, error: profilesError } = userIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profileById = new Map(profiles?.map((profile) => [profile.id, profile]) ?? []);

  const members = (memberships ?? []).map((membership) => {
    const profile = profileById.get(membership.user_id);

    return {
      id: membership.user_id,
      name: profile?.full_name?.trim() || 'Unnamed user',
      role: membership.role,
    };
  });

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <ProjectForm members={members} />
    </div>
  );
}
