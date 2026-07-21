'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { apiFetch } from '@/lib/api';
import type { EmploymentContract } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

function formatDateOrActive(value?: string | null) {
  return value ? formatDate(value) : 'Actual';
}

function ContratosContent() {
  const { activeWorkspaceId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(FILTER_ALL);
  const [type, setType] = useState(FILTER_ALL);
  const [currency, setCurrency] = useState(FILTER_ALL);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.employmentContracts(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<EmploymentContract[]>(`/employment-contracts?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const allContracts = data ?? [];

  const statusOptions = useMemo(
    () =>
      [...new Set(allContracts.map((c) => c.status).filter(Boolean) as string[])].map((v) => ({
        value: v,
        label: v,
      })),
    [allContracts],
  );

  const typeOptions = useMemo(
    () =>
      [...new Set(allContracts.map((c) => c.type).filter(Boolean) as string[])].map((v) => ({
        value: v,
        label: v,
      })),
    [allContracts],
  );

  const currencyOptions = [
    { value: 'PEN', label: 'Soles' },
    { value: 'USD', label: 'Dólares' },
  ];

  const contracts = useMemo(
    () =>
      allContracts.filter(
        (c) =>
          (status === FILTER_ALL || c.status === status) &&
          (type === FILTER_ALL || c.type === type) &&
          (currency === FILTER_ALL || c.currency === currency),
      ),
    [allContracts, status, type, currency],
  );

  const handleClear = () => {
    setSearch('');
    setStatus(FILTER_ALL);
    setType(FILTER_ALL);
    setCurrency(FILTER_ALL);
  };

  const columns = useMemo<ColumnDef<EmploymentContract, unknown>[]>(
    () => [
      {
        id: 'position',
        accessorFn: (r) => r.position ?? 'Contrato',
        header: ({ column }) => <SortableHeader column={column} label="Cargo" />,
        cell: ({ row }) => <span className="font-medium">{row.original.position ?? 'Contrato'}</span>,
      },
      {
        accessorKey: 'startDate',
        header: ({ column }) => <SortableHeader column={column} label="Inicio" />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.startDate)}</span>,
      },
      {
        id: 'endDate',
        header: 'Fin',
        cell: ({ row }) => <span className="text-sm">{formatDateOrActive(row.original.endDate)}</span>,
      },
      {
        id: 'salary',
        header: 'Salario',
        cell: ({ row }) =>
          row.original.salary ? (
            <span className="font-medium tabular-nums">
              {formatMoney(row.original.salary, row.original.currency as 'PEN' | 'USD')}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
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
      <PageHeader title="Contratos" description="Tus contratos laborales" />

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar contratos..."
        showClear={search !== '' || status !== FILTER_ALL || type !== FILTER_ALL || currency !== FILTER_ALL}
        onClear={handleClear}
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
              value={type}
              onValueChange={setType}
              options={typeOptions}
              placeholder="Tipo"
              allLabel="Todo tipo"
            />
            <FilterSelect
              value={currency}
              onValueChange={setCurrency}
              options={currencyOptions}
              placeholder="Moneda"
              allLabel="Toda moneda"
            />
          </>
        }
      />

      <DataTable
        columns={columns}
        data={contracts}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        emptyState={<EmptyState title="Sin contratos" description="Aún no hay contratos registrados." />}
      />
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
