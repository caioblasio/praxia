import { PublicRoute } from '@/components/public-route';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicRoute>{children}</PublicRoute>;
}
