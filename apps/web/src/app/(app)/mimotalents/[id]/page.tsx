'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import type { Talent } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

function formatDate(value?: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('es-PE');
}

export default function MimotalentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activeWorkspaceId } = useWorkspace();

  const { data: talent, isLoading } = useQuery({
    queryKey: queryKeys.talent(activeWorkspaceId ?? '', id),
    queryFn: () => apiFetch<Talent>(`/talents/${id}?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId && !!id,
  });

  const backLink = (
    <Link
      href="/mimotalents"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver a talentos
    </Link>
  );

  if (isLoading || !talent) {
    return (
      <div className="space-y-6">
        {backLink}
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  const contracts = talent.contracts ?? [];

  return (
    <div className="space-y-6">
      {backLink}
      <PageHeader
        title={talent.name}
        description={talent.email ?? undefined}
        action={<StatusBadge status={talent.status} />}
      />

      {talent.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{talent.notes}</p>
          </CardContent>
        </Card>
      )}

      {contracts.length ? (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <Card key={contract.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle>{contract.position ?? 'Contrato'}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={contract.status} />
                  {contract.rate && (
                    <span className="text-sm font-semibold tabular-nums">
                      {formatMoney(contract.rate, contract.currency as 'PEN' | 'USD')}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {contract.incomeDistributions?.length ? (
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
                          <TableCell className="text-right tabular-nums text-success">
                            {formatMoney(dist.amountReceived, contract.currency as 'PEN' | 'USD')}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-warning">
                            {formatMoney(dist.amountRetained, contract.currency as 'PEN' | 'USD')}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={dist.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">Sin distribuciones de ingreso</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="Sin contratos"
          description="Este talento aun no tiene contratos registrados."
        />
      )}
    </div>
  );
}
