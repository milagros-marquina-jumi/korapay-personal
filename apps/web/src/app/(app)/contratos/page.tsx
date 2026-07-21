'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { apiFetch } from '@/lib/api';
import type { EmploymentContract } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('es-PE') : 'Actual';
}

function ContratosContent() {
  const { activeWorkspaceId } = useWorkspace();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.employmentContracts(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<EmploymentContract[]>(`/employment-contracts?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const contracts = data ?? [];

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
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.endDate)}</span>,
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

      <DataTableToolbar search={search} onSearchChange={setSearch} placeholder="Buscar contratos..." />

      <DataTable
        columns={columns}
        data={contracts}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        emptyState={<EmptyState title="Sin contratos" description="Aun no hay contratos registrados." />}
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
