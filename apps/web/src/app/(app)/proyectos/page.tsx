'use client';

import { EmptyState, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { Project } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

function ProyectosContent() {
  const { activeWorkspaceId } = useWorkspace();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.projects(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Project[]>(`/projects?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const projects = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Proyectos" description="Proyectos de MIMOTECH" />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : projects.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  {project.emoji && <span className="text-xl">{project.emoji}</span>}
                  {project.name}
                </CardTitle>
                <StatusBadge status={project.status} />
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{project.description ?? '-'}</CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin proyectos" description="Aun no hay proyectos registrados." />
      )}
    </div>
  );
}

export default function ProyectosPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <ProyectosContent />
    </WorkspaceGate>
  );
}
