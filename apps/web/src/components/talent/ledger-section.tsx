'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard, StatusBadge, statusLabel } from '@korapay/ui';
import type { ColumnDef } from '@tanstack/react-table';
import { Banknote, Eye, Pencil, PiggyBank, Trash2, TrendingDown, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { MonthAccordion } from '@/components/data-table/month-accordion';
import { MonthYearFilter } from '@/components/data-table/month-year-filter';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { IconAction } from '@/components/ui/icon-action';
import type { TalentLedgerEntry, TalentSummaryTotals } from '@/lib/api.types';
import { useOpenMonth } from '@/lib/use-open-month';
import { cn, formatDate, formatMonthYear } from '@/lib/utils';
import { TalentLedgerDetailDialog } from './ledger-detail-dialog';
import { LedgerFormDialog, type LedgerFormValues } from './ledger-form-dialog';

const TIPOS = [
  { value: 'DEUDA', label: 'Deudas' },
  { value: 'EGRESO', label: 'Egresos' },
] as const;

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
  const [type, setType] = useState('DEUDA');
  const [year, setYear] = useState(FILTER_ALL);
  const [month, setMonth] = useState(FILTER_ALL);
  const [editing, setEditing] = useState<TalentLedgerEntry | null>(null);
  const [detalle, setDetalle] = useState<TalentLedgerEntry | null>(null);

  const cur = currency as 'PEN' | 'USD';
  const statusOptions = useMemo(
    () => [...new Set(entries.map((e) => e.status))].map((v) => ({ value: v, label: statusLabel(v) })),
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
        (year === FILTER_ALL || String(e.year) === year) &&
        (month === FILTER_ALL || String(e.month) === month),
    );
  }, [entries, search, status, type, year, month]);

  const monthGroups = useMemo(() => {
    const map = new Map<string, TalentLedgerEntry[]>();
    for (const e of rows) {
      const key = `${e.year}-${String(e.month).padStart(2, '0')}`;
      const bucket = map.get(key) ?? [];
      bucket.push(e);
      map.set(key, bucket);
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, items]) => {
        const pagado = items.reduce((s, e) => s + Number(e.paidAmount), 0);
        const falta = items.reduce((s, e) => s + Number(e.pendingAmount), 0);
        return {
          key,
          label: formatMonthYear(`${key}-01T00:00:00.000Z`),
          items,
          metrics: [
            { label: 'Pagado', value: formatMoney(String(pagado), cur) },
            ...(falta > 0
              ? [{ label: 'Falta pagar', value: formatMoney(String(falta), cur), className: 'text-destructive' }]
              : []),
          ],
        };
      });
  }, [rows, cur]);

  const now = new Date();
  const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const defaultMonthKey = monthGroups.some((g) => g.key === currentMonthKey)
    ? currentMonthKey
    : (monthGroups[0]?.key ?? null);
  const { isOpen: isMonthOpen, toggle: toggleMonth } = useOpenMonth(
    'korapay.talento.ledger.openMonth',
    defaultMonthKey,
  );

  const hasFilters = search !== '' || status !== FILTER_ALL || year !== FILTER_ALL || month !== FILTER_ALL;
  const clear = () => {
    setSearch('');
    setStatus(FILTER_ALL);
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
    ];

    if (type === 'DEUDA') {
      base.push(
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
      );
    } else {
      base.push({
        id: 'paid',
        accessorFn: (r) => Number(r.paidAmount),
        header: ({ column }) => <SortableHeader column={column} label="Desembolsado" className="ml-auto" />,
        cell: ({ row }) => (
          <div className="text-right font-medium text-coral tabular-nums">
            {formatMoney(row.original.paidAmount, cur)}
          </div>
        ),
      });
    }

    base.push({
      id: 'description',
      header: 'Descripción',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.description ?? '-'}</span>,
    });
    base.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-0.5">
          <IconAction icon={Eye} label="Ver detalle" onClick={() => setDetalle(row.original)} />
          <IconAction icon={Pencil} label="Editar" onClick={() => setEditing(row.original)} />
          {canDelete && onDelete && (
            <IconAction icon={Trash2} label="Eliminar" destructive onClick={() => onDelete(row.original.id)} />
          )}
        </div>
      ),
    });
    return base;
  }, [cur, canDelete, onDelete, type]);

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label="Total desembolsado"
            value={formatMoney(summary.totalPaid, cur)}
            icon={Wallet}
            color="text-coral"
            tooltip="Lo que MIMOTECH gastó en esta persona. Es salida de dinero, no ingreso."
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">Estado de cuenta</h3>
        <div className="flex items-center gap-2">
          <div className="inline-flex w-fit gap-0.5 rounded-lg border bg-muted/40 p-0.5">
            {TIPOS.map((t) => {
              const activo = type === t.value;
              const total = entries.filter((e) => e.type === t.value).length;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  aria-pressed={activo}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3.5 py-1.5 font-medium text-sm transition-colors',
                    activo ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[11px] tabular-nums',
                      activo ? 'bg-muted text-muted-foreground' : 'bg-transparent text-muted-foreground/70',
                    )}
                  >
                    {total}
                  </span>
                </button>
              );
            })}
          </div>
          <LedgerFormDialog
            defaultType={type === 'EGRESO' ? 'EGRESO' : 'DEUDA'}
            onSubmit={onCreate}
            isPending={isMutating}
          />
        </div>
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
              value={status}
              onValueChange={setStatus}
              options={statusOptions}
              placeholder="Estado"
              allLabel="Todo estado"
            />
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

      {isLoading && <p className="py-12 text-center text-muted-foreground text-sm">Cargando movimientos...</p>}

      {!isLoading && monthGroups.length === 0 && (
        <EmptyState title="Sin registros" description="Aún no hay movimientos registrados." />
      )}

      {!isLoading && monthGroups.length > 0 && (
        <MonthAccordion
          groups={monthGroups}
          currentMonthKey={currentMonthKey}
          isOpen={isMonthOpen}
          onToggle={toggleMonth}
          countLabel={(n) => `${n} ${n === 1 ? 'movimiento' : 'movimientos'}`}
        >
          {(group) => <DataTable columns={columns} data={group.items} embedded />}
        </MonthAccordion>
      )}

      <TalentLedgerDetailDialog entry={detalle} currency={cur} onOpenChange={(next) => !next && setDetalle(null)} />

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
