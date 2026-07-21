'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Server } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CategoryDonut } from '@/components/charts';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { TransactionFormDialog } from '@/components/forms/transaction-form-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Paginated, Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

function CostosContent() {
  const { activeWorkspaceId } = useWorkspace();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.transactions(activeWorkspaceId ?? '', { type: 'BUSINESS_COST', all: true }),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/transactions${buildQuery({
          workspaceId: activeWorkspaceId ?? '',
          type: 'BUSINESS_COST',
          page: 1,
          pageSize: 500,
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

  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
        cell: ({ row }) => <span className="text-sm">{new Date(row.original.date).toLocaleDateString('es-PE')}</span>,
      },
      {
        accessorKey: 'concept',
        header: ({ column }) => <SortableHeader column={column} label="Aplicacion" />,
        cell: ({ row }) => <span className="font-medium">{row.original.concept}</span>,
      },
      {
        id: 'description',
        header: 'Descripcion',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.description ?? '-'}</span>,
      },
      {
        id: 'amount',
        accessorFn: (r) => Number(r.amountBase),
        sortingFn: 'basic',
        header: ({ column }) => <SortableHeader column={column} label="Monto" className="ml-auto" />,
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums text-destructive">
            {formatMoney(row.original.amountOriginal, row.original.currency as 'PEN' | 'USD')}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    [],
  );

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

      <DataTableToolbar search={search} onSearchChange={setSearch} placeholder="Buscar costos..." />

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        emptyState={<EmptyState title="Sin costos" description="Registra tu primer costo con el boton de arriba." />}
      />
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
