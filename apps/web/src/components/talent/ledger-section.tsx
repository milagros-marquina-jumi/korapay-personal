'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard, StatusBadge } from '@korapay/ui';
import type { ColumnDef } from '@tanstack/react-table';
import { Banknote, Pencil, PiggyBank, Trash2, TrendingDown, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { MonthYearFilter } from '@/components/data-table/month-year-filter';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { IconAction } from '@/components/ui/icon-action';
import type { TalentLedgerEntry, TalentSummaryTotals } from '@/lib/api.types';
import { formatDate } from '@/lib/utils';
import { LedgerFormDialog, type LedgerFormValues } from './ledger-form-dialog';

const TYPE_LABELS: Record<string, string> = { EGRESO: 'Egreso', DEUDA: 'Deuda' };
const STATUS_LABELS: Record<string, string> = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
  NUNCA_PAGO: 'Nunca pagó',
};
const CATEGORY_LABELS: Record<string, string> = {
  EDUCACION: 'Educación',
  SUSCRIPCION: 'Suscripción',
  TRABAJO: 'Trabajo',
  ALQUILER: 'Alquiler',
  PRESTAMO: 'Préstamo',
  MOBILIARIO: 'Mobiliario',
  EQUIPO: 'Equipo',
  TRANSPORTE: 'Transporte',
  COMIDA: 'Comida',
  FRAUDE: 'Fraude',
  OTRO: 'Otro',
};

interface LedgerSectionProps {
  entries: TalentLedgerEntry[];
  summary?: TalentSummaryTotals;
  isLoading?: boolean;
  currency?: string;
  canDelete?: boolean;
  onCreate: (values: LedgerFormValues) => Promise<void>;
  onUpdate: (id: string, values: LedgerFormValues) => Promise<void>;
  onDelete?: (id: string) => void;
  isMutating?: boolean;
}

