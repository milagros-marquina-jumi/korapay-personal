'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Ban, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { RefreshButton } from '@/components/data-table/refresh-button';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { RecurrenceFormDialog } from '@/components/forms/recurrence-form-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { IconAction, IconActions } from '@/components/ui/icon-action';
import { apiFetch } from '@/lib/api';
import type { RecurrenceRule } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  CANCELLED: 'Cancelada',
  FINISHED: 'Finalizada',
};

function frecuencia(rule: RecurrenceRule) {
  const base = FREQUENCY_LABELS[rule.frequency] ?? rule.frequency;
  return rule.interval > 1 ? `${base} ×${rule.interval}` : base;
}

function limite(rule: RecurrenceRule) {
  if (rule.endDate) return `Hasta ${formatDate(rule.endDate)}`;
  if (rule.endAfterCount) return `${rule.generatedCount}/${rule.endAfterCount} generados`;
  return 'Sin fecha de fin';
}

export default function RecurrentesPage() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const ws = activeWorkspaceId ?? '';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(FILTER_ALL);
  const [editing, setEditing] = useState<RecurrenceRule | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.recurrences(ws),
    queryFn: () => apiFetch<RecurrenceRule[]>(`/recurrences?workspaceId=${ws}`),
    enabled: !!ws,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.recurrences(ws) });
    queryClient.invalidateQueries({ queryKey: ['transactions', ws] });
  };

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/recurrences/${id}/cancel?workspaceId=${ws}`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      toast.success('Recurrencia cancelada. No se generarán más movimientos.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/recurrences/${id}/reactivate?workspaceId=${ws}`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      toast.success('Recurrencia reactivada');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/recurrences/${id}?workspaceId=${ws}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      toast.success('Recurrencia eliminada');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const todas = data ?? [];
    return status === FILTER_ALL ? todas : todas.filter((r) => r.status === status);
  }, [data, status]);

  const activas = (data ?? []).filter((r) => r.status === 'ACTIVE');
  const totalMensual = activas
    .filter((r) => r.frequency === 'MONTHLY')
    .reduce((sum, r) => sum + Number(r.amount ?? 0), 0);

  const columns = useMemo<ColumnDef<RecurrenceRule, unknown>[]>(
    () => [
      {
        accessorKey: 'concept',
        size: 240,
        minSize: 180,
        header: ({ column }) => <SortableHeader column={column} label="Concepto" />,
        cell: ({ row }) => (
          <span className="flex min-w-0 flex-col">
            <span className="min-w-0 truncate font-medium">{row.original.concept}</span>
            {row.original.category?.name && (
              <span className="truncate text-muted-foreground text-xs">{row.original.category.name}</span>
            )}
          </span>
        ),
      },
      {
        id: 'amount',
        size: 130,
        accessorFn: (r) => Number(r.amount ?? 0),
        header: ({ column }) => <SortableHeader column={column} label="Monto" className="ml-auto" />,
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums">
            {formatMoney(row.original.amount ?? '0', (row.original.currency as 'PEN' | 'USD') ?? 'PEN')}
          </div>
        ),
      },
      {
        id: 'frequency',
        size: 120,
        header: 'Frecuencia',
        cell: ({ row }) => <span className="whitespace-nowrap text-sm">{frecuencia(row.original)}</span>,
      },
      {
        id: 'next',
        size: 140,
        header: 'Próximo',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm tabular-nums">
            {row.original.nextRunAt ? formatDate(row.original.nextRunAt) : '—'}
          </span>
        ),
      },
      {
        id: 'limit',
        size: 160,
        header: 'Fin',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground text-xs">{limite(row.original)}</span>
        ),
      },
      {
        accessorKey: 'status',
        size: 120,
        header: 'Estado',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        size: 140,
        header: '',
        cell: ({ row }) => {
          const rule = row.original;
          return (
            <IconActions>
              <IconAction icon={Pencil} label="Editar" onClick={() => setEditing(rule)} />
              {rule.status === 'ACTIVE' ? (
                <IconAction
                  icon={Ban}
                  label="Cancelar"
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Cancelar recurrencia',
                      description: `Dejará de generar movimientos de "${rule.concept}". Los ya creados no se tocan.`,
                      confirmLabel: 'Cancelar recurrencia',
                    });
                    if (ok) cancelMutation.mutate(rule.id);
                  }}
                />
              ) : (
                <IconAction icon={Play} label="Reactivar" onClick={() => reactivateMutation.mutate(rule.id)} />
              )}
              <IconAction
                icon={Trash2}
                label="Eliminar"
                destructive
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Eliminar recurrencia',
                    description: `Se eliminará la plantilla de "${rule.concept}". Los movimientos ya generados se conservan.`,
                    confirmLabel: 'Eliminar',
                    destructive: true,
                  });
                  if (ok) removeMutation.mutate(rule.id);
                }}
              />
            </IconActions>
          );
        },
      },
    ],
    [confirm, cancelMutation, reactivateMutation, removeMutation],
  );

  return (
    <PageShell
      title="Pagos recurrentes"
      description="Suscripciones y pagos que se generan solos cada periodo"
      action={
        ws && (
          <div className="flex items-center gap-2">
            <RefreshButton workspaceId={ws} keys={[queryKeys.recurrences(ws), ['transactions', ws]]} />
            <RecurrenceFormDialog
              workspaceId={ws}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nueva recurrencia
                </Button>
              }
            />
          </div>
        )
      }
    >
      {activas.length > 0 && (
        <p className="text-muted-foreground text-sm">
          {activas.length} {activas.length === 1 ? 'recurrencia activa' : 'recurrencias activas'}
          {totalMensual > 0 && (
            <>
              {' · '}
              <span className="font-medium text-foreground">{formatMoney(String(totalMensual), 'PEN')}</span> al mes
            </>
          )}
        </p>
      )}

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar recurrencia..."
        showClear={search !== '' || status !== FILTER_ALL}
        onClear={() => {
          setSearch('');
          setStatus(FILTER_ALL);
        }}
        filters={
          <FilterSelect
            value={status}
            onValueChange={setStatus}
            options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            placeholder="Estado"
            allLabel="Todo estado"
          />
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        emptyState={
          <EmptyState
            title="Sin pagos recurrentes"
            description="Crea uno para que tus suscripciones se registren solas cada mes."
          />
        }
      />

      {ws && editing && (
        <RecurrenceFormDialog
          workspaceId={ws}
          rule={editing}
          open={!!editing}
          onOpenChange={(next) => !next && setEditing(null)}
        />
      )}
    </PageShell>
  );
}
