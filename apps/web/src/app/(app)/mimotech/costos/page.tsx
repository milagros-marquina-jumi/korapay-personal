'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { Plus, Server } from 'lucide-react';
import { useState } from 'react';
import { CategoryDonut } from '@/components/charts';
import { TransactionFormDialog } from '@/components/forms/transaction-form-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Paginated, Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

function CostosContent() {
  const { activeWorkspaceId } = useWorkspace();
  const [page, setPage] = useState(1);

  const filters = { page, type: 'BUSINESS_COST' };
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.transactions(activeWorkspaceId ?? '', filters),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/transactions${buildQuery({
          workspaceId: activeWorkspaceId ?? '',
          type: 'BUSINESS_COST',
          page,
          pageSize: 20,
          sortBy: 'date',
          sortOrder: 'desc',
        })}`,
      ),
    enabled: !!activeWorkspaceId,
  });

  const rows = data?.data ?? [];

  const byConcept = new Map<string, number>();
  for (const tx of rows) {
    byConcept.set(tx.concept, (byConcept.get(tx.concept) ?? 0) + Number(tx.amountBase));
  }
  const donutData = [...byConcept.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const totalCostos = rows.reduce((sum, tx) => sum + Number(tx.amountBase), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Costos de infraestructura"
        description="Costos de aplicaciones y servicios de MIMOTECH"
        action={
          activeWorkspaceId && (
            <TransactionFormDialog
              workspaceId={activeWorkspaceId}
              defaultType="BUSINESS_COST"
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo costo
                </Button>
              }
            />
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <KPICard
          label="Total costos"
          value={formatMoney(String(totalCostos), 'PEN')}
          icon={Server}
          color="text-destructive"
        />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Costos por aplicacion</CardTitle>
          </CardHeader>
          <CardContent>
            {donutData.length ? (
              <CategoryDonut data={donutData} height={240} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Sin costos registrados</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Aplicacion</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length ? (
                rows.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">{new Date(tx.date).toLocaleDateString('es-PE')}</TableCell>
                    <TableCell className="font-medium">{tx.concept}</TableCell>
                    <TableCell className="text-muted-foreground">{tx.description ?? '-'}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-destructive">
                      {formatMoney(tx.amountOriginal, tx.currency as 'PEN' | 'USD')}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tx.status} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-0">
                    <EmptyState title="Sin costos" description="Registra tu primer costo con el boton de arriba." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-sm text-muted-foreground">{data.pagination.total} resultados</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <span className="text-sm">
                {page} / {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CostosPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <CostosContent />
    </WorkspaceGate>
  );
}
