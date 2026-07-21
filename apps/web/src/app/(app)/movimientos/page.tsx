'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Copy, Eye, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { MonthYearFilter } from '@/components/data-table/month-year-filter';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { RecurrenceHistory } from '@/components/forms/recurrence-history';
import { TransactionFormDialog } from '@/components/forms/transaction-form-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IconAction } from '@/components/ui/icon-action';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Category, Paginated, Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { formatDate, formatDateLong, formatMonthYear } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  INCOME: 'Ingreso',
  EXPENSE: 'Egreso',
  SAVING: 'Ahorro',
  BUSINESS_COST: 'Costo',
  TEAM_PAYMENT: 'Pago equipo',
  TRANSFER: 'Transferencia',
};

const RECURRENCE_LABELS: Record<string, string> = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
};

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  OVERDUE: 'Vencido',
  PARTIAL: 'Parcial',
  CANCELLED: 'Cancelado',
  PENDING_REVIEW: 'Revisión',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
};

export default function MovimientosPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>(FILTER_ALL);
  const [status, setStatus] = useState<string>(FILTER_ALL);
  const [categoryId, setCategoryId] = useState<string>(FILTER_ALL);
  const [year, setYear] = useState<string>(FILTER_ALL);
  const [month, setMonth] = useState<string>(FILTER_ALL);
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [usdDetail, setUsdDetail] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const { markNew, highlightClass } = useHighlightNew();
  const isPersonalScope = activeWorkspace?.type === 'PERSONAL' || activeWorkspace?.type === 'SHARED';

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.transactions(activeWorkspaceId ?? '', { all: true }),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/transactions${buildQuery({
          workspaceId: activeWorkspaceId ?? '',
          page: 1,
          pageSize: 500,
          sortBy: 'date',
          sortOrder: 'desc',
        })}`,
      ),
    enabled: !!activeWorkspaceId,
  });

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Category[]>(`/categories?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions', activeWorkspaceId] });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(activeWorkspaceId ?? '') });
  };

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/transactions/${id}?workspaceId=${activeWorkspaceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      toast.success('Movimiento eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ id: string }>(`/transactions/${id}/duplicate?workspaceId=${activeWorkspaceId}`, { method: 'POST' }),
    onSuccess: (created) => {
      invalidate();
      if (created?.id) markNew(created.id);
      toast.success('Movimiento duplicado. Se agregó al inicio con estado pendiente.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusOptions = useMemo(() => {
    const distinct = [...new Set((data?.data ?? []).map((tx) => tx.status))];
    return distinct.map((value) => ({ value, label: STATUS_LABELS[value] ?? value }));
  }, [data?.data]);

  const categoryOptions = useMemo(() => (categories ?? []).map((c) => ({ value: c.id, label: c.name })), [categories]);

  const availableYears = useMemo(() => {
    const set = new Set((data?.data ?? []).map((tx) => new Date(tx.date).getUTCFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [data?.data]);

  const rows = useMemo(() => {
    const filtered = (data?.data ?? []).filter((tx) => {
      if (type !== FILTER_ALL && tx.type !== type) return false;
      if (status !== FILTER_ALL && tx.status !== status) return false;
      if (categoryId !== FILTER_ALL && tx.categoryId !== categoryId) return false;
      const d = new Date(tx.date);
      if (year !== FILTER_ALL && d.getUTCFullYear() !== Number(year)) return false;
      if (month !== FILTER_ALL && d.getUTCMonth() + 1 !== Number(month)) return false;
      return true;
    });
    const seenRules = new Set<string>();
    return filtered.filter((tx) => {
      const ruleId = tx.recurrenceRule?.id;
      if (!ruleId) return true;
      if (seenRules.has(ruleId)) return false;
      seenRules.add(ruleId);
      return true;
    });
  }, [data?.data, type, status, categoryId, year, month]);

  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(
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
        accessorKey: 'date',
        header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
        cell: ({ row }) => <span className="text-sm capitalize">{formatMonthYear(row.original.date)}</span>,
      },
      {
        accessorKey: 'concept',
        header: ({ column }) => <SortableHeader column={column} label="Concepto" />,
        cell: ({ row }) => (
          <span className="flex max-w-[22rem] items-center gap-1.5 font-medium">
            <span className="truncate" title={row.original.concept}>
              {row.original.concept}
            </span>
            {row.original.isRecurring && (
              <RefreshCw className="size-3.5 shrink-0 text-brand" aria-label="Pago recurrente" />
            )}
          </span>
        ),
      },
      {
        id: 'category',
        header: 'Categoría',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.category?.name ?? '-'}</span>,
      },
      {
        accessorKey: 'type',
        header: 'Tipo',
        cell: ({ row }) => <span className="text-sm">{TYPE_LABELS[row.original.type] ?? row.original.type}</span>,
      },
      {
        id: 'amount',
        accessorFn: (r) => Number(r.amountBase),
        sortingFn: 'basic',
        header: ({ column }) => <SortableHeader column={column} label="Monto" className="ml-auto" />,
        cell: ({ row }) => {
          const tx = row.original;
          const sign = tx.type === 'INCOME' ? '+' : '-';
          const colorClass = tx.type === 'INCOME' ? 'text-success' : 'text-destructive';
          const soles = (
            <span className={`font-semibold tabular-nums ${colorClass}`}>
              {sign}
              {formatMoney(tx.amountBase, 'PEN')}
            </span>
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
            <IconAction icon={Eye} label="Ver detalle" onClick={() => setDetail(row.original)} />
            <IconAction icon={Pencil} label="Editar" onClick={() => setEditing(row.original)} />
            <IconAction icon={Copy} label="Duplicar" onClick={() => duplicateMutation.mutate(row.original.id)} />
            <IconAction
              icon={Trash2}
              label="Eliminar"
              destructive
              onClick={async () => {
                const shortConcept =
                  row.original.concept.length > 60 ? `${row.original.concept.slice(0, 60)}…` : row.original.concept;
                const ok = await confirm({
                  title: 'Eliminar movimiento',
                  description: `Se eliminará "${shortConcept}". Esta acción no se puede deshacer.`,
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
    [duplicateMutation, removeMutation, confirm],
  );

  const categoryName = (id?: string | null) => categories?.find((c) => c.id === id)?.name ?? '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos"
        description="Todos tus ingresos y egresos"
        action={
          activeWorkspaceId && (
            <TransactionFormDialog
              workspaceId={activeWorkspaceId}
              workspaceType={activeWorkspace?.type}
              defaultType="EXPENSE"
              onCreated={markNew}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo movimiento
                </Button>
              }
            />
          )
        }
      />

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar movimientos..."
        showClear={
          search !== '' ||
          type !== FILTER_ALL ||
          status !== FILTER_ALL ||
          categoryId !== FILTER_ALL ||
          year !== FILTER_ALL ||
          month !== FILTER_ALL
        }
        onClear={() => {
          setSearch('');
          setType(FILTER_ALL);
          setStatus(FILTER_ALL);
          setCategoryId(FILTER_ALL);
          setYear(FILTER_ALL);
          setMonth(FILTER_ALL);
        }}
        filters={
          <>
            <MonthYearFilter
              year={year}
              month={month}
              onYearChange={setYear}
              onMonthChange={setMonth}
              years={availableYears}
            />
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL}>Todos los tipos</SelectItem>
                <SelectItem value="INCOME">Ingresos</SelectItem>
                <SelectItem value="EXPENSE">Egresos</SelectItem>
                {!isPersonalScope && (
                  <>
                    <SelectItem value="SAVING">Ahorros</SelectItem>
                    <SelectItem value="BUSINESS_COST">Costos</SelectItem>
                    <SelectItem value="TEAM_PAYMENT">Pagos equipo</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <FilterSelect
              value={status}
              onValueChange={setStatus}
              options={statusOptions}
              placeholder="Estado"
              allLabel="Todo estado"
            />
            <FilterSelect
              value={categoryId}
              onValueChange={setCategoryId}
              options={categoryOptions}
              placeholder="Categoría"
              allLabel="Toda categoría"
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
        rowClassName={(t) => highlightClass(t.id)}
        getRowCanExpand={(row) => !!row.original.isRecurring && !!row.original.recurrenceRule}
        renderExpanded={(t) =>
          activeWorkspaceId && t.recurrenceRule ? (
            <div className="px-4 py-3">
              <RecurrenceHistory workspaceId={activeWorkspaceId} ruleId={t.recurrenceRule.id} />
            </div>
          ) : null
        }
        emptyState={
          <EmptyState title="Sin movimientos" description="Crea tu primer movimiento con el botón de arriba." />
        }
      />

      <Dialog open={detail !== null} onOpenChange={(next) => !next && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.concept}</DialogTitle>
            <DialogDescription>Detalle del movimiento</DialogDescription>
          </DialogHeader>
          {detail && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <DetailRow label="Fecha" value={formatDateLong(detail.date)} />
              <DetailRow label="Tipo" value={TYPE_LABELS[detail.type] ?? detail.type} />
              <DetailRow
                label="Monto"
                value={
                  detail.currency === 'USD'
                    ? `${formatMoney(detail.amountBase, 'PEN')} (${formatMoney(detail.amountOriginal, 'USD')})`
                    : formatMoney(detail.amountBase, 'PEN')
                }
              />
              <DetailRow label="Estado" value={STATUS_LABELS[detail.status] ?? detail.status} />
              <DetailRow label="Categoría" value={categoryName(detail.categoryId)} />
              <DetailRow label="Cuenta" value={detail.account?.name ?? '—'} />
              <DetailRow label="Vencimiento" value={detail.dueDate ? formatDateLong(detail.dueDate) : '—'} />
              <DetailRow
                label="Recurrencia"
                value={detail.isRecurring ? (RECURRENCE_LABELS[detail.recurrenceRule?.frequency ?? ''] ?? 'Sí') : 'No'}
              />
              {detail.isRecurring && detail.recurrenceRule && activeWorkspaceId && (
                <RecurrenceHistory workspaceId={activeWorkspaceId} ruleId={detail.recurrenceRule.id} />
              )}
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Notas</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{detail.notes || detail.description || '—'}</dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={usdDetail !== null} onOpenChange={(next) => !next && setUsdDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conversión a soles</DialogTitle>
            <DialogDescription>{usdDetail?.concept}</DialogDescription>
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

      {activeWorkspaceId && editing && (
        <TransactionFormDialog
          workspaceId={activeWorkspaceId}
          workspaceType={activeWorkspace?.type}
          transaction={editing}
          open={!!editing}
          onOpenChange={(next) => !next && setEditing(null)}
        />
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums">{value}</dd>
    </div>
  );
}
