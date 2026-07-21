'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Clock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { apiFetch } from '@/lib/api';
import type { TaxObligation } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

function RentaContent() {
  const { activeWorkspaceId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(FILTER_ALL);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.taxObligations(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<TaxObligation[]>(`/tax-obligations?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const allObligations = data ?? [];

  const statusOptions = useMemo(
    () =>
      [...new Set(allObligations.map((o) => o.status).filter(Boolean) as string[])].map((v) => ({
        value: v,
        label: v,
      })),
    [allObligations],
  );

  const obligations = useMemo(
    () => allObligations.filter((o) => status === FILTER_ALL || o.status === status),
    [allObligations, status],
  );

  const totalPendiente = obligations.filter((o) => o.status !== 'PAID').reduce((sum, o) => sum + Number(o.amount), 0);
  const totalPagado = obligations.filter((o) => o.status === 'PAID').reduce((sum, o) => sum + Number(o.amount), 0);

  const handleClear = () => {
    setSearch('');
    setStatus(FILTER_ALL);
  };

  const columns = useMemo<ColumnDef<TaxObligation, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortableHeader column={column} label="Concepto" />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'dueDate',
        header: ({ column }) => <SortableHeader column={column} label="Vencimiento" />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.dueDate)}</span>,
      },
      {
        id: 'amount',
        accessorFn: (r) => Number(r.amount),
        sortingFn: 'basic',
        header: ({ column }) => <SortableHeader column={column} label="Monto" className="ml-auto" />,
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums">{formatMoney(row.original.amount, 'PEN')}</div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'notes',
        header: 'Notas',
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.notes ?? '-'}</span>,
      },
    ],
    [],
  );

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

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar obligaciones..."
        showClear={search !== '' || status !== FILTER_ALL}
        onClear={handleClear}
        filters={
          <FilterSelect
            value={status}
            onValueChange={setStatus}
            options={statusOptions}
            placeholder="Estado"
            allLabel="Todo estado"
          />
        }
      />

      <DataTable
        columns={columns}
        data={obligations}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        emptyState={
          <EmptyState title="Sin obligaciones" description="Aun no hay obligaciones tributarias registradas." />
        }
      />
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
