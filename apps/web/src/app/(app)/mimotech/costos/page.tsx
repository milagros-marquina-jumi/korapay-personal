'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Server } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { TransactionFormDialog } from '@/components/forms/transaction-form-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Application, Category, Paginated, Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  OVERDUE: 'Vencido',
  PARTIAL: 'Parcial',
  CANCELLED: 'Cancelado',
  PENDING_REVIEW: 'Revisión',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
};

function CostosContent() {
  const { activeWorkspaceId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(FILTER_ALL);
  const [categoryId, setCategoryId] = useState<string>(FILTER_ALL);
  const [applicationId, setApplicationId] = useState<string>(FILTER_ALL);

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

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Category[]>(`/categories?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const { data: applications } = useQuery({
    queryKey: queryKeys.applications(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Application[]>(`/applications?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const statusOptions = useMemo(() => {
    const distinct = [...new Set((data?.data ?? []).map((tx) => tx.status))];
    return distinct.map((value) => ({ value, label: STATUS_LABELS[value] ?? value }));
  }, [data?.data]);

  const categoryOptions = useMemo(() => (categories ?? []).map((c) => ({ value: c.id, label: c.name })), [categories]);

  const applicationOptions = useMemo(
    () => (applications ?? []).map((a) => ({ value: a.id, label: a.name })),
    [applications],
  );

  const rows = useMemo(() => {
    return (data?.data ?? []).filter((tx) => {
      if (status !== FILTER_ALL && tx.status !== status) return false;
      if (categoryId !== FILTER_ALL && tx.categoryId !== categoryId) return false;
      if (applicationId !== FILTER_ALL && tx.applicationId !== applicationId) return false;
      return true;
    });
  }, [data?.data, status, categoryId, applicationId]);

  const totalCostos = rows.reduce((sum, tx) => sum + Number(tx.amountBase), 0);

  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.date)}</span>,
      },
      {
        accessorKey: 'concept',
        header: ({ column }) => <SortableHeader column={column} label="Aplicación" />,
        cell: ({ row }) => <span className="font-medium">{row.original.concept}</span>,
      },
      {
        id: 'description',
        header: 'Descripción',
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          label="Total costos"
          value={formatMoney(String(totalCostos), 'PEN')}
          icon={Server}
          color="text-destructive"
        />
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar costos..."
        showClear={search !== '' || status !== FILTER_ALL || categoryId !== FILTER_ALL || applicationId !== FILTER_ALL}
        onClear={() => {
          setSearch('');
          setStatus(FILTER_ALL);
          setCategoryId(FILTER_ALL);
          setApplicationId(FILTER_ALL);
        }}
        filters={
          <>
            <FilterSelect
              value={status}
              onValueChange={setStatus}
              options={statusOptions}
              placeholder="Estado"
              allLabel="Todo estado"
            />
            <FilterSelect
              value={categoryId}
              onValueChange={setCategoryId}
              options={categoryOptions}
              placeholder="Categoría"
              allLabel="Toda categoría"
            />
            <FilterSelect
              value={applicationId}
              onValueChange={setApplicationId}
              options={applicationOptions}
              placeholder="Aplicación"
              allLabel="Toda app"
            />
          </>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        emptyState={<EmptyState title="Sin costos" description="Registra tu primer costo con el botón de arriba." />}
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
