'use client';

import { EmptyState } from '@korapay/ui';
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
import type { Application } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

function AplicacionesContent() {
  const { activeWorkspaceId } = useWorkspace();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.applications(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Application[]>(`/applications?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const applications = data ?? [];

  const columns = useMemo<ColumnDef<Application, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortableHeader column={column} label="Nombre" />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        id: 'provider',
        header: 'Proveedor',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.provider ?? '-'}</span>,
      },
      {
        id: 'category',
        header: 'Categoria',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.category ?? '-'}</span>,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Aplicaciones" description="Aplicaciones y servicios de MIMOTECH" />

      <DataTableToolbar search={search} onSearchChange={setSearch} placeholder="Buscar aplicaciones..." />

      <DataTable
        columns={columns}
        data={applications}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        emptyState={<EmptyState title="Sin aplicaciones" description="Aun no hay aplicaciones registradas." />}
      />
    </div>
  );
}

export default function AplicacionesPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <AplicacionesContent />
    </WorkspaceGate>
  );
}
