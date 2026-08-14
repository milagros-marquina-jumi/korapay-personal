'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard, StatusBadge, statusLabel } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, ChevronDown, ChevronRight, Clock, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { TaxStatusToggle } from '@/components/data-table/tax-status-toggle';
import { RentaDetailDialog } from '@/components/forms/renta-detail-dialog';
import { RentaInstallments } from '@/components/forms/renta-installments';
import { TaxObligationFormDialog } from '@/components/forms/tax-obligation-form-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { IconAction } from '@/components/ui/icon-action';
import { apiFetch } from '@/lib/api';
import type { TaxObligation } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { formatDate } from '@/lib/utils';

function RentaContent() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { markNew, highlightClass } = useHighlightNew();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(FILTER_ALL);
  const [editing, setEditing] = useState<TaxObligation | null>(null);
  const [detalle, setDetalle] = useState<TaxObligation | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.taxObligations(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<TaxObligation[]>(`/tax-obligations?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const allObligations = data ?? [];

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/tax-obligations/${id}?workspaceId=${activeWorkspaceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taxObligations(activeWorkspaceId ?? '') });
      toast.success('Obligación eliminada');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusOptions = useMemo(
    () =>
      [...new Set(allObligations.map((o) => o.status).filter(Boolean) as string[])].map((v) => ({
        value: v,
        label: statusLabel(v),
      })),
    [allObligations],
  );

  const obligations = useMemo(
    () => allObligations.filter((o) => status === FILTER_ALL || o.status === status),
    [allObligations, status],
  );

  const detalleVivo = detalle ? (allObligations.find((o) => o.id === detalle.id) ?? detalle) : null;

  const totalPendiente = obligations.filter((o) => o.status !== 'PAID').reduce((sum, o) => sum + Number(o.amount), 0);
  const totalPagado = obligations.filter((o) => o.status === 'PAID').reduce((sum, o) => sum + Number(o.amount), 0);

  const handleClear = () => {
    setSearch('');
    setStatus(FILTER_ALL);
  };

  const columns = useMemo<ColumnDef<TaxObligation, unknown>[]>(
    () => [
      {
        id: 'expander',
        header: '',
        size: 36,
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <button
              type="button"
              onClick={row.getToggleExpandedHandler()}
              className="flex size-6 items-center justify-center rounded hover:bg-muted"
              aria-label={row.getIsExpanded() ? 'Colapsar' : 'Expandir'}
            >
              {row.getIsExpanded() ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
          ) : null,
      },
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
        id: 'installments',
        header: 'Cuotas',
        cell: ({ row }) => {
          const t = row.original;
          const filas = t.installmentRows ?? [];
          const total = filas.length || t.installments || 0;
          if (!total) return <span className="text-muted-foreground text-sm">-</span>;
          const pagadas = filas.length ? filas.filter((r) => r.status === 'PAID').length : (t.paidInstallments ?? 0);
          return (
            <span className="text-sm tabular-nums">
              {pagadas} / {total}
            </span>
          );
        },
      },
      {
        id: 'amount',
        accessorFn: (r) => Number(r.amount),
        sortingFn: 'basic',
        header: ({ column }) => <SortableHeader column={column} label="Total a pagar" className="ml-auto" />,
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums">{formatMoney(row.original.amount, 'PEN')}</div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) =>
          activeWorkspaceId && !row.original.installments ? (
            <TaxStatusToggle
              obligationId={row.original.id}
              workspaceId={activeWorkspaceId}
              status={row.original.status}
            />
          ) : (
            <StatusBadge status={row.original.status} />
          ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-0.5">
            <IconAction icon={Eye} label="Ver detalle" onClick={() => setDetalle(row.original)} />
            <IconAction icon={Pencil} label="Editar" onClick={() => setEditing(row.original)} />
            <IconAction
              icon={Trash2}
              label="Eliminar"
              destructive
              onClick={async () => {
                const ok = await confirm({
                  title: 'Eliminar obligación',
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
    [activeWorkspaceId, confirm, removeMutation],
  );

  return (
    <PageShell
      title="Renta"
      description="Obligaciones tributarias y renta anual"
      action={
        activeWorkspaceId && (
          <TaxObligationFormDialog
            workspaceId={activeWorkspaceId}
            onSaved={markNew}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nueva obligación
              </Button>
            }
          />
        )
      }
    >
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
        rowClassName={(o) => highlightClass(o.id)}
        getRowCanExpand={(row) => (row.original.installmentRows?.length ?? 0) > 0 || !!row.original.installments}
        renderExpanded={(o) =>
          activeWorkspaceId ? <RentaInstallments workspaceId={activeWorkspaceId} obligation={o} /> : null
        }
        emptyState={
          <EmptyState title="Sin obligaciones" description="Crea tu primera obligación con el botón de arriba." />
        }
      />

      {activeWorkspaceId && editing && (
        <TaxObligationFormDialog
          workspaceId={activeWorkspaceId}
          obligation={editing}
          open={!!editing}
          onOpenChange={(next) => !next && setEditing(null)}
        />
      )}

      <RentaDetailDialog
        obligation={detalleVivo}
        workspaceId={activeWorkspaceId}
        onOpenChange={(next) => !next && setDetalle(null)}
      />
    </PageShell>
  );
}

export default function RentaPage() {
  return (
    <WorkspaceGate type="EMPLOYMENT">
      <RentaContent />
    </WorkspaceGate>
  );
}
