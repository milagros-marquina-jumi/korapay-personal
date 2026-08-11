'use client';

import { PageShell } from '@/components/layout/page-shell';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { BusinessReportsView } from '@/components/reports/views/business-reports-view';
import { EmploymentReportsView } from '@/components/reports/views/employment-reports-view';
import { PersonalReportsView } from '@/components/reports/views/personal-reports-view';

function ReportsForWorkspace({ id, type }: Readonly<{ id: string; type?: string }>) {
  if (type === 'BUSINESS') return <BusinessReportsView workspaceId={id} />;
  if (type === 'EMPLOYMENT') return <EmploymentReportsView workspaceId={id} />;
  if (type === 'PERSONAL' || type === 'SHARED') return <PersonalReportsView workspaceId={id} />;
  return <p className="text-sm text-muted-foreground">Este workspace no tiene reportes configurados.</p>;
}

export default function ReportesPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();

  return (
    <PageShell title="Reportes" description="Resumen y análisis financiero">
      {activeWorkspaceId ? (
        <ReportsForWorkspace id={activeWorkspaceId} type={activeWorkspace?.type} />
      ) : (
        <p className="text-sm text-muted-foreground">Selecciona un workspace para ver sus reportes.</p>
      )}
    </PageShell>
  );
}
