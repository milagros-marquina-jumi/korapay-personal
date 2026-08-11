'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { MonthYearFilter } from '@/components/data-table/month-year-filter';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { StatusToggle } from '@/components/data-table/status-toggle';
import { TransactionFormDialog } from '@/components/forms/transaction-form-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { IconAction } from '@/components/ui/icon-action';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Company, Paginated, Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useDefaultYear } from '@/lib/use-default-year';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { formatMonthYear } from '@/lib/utils';

const PAYMENT_TYPES = new Set(['Planilla', 'RxH', 'Transferencia', 'Recibo por honorarios']);

interface MonthSummary {
  key: string;
  net: number;
  gross: number;
  count: number;
  paid: number;
}

function bankFromTags(tags: string[]): string | null {
  return tags.find((t) => !PAYMENT_TYPES.has(t)) ?? null;
}

function paymentTypeFromTags(tags: string[]): string | null {
  return tags.find((t) => PAYMENT_TYPES.has(t)) ?? null;
}

function accountNumber(notes?: string | null): string | null {
  if (!notes) return null;
  const labeled =
    /n[úu]mero de cuenta\s*:\s*([\d][\d\s-]*)/i.exec(notes) ?? /cuenta[^:]*:\s*([\d][\d\s-]*)/i.exec(notes);
  if (labeled?.[1]) return labeled[1].trim();
  const bare = /[\d][\d\s-]{6,}/.exec(notes);
  return bare?.[0]?.trim() ?? notes.trim() ?? null;
}

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  OVERDUE: 'Vencido',
  PARTIAL: 'Parcial',
  CANCELLED: 'Cancelado',
  PENDING_REVIEW: 'Revisión',
};

