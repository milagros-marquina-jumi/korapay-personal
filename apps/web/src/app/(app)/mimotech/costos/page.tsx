'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard, StatusBadge } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Server, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { TransactionFormDialog } from '@/components/forms/transaction-form-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IconAction } from '@/components/ui/icon-action';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Application, Paginated, Project, Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  OVERDUE: 'Vencido',
  PARTIAL: 'Parcial',
  CANCELLED: 'Cancelado',
  PENDING_REVIEW: 'Revisión',
};

function CostosContent() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const ws = activeWorkspaceId ?? '';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(FILTER_ALL);
  const [applicationId, setApplicationId] = useState<string>(FILTER_ALL);
  const [projectId, setProjectId] = useState<string>(FILTER_ALL);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [usdDetail, setUsdDetail] = useState<Transaction | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.transactions(ws, { type: 'BUSINESS_COST', all: true }),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/transactions${buildQuery({
          workspaceId: ws,
          type: 'BUSINESS_COST',
          page: 1,
          pageSize: 500,
          sortBy: 'date',
          sortOrder: 'desc',
        })}`,
      ),
    enabled: !!ws,
  });

  const { data: applications } = useQuery({
    queryKey: queryKeys.applications(ws),
    queryFn: () => apiFetch<Application[]>(`/applications?workspaceId=${ws}`),
    enabled: !!ws,
  });

  const { data: projects } = useQuery({
    queryKey: queryKeys.projects(ws),
    queryFn: () => apiFetch<Project[]>(`/projects?workspaceId=${ws}`),
    enabled: !!ws,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/transactions/${id}?workspaceId=${ws}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', ws] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(ws) });
    },
  });

  const statusOptions = useMemo(() => {
    const distinct = [...new Set((data?.data ?? []).map((tx) => tx.status))];
    return distinct.map((value) => ({ value, label: STATUS_LABELS[value] ?? value }));
  }, [data?.data]);

  const applicationOptions = useMemo(
    () => (applications ?? []).map((a) => ({ value: a.id, label: a.name })),
    [applications],
  );
  const projectOptions = useMemo(() => (projects ?? []).map((p) => ({ value: p.id, label: p.name })), [projects]);

  const rows = useMemo(() => {
    return (data?.data ?? []).filter((tx) => {
      if (status !== FILTER_ALL && tx.status !== status) return false;
      if (applicationId !== FILTER_ALL && tx.applicationId !== applicationId) return false;
      if (projectId !== FILTER_ALL && !(tx.projects ?? []).some((p) => p.id === projectId)) return false;
      return true;
    });
  }, [data?.data, status, applicationId, projectId]);

  const totalCostos = rows.reduce((sum, tx) => sum + Number(tx.amountBase), 0);
  const appName = (id?: string | null) => applications?.find((a) => a.id === id)?.name;

  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.date)}</span>,
      },
      {
        accessorKey: 'concept',
        header: ({ column }) => <SortableHeader column={column} label="Aplicación" />,
        cell: ({ row }) => (
          <span className="font-medium">{appName(row.original.applicationId) ?? row.original.concept}</span>
        ),
      },
      {
        id: 'projects',
        header: 'Proyecto(s)',
        cell: ({ row }) => {
          const names = (row.original.projects ?? []).map((p) => p.name);
          if (!names.length) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex max-w-[16rem] flex-wrap gap-1">
              {names.map((n) => (
                <span key={n} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {n}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        id: 'bank',
        header: 'Banco',
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.tags?.[0] ?? '—'}</span>,
      },
      {
        id: 'amount',
        accessorFn: (r) => Number(r.amountBase),
        sortingFn: 'basic',
        header: ({ column }) => <SortableHeader column={column} label="Monto (S/)" className="ml-auto" />,
        cell: ({ row }) => {
          const tx = row.original;
          const soles = (
            <span className="font-semibold tabular-nums text-destructive">{formatMoney(tx.amountBase, 'PEN')}</span>
          );
          if (tx.currency === 'USD') {
            return (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setUsdDetail(tx)}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted"
                  title="Ver conversión en dólares"
                >
                  {soles}
                  <span className="rounded bg-brand/10 px-1 text-[10px] font-medium text-brand">USD</span>
                </button>
              </div>
            );
          }
          return <div className="text-right">{soles}</div>;
        },
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
                  title: 'Eliminar costo',
                  description: `Se eliminará "${appName(row.original.applicationId) ?? row.original.concept}". Esta acción no se puede deshacer.`,
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
    [confirm, removeMutation, applications],
  );

  return (
    <PageShell
      title="Costos de infraestructura"
      description="Costos de aplicaciones y servicios de MIMOTECH"
      action={
        ws && (
          <TransactionFormDialog
            workspaceId={ws}
            defaultType="BUSINESS_COST"
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuevo costo
              </Button>
            }
          />
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          label="Total costos"
          value={formatMoney(String(totalCostos), 'PEN')}
          icon={Server}
          color="text-destructive"
        />
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar costos..."
        showClear={search !== '' || status !== FILTER_ALL || applicationId !== FILTER_ALL || projectId !== FILTER_ALL}
        onClear={() => {
          setSearch('');
          setStatus(FILTER_ALL);
          setApplicationId(FILTER_ALL);
          setProjectId(FILTER_ALL);
        }}
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
              value={applicationId}
              onValueChange={setApplicationId}
              options={applicationOptions}
              placeholder="Aplicación"
              allLabel="Toda app"
            />
            <FilterSelect
              value={projectId}
              onValueChange={setProjectId}
              options={projectOptions}
              placeholder="Proyecto"
              allLabel="Todo proyecto"
            />
          </>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        emptyState={<EmptyState title="Sin costos" description="Registra tu primer costo con el botón de arriba." />}
      />

      <Dialog open={usdDetail !== null} onOpenChange={(next) => !next && setUsdDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conversión a soles</DialogTitle>
            <DialogDescription>
              {usdDetail ? (appName(usdDetail.applicationId) ?? usdDetail.concept) : ''}
            </DialogDescription>
          </DialogHeader>
          {usdDetail && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monto en dólares</span>
                <span className="font-semibold tabular-nums">{formatMoney(usdDetail.amountOriginal, 'USD')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tipo de cambio del {formatDate(usdDetail.date)}</span>
                <span className="font-medium tabular-nums">S/ {Number(usdDetail.exchangeRate ?? 0).toFixed(3)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-medium">Total en soles</span>
                <span className="font-semibold tabular-nums text-brand">
                  {formatMoney(usdDetail.amountBase, 'PEN')}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {ws && editing && (
        <TransactionFormDialog
          workspaceId={ws}
          defaultType="BUSINESS_COST"
          transaction={editing}
          open={!!editing}
          onOpenChange={(next) => !next && setEditing(null)}
        />
      )}
    </PageShell>
  );
}

export default function CostosPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <CostosContent />
    </WorkspaceGate>
  );
}
