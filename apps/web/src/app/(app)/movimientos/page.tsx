'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge, statusLabel } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronDown, ChevronRight, Copy, CopyPlus, Eye, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { MonthAccordion } from '@/components/data-table/month-accordion';
import { MonthYearFilter } from '@/components/data-table/month-year-filter';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { StatusToggle } from '@/components/data-table/status-toggle';
import { DuplicateMonthDialog } from '@/components/forms/duplicate-month-dialog';
import { DuplicateTransactionDialog } from '@/components/forms/duplicate-transaction-dialog';
import { RecurrenceHistory } from '@/components/forms/recurrence-history';
import { TransactionFormDialog } from '@/components/forms/transaction-form-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { DueDateHint } from '@/components/transactions/due-date-hint';
import { TransactionDetailDialog, UsdConversionDialog } from '@/components/transactions/transaction-detail-dialog';
import { Button } from '@/components/ui/button';
import { IconAction, IconActions } from '@/components/ui/icon-action';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Category, Paginated, Transaction } from '@/lib/api.types';
import { MONTH_NAMES } from '@/lib/months';
import { queryKeys } from '@/lib/query-keys';
import { FIXED_TAG, isRentaInstallment, VARIABLE_TAG } from '@/lib/transaction-tags';
import { useDefaultYear } from '@/lib/use-default-year';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { useOpenMonth } from '@/lib/use-open-month';
import { formatDate } from '@/lib/utils';

