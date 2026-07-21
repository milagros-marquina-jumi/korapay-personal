'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import type { TaxObligation } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

function RentaContent() {
  const { activeWorkspaceId } = useWorkspace();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.taxObligations(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<TaxObligation[]>(`/tax-obligations?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const obligations = data ?? [];

  const totalPendiente = obligations.filter((o) => o.status !== 'PAID').reduce((sum, o) => sum + Number(o.amount), 0);
  const totalPagado = obligations.filter((o) => o.status === 'PAID').reduce((sum, o) => sum + Number(o.amount), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Renta" description="Obligaciones tributarias y renta" />

      <div className="grid gap-4 sm:grid-cols-2">
        <KPICard
          label="Pendiente"
          value={formatMoney(String(totalPendiente), 'PEN')}
          icon={Clock}
          color="text-destructive"
        />
        <KPICard
          label="Pagado"
          value={formatMoney(String(totalPagado), 'PEN')}
          icon={CheckCircle2}
          color="text-success"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : obligations.length ? (
                obligations.map((obligation) => (
                  <TableRow key={obligation.id}>
                    <TableCell className="font-medium">{obligation.name}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(obligation.dueDate).toLocaleDateString('es-PE')}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatMoney(obligation.amount, 'PEN')}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={obligation.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{obligation.notes ?? '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-0">
                    <EmptyState
                      title="Sin obligaciones"
                      description="Aun no hay obligaciones tributarias registradas."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default function RentaPage() {
  return (
    <WorkspaceGate type="EMPLOYMENT">
      <RentaContent />
    </WorkspaceGate>
  );
}
