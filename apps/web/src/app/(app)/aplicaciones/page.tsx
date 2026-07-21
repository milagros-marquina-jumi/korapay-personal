'use client';

import { EmptyState } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { Application } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

function AplicacionesContent() {
  const { activeWorkspaceId } = useWorkspace();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.applications(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Application[]>(`/applications?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const applications = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Aplicaciones" description="Aplicaciones y servicios de MIMOTECH" />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : applications.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((application) => (
            <Card key={application.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>{application.name}</CardTitle>
                {application.category && <Badge variant="secondary">{application.category}</Badge>}
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{application.provider ?? '-'}</CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin aplicaciones" description="Aun no hay aplicaciones registradas." />
      )}
    </div>
  );
}

export default function AplicacionesPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <AplicacionesContent />
    </WorkspaceGate>
  );
}
