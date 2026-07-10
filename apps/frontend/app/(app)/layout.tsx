import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
