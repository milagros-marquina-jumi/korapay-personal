import { AppShell } from '@/components/layout/AppShell';
import { WorkspaceProvider } from '@/components/providers/workspace-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
