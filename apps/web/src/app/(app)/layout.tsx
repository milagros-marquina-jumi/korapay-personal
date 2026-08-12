import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { WorkspaceProvider } from '@/components/providers/workspace-provider';

// Toda el area privada muestra saldos y movimientos: nunca debe indexarse.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