export default function MovimientosPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>(FILTER_ALL);
  const [status, setStatus] = useState<string>(FILTER_ALL);
  const [categoryId, setCategoryId] = useState<string>(FILTER_ALL);
  const [month, setMonth] = useState<string>(FILTER_ALL);
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [usdDetail, setUsdDetail] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [duplicating, setDuplicating] = useState<Transaction | null>(null);
  const [duplicatingMonth, setDuplicatingMonth] = useState<{ year: number; month: number; count: number } | null>(null);
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

  const statusOptions = useMemo(() => {
    const distinct = [...new Set((data?.data ?? []).map((tx) => tx.status))];
    return distinct.map((value) => ({ value, label: statusLabel(value) }));
  }, [data?.data]);

  const categoryOptions = useMemo(() => (categories ?? []).map((c) => ({ value: c.id, label: c.name })), [categories]);

  const availableYears = useMemo(() => {
    const set = new Set((data?.data ?? []).map((tx) => new Date(tx.date).getUTCFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [data?.data]);

  const [year, setYear] = useDefaultYear(availableYears);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = (data?.data ?? []).filter((tx) => {
      if (type !== FILTER_ALL && tx.type !== type) return false;
      if (status !== FILTER_ALL && tx.status !== status) return false;
      if (categoryId !== FILTER_ALL && tx.categoryId !== categoryId) return false;
      const d = new Date(tx.date);
      if (year !== FILTER_ALL && d.getUTCFullYear() !== Number(year)) return false;
      if (month !== FILTER_ALL && d.getUTCMonth() + 1 !== Number(month)) return false;
      if (q) {
        const haystack = `${tx.concept} ${tx.category?.name ?? ''} ${tx.notes ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
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
  }, [data?.data, type, status, categoryId, year, month, search]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of rows) {
      if (tx.type === 'INCOME') income += Number(tx.amountBase);
      else expense += Number(tx.amountBase);
    }
    return { income, expense, net: income - expense };
  }, [rows]);

  const monthGroups = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; items: Transaction[]; income: number; expense: number }
    >();
    for (const tx of rows) {
      const d = new Date(tx.date);
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth() + 1;
      const key = `${y}-${m}`;
      let group = map.get(key);
      if (!group) {
        group = { key, label: `${MONTH_NAMES[m - 1]} ${y}`, items: [], income: 0, expense: 0 };
        map.set(key, group);
      }
      group.items.push(tx);
      if (tx.type === 'INCOME') group.income += Number(tx.amountBase);
      else group.expense += Number(tx.amountBase);
    }
    return [...map.values()]
      .map((g) => ({ ...g, net: g.income - g.expense }))
      .sort((a, b) => {
        const [ay = 0, am = 0] = a.key.split('-').map(Number);
        const [by = 0, bm = 0] = b.key.split('-').map(Number);
        return by - ay || bm - am;
      });
  }, [rows]);

  const accordionGroups = useMemo(
    () =>
      monthGroups.map((g) => ({
        key: g.key,
        label: g.label,
        items: g.items,
        metrics: [
          ...(g.income > 0
            ? [{ label: 'Ingresos', value: formatMoney(String(g.income), 'PEN'), className: 'text-success' }]
            : []),
          { label: 'Egresos', value: formatMoney(String(g.expense), 'PEN'), className: 'text-destructive' },
          { label: 'Neto', value: formatMoney(String(g.net), 'PEN') },
        ],
      })),
    [monthGroups],
  );

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
  }, []);

  const defaultMonthKey = monthGroups.some((g) => g.key === currentMonthKey)
    ? currentMonthKey
    : (monthGroups[0]?.key ?? null);

  const { isOpen: isMonthOpen, toggle: toggleMonth } = useOpenMonth('korapay.movimientos.openMonth', defaultMonthKey);

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
        size: 110,
        header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground text-sm tabular-nums">
            {formatDate(row.original.date)}
          </span>
        ),
      },
      {
        accessorKey: 'concept',
        size: 320,
        minSize: 220,
        header: ({ column }) => <SortableHeader column={column} label="Concepto" />,
        cell: ({ row }) => (
          <span className="flex min-w-0 items-center gap-1.5 font-medium">
            <span className="min-w-0 truncate" title={row.original.concept}>
              {row.original.concept}
            </span>
            {row.original.isRecurring && (
              <RefreshCw className="size-3.5 shrink-0 text-brand" aria-label="Pago recurrente" />
            )}
            {row.original.tags?.includes(FIXED_TAG) && (
              <span className="shrink-0 rounded bg-muted px-1 text-[10px] font-medium text-muted-foreground">Fijo</span>
            )}
            {row.original.tags?.includes(VARIABLE_TAG) && (
              <span className="shrink-0 rounded bg-muted px-1 text-[10px] font-medium text-muted-foreground">
                No fijo
              </span>
            )}
          </span>
        ),
      },
      {
        id: 'category',
        size: 152,
        header: 'Categoría',
        cell: ({ row }) => {
          const nombre = row.original.category?.name;
          if (!nombre) return <span className="text-muted-foreground/50">—</span>;
          return (
            <div className="flex min-w-0">
              <span className="min-w-0 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <span className="block truncate" title={nombre}>
                  {nombre}
                </span>
              </span>
            </div>
          );
        },
      },
      {
        id: 'amount',
        size: 160,
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
        size: 152,
        header: 'Estado',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 whitespace-nowrap">
            {activeWorkspaceId && !row.original.isRecurring ? (
              <StatusToggle
                transactionId={row.original.id}
                workspaceId={activeWorkspaceId}
                status={row.original.status}
              />
            ) : (
              <StatusBadge status={row.original.status} />
            )}
            <DueDateHint transaction={row.original} />
          </div>
        ),
      },
      {
        id: 'actions',
        size: 168,
        header: '',
        cell: ({ row }) => {
          const deRenta = isRentaInstallment(row.original.tags);
          return (
            <IconActions>
              <IconAction icon={Eye} label="Ver detalle" onClick={() => setDetail(row.original)} />
              <IconAction
                icon={Pencil}
                label={deRenta ? 'Se edita desde Renta anual' : 'Editar'}
                disabled={deRenta}
                onClick={() => setEditing(row.original)}
              />
              <IconAction icon={Copy} label="Copiar a otro mes" onClick={() => setDuplicating(row.original)} />
              <IconAction
                icon={Trash2}
                label={deRenta ? 'Se elimina desde Renta anual' : 'Eliminar'}
                destructive
                disabled={deRenta}
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
            </IconActions>
          );
        },
      },
    ],
    [removeMutation, confirm],
  );

  const categoryName = (id?: string | null) => categories?.find((c) => c.id === id)?.name ?? '—';

  return (
    <PageShell
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
    >
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

      {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}

      {!isLoading && monthGroups.length === 0 && (
        <EmptyState title="Sin movimientos" description="Crea tu primer movimiento con el botón de arriba." />
      )}

      {!isLoading && monthGroups.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-sm">
            <span className="text-muted-foreground">{rows.length} movimientos filtrados</span>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {totals.income > 0 && (
                <span className="text-muted-foreground">
                  Ingresos:{' '}
                  <span className="font-semibold tabular-nums text-success">
                    {formatMoney(String(totals.income), 'PEN')}
                  </span>
                </span>
              )}
              <span className="text-muted-foreground">
                Egresos:{' '}
                <span className="font-semibold tabular-nums text-destructive">
                  {formatMoney(String(totals.expense), 'PEN')}
                </span>
              </span>
              <span className="text-muted-foreground">
                Neto: <span className="font-semibold tabular-nums">{formatMoney(String(totals.net), 'PEN')}</span>
              </span>
            </div>
          </div>

          <MonthAccordion
            groups={accordionGroups}
            currentMonthKey={currentMonthKey}
            isOpen={isMonthOpen}
            onToggle={toggleMonth}
            countLabel={(n) => `${n} ${n === 1 ? 'movimiento' : 'movimientos'}`}
            headerAction={(group) => {
              const [gy = 0, gm = 1] = group.key.split('-').map(Number);
              return (
                <IconAction
                  icon={CopyPlus}
                  label="Copiar el mes completo"
                  onClick={() => setDuplicatingMonth({ year: gy, month: gm, count: group.items.length })}
                />
              );
            }}
          >
            {(group) => (
              <DataTable
                columns={columns}
                data={group.items}
                embedded
                rowClassName={(t) => highlightClass(t.id)}
                getRowCanExpand={(row) => !!row.original.isRecurring && !!row.original.recurrenceRule}
                renderExpanded={(t) =>
                  activeWorkspaceId && t.recurrenceRule ? (
                    <div className="px-4 py-3">
                      <RecurrenceHistory workspaceId={activeWorkspaceId} ruleId={t.recurrenceRule.id} />
                    </div>
                  ) : null
                }
              />
            )}
          </MonthAccordion>
        </>
      )}

      <TransactionDetailDialog
        transaction={detail}
        workspaceId={activeWorkspaceId}
        categoryName={categoryName}
        onOpenChange={(next) => !next && setDetail(null)}
      />

      <UsdConversionDialog transaction={usdDetail} onOpenChange={(next) => !next && setUsdDetail(null)} />

      {activeWorkspaceId && editing && (
        <TransactionFormDialog
          workspaceId={activeWorkspaceId}
          workspaceType={activeWorkspace?.type}
          transaction={editing}
          open={!!editing}
          onOpenChange={(next) => !next && setEditing(null)}
        />
      )}

      {activeWorkspaceId && (
        <DuplicateTransactionDialog
          workspaceId={activeWorkspaceId}
          transaction={duplicating}
          onOpenChange={(next) => !next && setDuplicating(null)}
          onDuplicated={markNew}
        />
      )}

      {activeWorkspaceId && (
        <DuplicateMonthDialog
          workspaceId={activeWorkspaceId}
          open={duplicatingMonth !== null}
          source={duplicatingMonth}
          onOpenChange={(next) => !next && setDuplicatingMonth(null)}
        />
      )}
    </PageShell>
  );
}
