import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/lib/auth/session';

export async function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  return children;
}