function IngresosContent() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { markNew, highlightClass } = useHighlightNew();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(FILTER_ALL);
  const [companyId, setCompanyId] = useState<string>(FILTER_ALL);
  const [bank, setBank] = useState<string>(FILTER_ALL);
  const [month, setMonth] = useState<string>(FILTER_ALL);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.transactions(activeWorkspaceId ?? '', { type: 'INCOME', all: true }),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/transactions${buildQuery({
          workspaceId: activeWorkspaceId ?? '',
          type: 'INCOME',
          page: 1,
          pageSize: 500,
          sortBy: 'date',
          sortOrder: 'desc',
        })}`,
      ),
    enabled: !!activeWorkspaceId,
  });

  const { data: companies } = useQuery({
    queryKey: queryKeys.companies(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Company[]>(`/companies?workspaceId=${activeWorkspaceId}`),
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
      toast.success('Ingreso eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusOptions = useMemo(() => {
    const distinct = [...new Set((data?.data ?? []).map((tx) => tx.status))];
    return distinct.map((value) => ({ value, label: STATUS_LABELS[value] ?? value }));
  }, [data?.data]);

  const companyOptions = useMemo(() => (companies ?? []).map((c) => ({ value: c.id, label: c.name })), [companies]);

  const bankOptions = useMemo(() => {
    const set = new Set((data?.data ?? []).map((tx) => bankFromTags(tx.tags)).filter(Boolean) as string[]);
    return [...set].sort((a, b) => a.localeCompare(b, 'es')).map((value) => ({ value, label: value }));
  }, [data?.data]);

  const availableYears = useMemo(() => {
    const set = new Set((data?.data ?? []).map((tx) => new Date(tx.date).getUTCFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [data?.data]);

  const [year, setYear] = useDefaultYear(availableYears);

  const companyName = (id?: string | null) => companies?.find((c) => c.id === id)?.name;

  const grossOf = (tx: Transaction) => Number(tx.amountGross ?? tx.amountBase);

  const selectMonth = (key: string) => {
    const [y, m] = key.split('-');
    if (!y || !m) return;
    setYear(y);
    setMonth(String(Number(m)));
  };

  const rows = useMemo(() => {
    return (data?.data ?? []).filter((tx) => {
      if (status !== FILTER_ALL && tx.status !== status) return false;
      if (companyId !== FILTER_ALL && tx.companyId !== companyId) return false;
      if (bank !== FILTER_ALL && bankFromTags(tx.tags) !== bank) return false;
      const d = new Date(tx.date);
      if (year !== FILTER_ALL && d.getUTCFullYear() !== Number(year)) return false;
      if (month !== FILTER_ALL && d.getUTCMonth() + 1 !== Number(month)) return false;
      return true;
    });
  }, [data?.data, status, companyId, bank, year, month]);

  const total = useMemo(() => rows.reduce((sum, tx) => sum + Number(tx.amountBase), 0), [rows]);
  const totalGross = useMemo(() => rows.reduce((sum, tx) => sum + grossOf(tx), 0), [rows]);
  const totalAll = useMemo(() => (data?.data ?? []).reduce((sum, tx) => sum + Number(tx.amountBase), 0), [data?.data]);

  const monthlyBreakdown = useMemo(() => {
    const map = new Map<string, MonthSummary>();
    for (const tx of rows) {
      const d = new Date(tx.date);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const entry = map.get(key) ?? { key, net: 0, gross: 0, count: 0, paid: 0 };
      entry.net += Number(tx.amountBase);
      entry.gross += grossOf(tx);
      entry.count += 1;
      if (tx.status === 'PAID') entry.paid += 1;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.key.localeCompare(a.key));
  }, [rows]);

  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
        cell: ({ row }) => <span className="text-sm capitalize">{formatMonthYear(row.original.date)}</span>,
      },
      {
        accessorKey: 'concept',
        header: ({ column }) => <SortableHeader column={column} label="Concepto" />,
        cell: ({ row }) => (
          <span className="block max-w-[20rem] truncate font-medium" title={row.original.concept}>
            {row.original.concept}
          </span>
        ),
      },
      {
        id: 'company',
        header: 'Empresa',
        cell: ({ row }) => {
          const payment = paymentTypeFromTags(row.original.tags);
          return (
            <div className="flex flex-col">
              <span>{companyName(row.original.companyId) ?? row.original.category?.name ?? '-'}</span>
              {payment && <span className="text-xs text-muted-foreground">{payment}</span>}
            </div>
          );
        },
      },
      {
        id: 'bank',
        header: 'Banco',
        cell: ({ row }) => {
          const bank = bankFromTags(row.original.tags);
          const account = accountNumber(row.original.notes);
          if (!bank && !account) return <span className="text-muted-foreground">-</span>;
          return (
            <div className="flex flex-col" title={row.original.notes ?? undefined}>
              <span className="text-sm">{bank ?? '-'}</span>
              {account && (
                <span className="max-w-[11rem] truncate text-xs tabular-nums text-muted-foreground">{account}</span>
              )}
            </div>
          );
        },
      },
      {
        id: 'amountGross',
        accessorFn: (r) => Number(r.amountGross ?? r.amountBase),
        sortingFn: 'basic',
        header: ({ column }) => <SortableHeader column={column} label="Bruto" className="ml-auto" />,
        cell: ({ row }) => {
          const gross = grossOf(row.original);
          const discount = gross - Number(row.original.amountBase);
          return (
            <div className="flex flex-col items-end">
              <span className="tabular-nums text-muted-foreground">{formatMoney(String(gross), 'PEN')}</span>
              {discount > 0.005 && (
                <span className="text-xs tabular-nums text-muted-foreground/70">
                  -{formatMoney(String(discount), 'PEN')}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'amount',
        accessorFn: (r) => Number(r.amountBase),
        sortingFn: 'basic',
        header: ({ column }) => <SortableHeader column={column} label="Neto" className="ml-auto" />,
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums text-success">
            +{formatMoney(row.original.amountBase, 'PEN')}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) =>
          activeWorkspaceId ? (
            <StatusToggle
              transactionId={row.original.id}
              workspaceId={activeWorkspaceId}
              status={row.original.status}
            />
          ) : null,
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
                  title: 'Eliminar ingreso',
                  description: `Se eliminará "${row.original.concept.slice(0, 60)}". Esta acción no se puede deshacer.`,
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
    [activeWorkspaceId, companies, confirm, removeMutation],
  );

  return (
    <PageShell
      title="Ingresos"
      description="Ingresos por trabajos y empleos"
      action={
        activeWorkspaceId && (
          <TransactionFormDialog
            workspaceId={activeWorkspaceId}
            workspaceType={activeWorkspace?.type}
            defaultType="INCOME"
            onCreated={markNew}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuevo ingreso
              </Button>
            }
          />
        )
      }
    >
      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar ingresos..."
        showClear={
          search !== '' ||
          status !== FILTER_ALL ||
          companyId !== FILTER_ALL ||
          bank !== FILTER_ALL ||
          year !== FILTER_ALL ||
          month !== FILTER_ALL
        }
        onClear={() => {
          setSearch('');
          setStatus(FILTER_ALL);
          setCompanyId(FILTER_ALL);
          setBank(FILTER_ALL);
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
            <FilterSelect
              value={status}
              onValueChange={setStatus}
              options={statusOptions}
              placeholder="Estado"
              allLabel="Todo estado"
            />
            <FilterSelect
              value={companyId}
              onValueChange={setCompanyId}
              options={companyOptions}
              placeholder="Empresa"
              allLabel="Toda empresa"
            />
            <FilterSelect
              value={bank}
              onValueChange={setBank}
              options={bankOptions}
              placeholder="Banco"
              allLabel="Todo banco"
            />
          </>
        }
      />

      {monthlyBreakdown.length > 1 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {monthlyBreakdown.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => selectMonth(m.key)}
              className="rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:border-brand hover:bg-sidebar-accent"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium capitalize text-muted-foreground">
                  {formatMonthYear(`${m.key}-01T00:00:00.000Z`)}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {m.paid}/{m.count} pagado{m.count === 1 ? '' : 's'}
                </span>
              </div>
              <div className="mt-1 font-semibold tabular-nums text-success">{formatMoney(String(m.net), 'PEN')}</div>
              {m.gross > 0 && (
                <div className="text-xs tabular-nums text-muted-foreground">
                  Bruto {formatMoney(String(m.gross), 'PEN')}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        rowClassName={(t) => highlightClass(t.id)}
        footer={
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {rows.length} de {data?.data.length ?? 0} ingresos
            </span>
            <div className="flex gap-6">
              {totalGross > 0 && (
                <span className="text-muted-foreground">
                  Total bruto:{' '}
                  <span className="font-semibold tabular-nums">{formatMoney(String(totalGross), 'PEN')}</span>
                </span>
              )}
              <span className="text-muted-foreground">
                Total neto:{' '}
                <span className="font-semibold tabular-nums text-success">{formatMoney(String(total), 'PEN')}</span>
              </span>
              <span className="text-muted-foreground">
                Total general:{' '}
                <span className="font-semibold tabular-nums">{formatMoney(String(totalAll), 'PEN')}</span>
              </span>
            </div>
          </div>
        }
        emptyState={
          <EmptyState title="Sin ingresos" description="Registra tu primer ingreso con el botón de arriba." />
        }
      />

      {activeWorkspaceId && editing && (
        <TransactionFormDialog
          workspaceId={activeWorkspaceId}
          workspaceType={activeWorkspace?.type}
          defaultType="INCOME"
          transaction={editing}
          open={!!editing}
          onOpenChange={(next) => !next && setEditing(null)}
        />
      )}
    </PageShell>
  );
}

export default function IngresosPage() {
  return (
    <WorkspaceGate type="EMPLOYMENT">
      <IngresosContent />
    </WorkspaceGate>
  );
}
