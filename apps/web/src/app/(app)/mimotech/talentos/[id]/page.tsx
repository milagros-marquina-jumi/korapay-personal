'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import type { Talent } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

function formatDateOrActive(value?: string | null) {
  return value ? formatDate(value) : 'Actual';
}

function TalentDetailContent() {
  const { activeWorkspaceId } = useWorkspace();
  const { id } = useParams<{ id: string }>();

  const { data: talent, isLoading } = useQuery({
    queryKey: queryKeys.talent(activeWorkspaceId ?? '', id),
    queryFn: () => apiFetch<Talent>(`/talents/${id}?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId && !!id,
  });

  if (isLoading || !talent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  const contracts = talent.contracts ?? [];

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/mimotech/talentos">
          <ArrowLeft className="mr-2 h-4 w-4" /> Talentos
        </Link>
      </Button>

      <PageHeader title={talent.name} action={<StatusBadge status={talent.status} />} />

      {talent.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{talent.notes}</CardContent>
        </Card>
      )}

      {contracts.length ? (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <Card key={contract.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>{contract.position ?? 'Contrato'}</CardTitle>
                <StatusBadge status={contract.status} />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <span>
                    {formatDate(contract.startDate)} – {formatDateOrActive(contract.endDate)}
                  </span>
                  {contract.rate && (
                    <span className="font-medium tabular-nums text-foreground">
                      {formatMoney(contract.rate, contract.currency as 'PEN' | 'USD')}
                    </span>
                  )}
                </div>
                {contract.incomeDistributions?.length ? (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">Con descuento</TableHead>
                          <TableHead className="text-right">Recibido</TableHead>
                          <TableHead className="text-right">Retenido</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contract.incomeDistributions.map((dist) => (
                          <TableRow key={dist.id}>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(dist.amountWithDiscount, contract.currency as 'PEN' | 'USD')}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(dist.amountReceived, contract.currency as 'PEN' | 'USD')}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatMoney(dist.amountRetained, contract.currency as 'PEN' | 'USD')}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={dist.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin distribuciones registradas</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin contratos" description="Este talento aun no tiene contratos registrados." />
      )}
    </div>
  );
}

export default function TalentDetailPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <TalentDetailContent />
    </WorkspaceGate>
  );
}
