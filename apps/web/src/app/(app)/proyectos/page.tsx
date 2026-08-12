'use client';

import { EmptyState, StatusBadge } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { ProjectFormDialog } from '@/components/forms/project-form-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { WorkspaceIcon } from '@/components/layout/workspace-icon';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { IconAction } from '@/components/ui/icon-action';
import { apiFetch } from '@/lib/api';
import type { Project } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useHighlightNew } from '@/lib/use-highlight-new';

function ProyectosContent() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { markNew, highlightClass } = useHighlightNew();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(FILTER_ALL);
  const [editing, setEditing] = useState<Project | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.projects(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Project[]>(`/projects?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const allProjects = data ?? [];

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/projects/${id}?workspaceId=${activeWorkspaceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects(activeWorkspaceId ?? '') });
      toast.success('Proyecto eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
            <WorkspaceIcon name={row.original.emoji} className="h-4 w-4 shrink-0 text-muted-foreground" />
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
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-0.5">
            <IconAction icon={Pencil} label="Editar" onClick={() => setEditing(row.original)} />
            <IconAction
              icon={Trash2}
              label="Eliminar"
              destructive
              onClick={async () => {
                const ok = await confirm({
                  title: 'Eliminar proyecto',
                  description: `Se eliminará "${row.original.name}". Esta acción no se puede deshacer.`,
                  confirmLabel: 'Eliminar',
                  destructive: true,
                });
                if (ok) removeMutation.mutate(row.original.id);
              }}
            />
          </div>
        ),
      },
    ],
    [confirm, removeMutation],
  );

  return (
    <PageShell
      title="Proyectos"
      description="Proyectos de MIMOTECH"
      action={
        activeWorkspaceId && (
          <ProjectFormDialog
            workspaceId={activeWorkspaceId}
            onSaved={markNew}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuevo proyecto
              </Button>
            }
          />
        )
      }
    >
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
        rowClassName={(p) => highlightClass(p.id)}
        emptyState={<EmptyState title="Sin proyectos" description="Crea tu primer proyecto con el botón de arriba." />}
      />

      {activeWorkspaceId && editing && (
        <ProjectFormDialog
          workspaceId={activeWorkspaceId}
          project={editing}
          open={!!editing}
          onOpenChange={(next) => !next && setEditing(null)}
        />
      )}
    </PageShell>
  );
}

export default function ProyectosPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <ProyectosContent />
    </WorkspaceGate>
  );
}
