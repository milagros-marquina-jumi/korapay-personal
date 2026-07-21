'use client';

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
import type { Project } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

function ProyectosContent() {
  const { activeWorkspaceId } = useWorkspace();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(FILTER_ALL);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.projects(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Project[]>(`/projects?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const allProjects = data ?? [];

  const statusOptions = useMemo(
    () =>
      [...new Set(allProjects.map((p) => p.status).filter(Boolean) as string[])].map((v) => ({
        value: v,
        label: v,
      })),
    [allProjects],
  );

  const projects = useMemo(
    () => allProjects.filter((p) => status === FILTER_ALL || p.status === status),
    [allProjects, status],
  );

  const handleClear = () => {
    setSearch('');
    setStatus(FILTER_ALL);
  };

  const columns = useMemo<ColumnDef<Project, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortableHeader column={column} label="Nombre" />,
        cell: ({ row }) => (
          <span className="flex items-center gap-2 font-medium">
            {row.original.emoji && <span className="text-lg">{row.original.emoji}</span>}
            {row.original.name}
          </span>
        ),
      },
      {
        id: 'description',
        header: 'Descripción',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.description ?? '-'}</span>,
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
      <PageHeader title="Proyectos" description="Proyectos de MIMOTECH" />

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar proyectos..."
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
        data={projects}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        emptyState={<EmptyState title="Sin proyectos" description="Aún no hay proyectos registrados." />}
      />
    </div>
  );
}

export default function ProyectosPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <ProyectosContent />
    </WorkspaceGate>
  );
}
