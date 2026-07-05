import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/lib/auth/session';

export async function PublicRoute({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect('/');
  }

  return children;
}
