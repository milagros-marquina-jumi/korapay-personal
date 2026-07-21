'use client';

import { formatMoney } from '@korapay/domain';
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
import { ContractFormDialog } from '@/components/forms/contract-form-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { IconAction } from '@/components/ui/icon-action';
import { apiFetch } from '@/lib/api';
import type { EmploymentContract } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { formatDate } from '@/lib/utils';

function formatDateOrActive(value?: string | null) {
  return value ? formatDate(value) : 'Actual';
}

function ContratosContent() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { markNew, highlightClass } = useHighlightNew();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(FILTER_ALL);
  const [type, setType] = useState(FILTER_ALL);
  const [currency, setCurrency] = useState(FILTER_ALL);
  const [editing, setEditing] = useState<EmploymentContract | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.employmentContracts(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<EmploymentContract[]>(`/employment-contracts?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/employment-contracts/${id}?workspaceId=${activeWorkspaceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employmentContracts(activeWorkspaceId ?? '') });
      toast.success('Contrato eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
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
                  title: 'Eliminar contrato',
                  description: `Se eliminará el contrato "${row.original.position ?? 'Contrato'}". Esta acción no se puede deshacer.`,
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
    <div className="space-y-6">
      <PageHeader
        title="Contratos"
        description="Tus contratos laborales"
        action={
          activeWorkspaceId && (
            <ContractFormDialog
              workspaceId={activeWorkspaceId}
              onSaved={markNew}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo contrato
                </Button>
              }
            />
          )
        }
      />

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
        rowClassName={(c) => highlightClass(c.id)}
        emptyState={
          <EmptyState title="Sin contratos" description="Registra tu primer contrato con el botón de arriba." />
        }
      />

      {activeWorkspaceId && editing && (
        <ContractFormDialog
          workspaceId={activeWorkspaceId}
          contract={editing}
          open={!!editing}
          onOpenChange={(next) => !next && setEditing(null)}
        />
      )}
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
