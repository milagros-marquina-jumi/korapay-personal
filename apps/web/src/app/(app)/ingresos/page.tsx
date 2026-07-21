'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
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
import type { Company, Paginated, Transaction } from '@/lib/api.types';
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

function IngresosContent() {
  const { activeWorkspaceId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(FILTER_ALL);
  const [companyId, setCompanyId] = useState<string>(FILTER_ALL);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.transactions(activeWorkspaceId ?? '', { type: 'INCOME', all: true }),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/transactions${buildQuery({
          workspaceId: activeWorkspaceId ?? '',
          type: 'INCOME',
          page: 1,
          pageSize: 500,
          sortBy: 'date',
          sortOrder: 'desc',
        })}`,
      ),
    enabled: !!activeWorkspaceId,
  });

  const { data: companies } = useQuery({
    queryKey: queryKeys.companies(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Company[]>(`/companies?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const statusOptions = useMemo(() => {
    const distinct = [...new Set((data?.data ?? []).map((tx) => tx.status))];
    return distinct.map((value) => ({ value, label: STATUS_LABELS[value] ?? value }));
  }, [data?.data]);

  const companyOptions = useMemo(() => (companies ?? []).map((c) => ({ value: c.id, label: c.name })), [companies]);

  const rows = useMemo(() => {
    return (data?.data ?? []).filter((tx) => {
      if (status !== FILTER_ALL && tx.status !== status) return false;
      if (companyId !== FILTER_ALL && tx.companyId !== companyId) return false;
      return true;
    });
  }, [data?.data, status, companyId]);

  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.date)}</span>,
      },
      {
        accessorKey: 'concept',
        header: ({ column }) => <SortableHeader column={column} label="Concepto" />,
        cell: ({ row }) => <span className="font-medium">{row.original.concept}</span>,
      },
      {
        id: 'company',
        header: 'Empresa',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.tags[0] ?? row.original.category?.name ?? '-'}</span>
        ),
      },
      {
        id: 'amount',
        accessorFn: (r) => Number(r.amountBase),
        sortingFn: 'basic',
        header: ({ column }) => <SortableHeader column={column} label="Monto" className="ml-auto" />,
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums text-success">
            +{formatMoney(row.original.amountOriginal, row.original.currency as 'PEN' | 'USD')}
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
        title="Ingresos"
        description="Ingresos por trabajos y empleos"
        action={
          activeWorkspaceId && (
            <TransactionFormDialog
              workspaceId={activeWorkspaceId}
              defaultType="INCOME"
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo ingreso
                </Button>
              }
            />
          )
        }
      />

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar ingresos..."
        showClear={search !== '' || status !== FILTER_ALL || companyId !== FILTER_ALL}
        onClear={() => {
          setSearch('');
          setStatus(FILTER_ALL);
          setCompanyId(FILTER_ALL);
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
              value={companyId}
              onValueChange={setCompanyId}
              options={companyOptions}
              placeholder="Empresa"
              allLabel="Toda empresa"
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
        emptyState={
          <EmptyState title="Sin ingresos" description="Registra tu primer ingreso con el botón de arriba." />
        }
      />
    </div>
  );
}

export default function IngresosPage() {
  return (
    <WorkspaceGate type="EMPLOYMENT">
      <IngresosContent />
    </WorkspaceGate>
  );
}
