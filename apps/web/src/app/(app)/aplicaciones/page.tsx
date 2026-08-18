'use client';

import { EmptyState } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { ApplicationFormDialog } from '@/components/forms/application-form-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { IconAction, IconActions } from '@/components/ui/icon-action';
import { apiFetch } from '@/lib/api';
import type { Application } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useHighlightNew } from '@/lib/use-highlight-new';

function AplicacionesContent() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { markNew, highlightClass } = useHighlightNew();
  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState(FILTER_ALL);
  const [editing, setEditing] = useState<Application | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.applications(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Application[]>(`/applications?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const allApplications = data ?? [];

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/applications/${id}?workspaceId=${activeWorkspaceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications(activeWorkspaceId ?? '') });
      toast.success('Aplicación eliminada');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const providerOptions = useMemo(
    () =>
      [...new Set(allApplications.map((a) => a.provider).filter(Boolean) as string[])].map((v) => ({
        value: v,
        label: v,
      })),
    [allApplications],
  );

  const applications = useMemo(
    () => allApplications.filter((a) => provider === FILTER_ALL || a.provider === provider),
    [allApplications, provider],
  );

  const handleClear = () => {
    setSearch('');
    setProvider(FILTER_ALL);
  };

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
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <IconActions>
            <IconAction icon={Pencil} label="Editar" onClick={() => setEditing(row.original)} />
            <IconAction
              icon={Trash2}
              label="Eliminar"
              destructive
              onClick={async () => {
                const ok = await confirm({
                  title: 'Eliminar aplicación',
                  description: `Se eliminará "${row.original.name}". Esta acción no se puede deshacer.`,
                  confirmLabel: 'Eliminar',
                  destructive: true,
                });
                if (ok) removeMutation.mutate(row.original.id);
              }}
            />
          </IconActions>
        ),
      },
    ],
    [confirm, removeMutation],
  );

  return (
    <PageShell
      title="Aplicaciones"
      description="Aplicaciones y servicios de MIMOTECH"
      action={
        activeWorkspaceId && (
          <ApplicationFormDialog
            workspaceId={activeWorkspaceId}
            onSaved={markNew}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nueva aplicación
              </Button>
            }
          />
        )
      }
    >
      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar aplicaciones..."
        showClear={search !== '' || provider !== FILTER_ALL}
        onClear={handleClear}
        filters={
          providerOptions.length > 0 ? (
            <FilterSelect
              value={provider}
              onValueChange={setProvider}
              options={providerOptions}
              placeholder="Proveedor"
              allLabel="Todo proveedor"
            />
          ) : null
        }
      />

      <DataTable
        columns={columns}
        data={applications}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        rowClassName={(a) => highlightClass(a.id)}
        emptyState={
          <EmptyState title="Sin aplicaciones" description="Crea tu primera aplicación con el botón de arriba." />
        }
      />

      {activeWorkspaceId && editing && (
        <ApplicationFormDialog
          workspaceId={activeWorkspaceId}
          application={editing}
          open={!!editing}
          onOpenChange={(next) => !next && setEditing(null)}
        />
      )}
    </PageShell>
  );
}

export default function AplicacionesPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <AplicacionesContent />
    </WorkspaceGate>
  );
}