export function LedgerSection({
  entries,
  summary,
  isLoading,
  currency = 'PEN',
  canDelete = true,
  onCreate,
  onUpdate,
  onDelete,
  isMutating,
}: LedgerSectionProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(FILTER_ALL);
  const [type, setType] = useState(FILTER_ALL);
  const [category, setCategory] = useState(FILTER_ALL);
  const [year, setYear] = useState(FILTER_ALL);
  const [month, setMonth] = useState(FILTER_ALL);
  const [editing, setEditing] = useState<TalentLedgerEntry | null>(null);

  const cur = currency as 'PEN' | 'USD';
  const statusOptions = useMemo(
    () => [...new Set(entries.map((e) => e.status))].map((v) => ({ value: v, label: STATUS_LABELS[v] ?? v })),
    [entries],
  );
  const categoryOptions = useMemo(
    () =>
      [...new Set(entries.map((e) => e.category ?? '').filter(Boolean))].map((v) => ({
        value: v,
        label: CATEGORY_LABELS[v] ?? v,
      })),
    [entries],
  );
  const availableYears = useMemo(() => [...new Set(entries.map((e) => e.year))].sort((a, b) => b - a), [entries]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (!q || (e.description ?? '').toLowerCase().includes(q)) &&
        (status === FILTER_ALL || e.status === status) &&
        (type === FILTER_ALL || e.type === type) &&
        (category === FILTER_ALL || (e.category ?? '') === category) &&
        (year === FILTER_ALL || String(e.year) === year) &&
        (month === FILTER_ALL || String(e.month) === month),
    );
  }, [entries, search, status, type, category, year, month]);

  const hasFilters =
    search !== '' ||
    status !== FILTER_ALL ||
    type !== FILTER_ALL ||
    category !== FILTER_ALL ||
    year !== FILTER_ALL ||
    month !== FILTER_ALL;
  const clear = () => {
    setSearch('');
    setStatus(FILTER_ALL);
    setType(FILTER_ALL);
    setCategory(FILTER_ALL);
    setYear(FILTER_ALL);
    setMonth(FILTER_ALL);
  };

  const columns = useMemo<ColumnDef<TalentLedgerEntry, unknown>[]>(() => {
    const base: ColumnDef<TalentLedgerEntry, unknown>[] = [
      {
        accessorKey: 'date',
        header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.date)}</span>,
      },
      {
        accessorKey: 'type',
        header: 'Tipo',
        cell: ({ row }) => <span className="text-sm">{TYPE_LABELS[row.original.type] ?? row.original.type}</span>,
      },
      {
        accessorKey: 'category',
        header: 'Categoría',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.category ? (CATEGORY_LABELS[row.original.category] ?? row.original.category) : '—'}
          </span>
        ),
      },
      {
        id: 'paid',
        accessorFn: (r) => Number(r.paidAmount),
        header: ({ column }) => <SortableHeader column={column} label="Pagado" className="ml-auto" />,
        cell: ({ row }) => <div className="text-right tabular-nums">{formatMoney(row.original.paidAmount, cur)}</div>,
      },
      {
        id: 'debt',
        accessorFn: (r) => Number(r.debtAmount),
        header: ({ column }) => <SortableHeader column={column} label="Deuda" className="ml-auto" />,
        cell: ({ row }) => <div className="text-right tabular-nums">{formatMoney(row.original.debtAmount, cur)}</div>,
      },
      {
        id: 'pending',
        accessorFn: (r) => Number(r.pendingAmount),
        header: ({ column }) => <SortableHeader column={column} label="Falta pagar" className="ml-auto" />,
        cell: ({ row }) => (
          <div
            className={`text-right font-semibold tabular-nums ${
              Number(row.original.pendingAmount) > 0 ? 'text-destructive' : ''
            }`}
          >
            {formatMoney(row.original.pendingAmount, cur)}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'description',
        header: 'Descripción',
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.description ?? '-'}</span>,
      },
    ];
    base.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-0.5">
          <IconAction icon={Pencil} label="Editar" onClick={() => setEditing(row.original)} />
          {canDelete && onDelete && (
            <IconAction icon={Trash2} label="Eliminar" destructive onClick={() => onDelete(row.original.id)} />
          )}
        </div>
      ),
    });
    return base;
  }, [cur, canDelete, onDelete]);

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="Total pagado"
            value={formatMoney(summary.totalPaid, cur)}
            icon={Wallet}
            color="text-success"
          />
          <KPICard label="Total deuda" value={formatMoney(summary.totalDebt, cur)} icon={Banknote} color="text-info" />
          <KPICard
            label="Falta pagar"
            value={formatMoney(summary.totalPending, cur)}
            icon={TrendingDown}
            color="text-destructive"
          />
          <KPICard label="Saldo" value={formatMoney(summary.balance, cur)} icon={PiggyBank} color="text-brand" />
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">Estado de cuenta</h3>
        <LedgerFormDialog onSubmit={onCreate} isPending={isMutating} />
      </div>

      <DataTableToolbar
        sticky={false}
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar descripción..."
        showClear={hasFilters}
        onClear={clear}
        filters={
          <>
            <FilterSelect
              value={type}
              onValueChange={setType}
              options={[
                { value: 'EGRESO', label: 'Egreso' },
                { value: 'DEUDA', label: 'Deuda' },
              ]}
              placeholder="Tipo"
              allLabel="Todo tipo"
            />
            <FilterSelect
              value={status}
              onValueChange={setStatus}
              options={statusOptions}
              placeholder="Estado"
              allLabel="Todo estado"
            />
            {categoryOptions.length > 0 && (
              <FilterSelect
                value={category}
                onValueChange={setCategory}
                options={categoryOptions}
                placeholder="Categoría"
                allLabel="Toda categoría"
              />
            )}
            <MonthYearFilter
              year={year}
              month={month}
              onYearChange={setYear}
              onMonthChange={setMonth}
              years={availableYears}
            />
          </>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        pageSize={20}
        emptyState={<EmptyState title="Sin registros" description="Aún no hay movimientos registrados." />}
      />

      {editing && (
        <LedgerFormDialog
          entry={editing}
          isPending={isMutating}
          onSubmit={(v) => onUpdate(editing.id, v)}
          open
          onOpenChange={(next) => {
            if (!next) setEditing(null);
          }}
        />
      )}
    </div>
  );
}
