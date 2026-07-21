'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { EmploymentContract } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('es-PE') : 'Actual';
}

function ContratosContent() {
  const { activeWorkspaceId } = useWorkspace();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.employmentContracts(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<EmploymentContract[]>(`/employment-contracts?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const contracts = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Contratos" description="Tus contratos laborales" />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : contracts.length ? (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <Card key={contract.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>{contract.position ?? 'Contrato'}</CardTitle>
                <StatusBadge status={contract.status} />
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>
                  {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
                </span>
                {contract.salary && (
                  <span className="font-medium text-foreground">
                    {formatMoney(contract.salary, contract.currency as 'PEN' | 'USD')}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin contratos" description="Aun no hay contratos registrados." />
      )}
    </div>
  );
}

export default function ContratosPage() {
  return (
    <WorkspaceGate type="EMPLOYMENT">
      <ContratosContent />
    </WorkspaceGate>
  );
}
