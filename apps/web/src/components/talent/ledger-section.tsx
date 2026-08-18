'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, esCero, KPICard, statusLabel } from '@korapay/ui';
import type { ColumnDef } from '@tanstack/react-table';
import { Banknote, Eye, Pencil, PiggyBank, Trash2, TrendingDown, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { MonthAccordion } from '@/components/data-table/month-accordion';
import { MonthYearFilter } from '@/components/data-table/month-year-filter';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { StatusPicker } from '@/components/data-table/status-toggle';
import { IconAction, IconActions } from '@/components/ui/icon-action';
import type { TalentLedgerEntry, TalentSummaryTotals } from '@/lib/api.types';
import { DEBT_STATUS_OPTIONS } from '@/lib/debt-status';
import { useOpenMonth } from '@/lib/use-open-month';
import { cn, formatDate, formatMonthYear } from '@/lib/utils';
import { DebtOwnerBadge } from './debt-owner-badge';
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
  talentName?: string;
  adminName?: string;
  onCreate: (values: LedgerFormValues) => Promise<void>;
  onUpdate: (id: string, values: LedgerFormValues) => Promise<void>;
  onDelete?: (id: string) => void;
  onQuickStatus?: (entry: TalentLedgerEntry, status: string) => void;
  isMutating?: boolean;
}

export function LedgerSection({
  entries,
  summary,
  isLoading,
  currency = 'PEN',
  canDelete = true,
  talentName,
  adminName,
  onCreate,
  onUpdate,
  onDelete,
  onQuickStatus,
  isMutating,
}: LedgerSectionProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [type, setType] = useState('DEUDA');
  const [year, setYear] = useState(FILTER_ALL);
  const [month, setMonth] = useState(FILTER_ALL);
  const [editing, setEditing] = useState<TalentLedgerEntry | null>(null);
  const [detalle, setDetalle] = useState<TalentLedgerEntry | null>(null);

  const cur = currency as 'PEN' | 'USD';
  const esDeuda = type === 'DEUDA';
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
        (!esDeuda || status === FILTER_ALL || e.status === status) &&
        (type === FILTER_ALL || e.type === type) &&
        (year === FILTER_ALL || String(e.year) === year) &&
        (month === FILTER_ALL || String(e.month) === month),
    );
  }, [entries, search, status, type, year, month, esDeuda]);

  const hayFiltro = search.trim() !== '' || year !== FILTER_ALL || month !== FILTER_ALL;

  const totales = useMemo(() => {
    const paid = rows.reduce((s, e) => s + Number(e.paidAmount), 0);
    const debt = rows.reduce((s, e) => s + Number(e.debtAmount), 0);
    const pending = rows.reduce((s, e) => s + Number(e.pendingAmount), 0);
    return {
      totalPaid: paid.toFixed(2),
      totalDebt: debt.toFixed(2),
      totalPending: pending.toFixed(2),
      totalReturned: Math.max(0, debt - pending).toFixed(2),
    };
  }, [rows]);

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
    setStatus('PENDING');
    setYear(FILTER_ALL);
    setMonth(FILTER_ALL);
  };

  const columns = useMemo<ColumnDef<TalentLedgerEntry, unknown>[]>(() => {
    const base: ColumnDef<TalentLedgerEntry, unknown>[] = [
      {
        accessorKey: 'date',
        size: 120,
        header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.date)}</span>,
      },
    ];

    if (type === 'DEUDA') {
      base.push(
        {
          id: 'owner',
          size: 150,
          header: 'De quién',
          cell: ({ row }) => (
            <DebtOwnerBadge owner={row.original.debtOwner} talentName={talentName} adminName={adminName} />
          ),
        },
        {
          id: 'debt',
          size: 140,
          accessorFn: (r) => Number(r.debtAmount),
          header: ({ column }) => <SortableHeader column={column} label="Deuda" className="ml-auto" />,
          cell: ({ row }) => (
            <div
              className={cn('text-right tabular-nums', esCero(row.original.debtAmount) && 'text-muted-foreground/60')}
            >
              {formatMoney(row.original.debtAmount, cur)}
            </div>
          ),
        },
        {
          id: 'pending',
          size: 140,
          accessorFn: (r) => Number(r.pendingAmount),
          header: ({ column }) => <SortableHeader column={column} label="Falta pagar" className="ml-auto" />,
          cell: ({ row }) => {
            const falta = Number(row.original.pendingAmount) > 0;
            return (
              <div
                className={cn(
                  'text-right tabular-nums',
                  falta ? 'font-semibold text-destructive' : 'text-muted-foreground/60',
                )}
              >
                {formatMoney(row.original.pendingAmount, cur)}
              </div>
            );
          },
        },
        {
          accessorKey: 'status',
          size: 140,
          header: 'Estado',
          cell: ({ row }) => (
            <StatusPicker
              status={row.original.status}
              options={DEBT_STATUS_OPTIONS}
              isPending={isMutating}
              onSelect={(next) => onQuickStatus?.(row.original, next)}
            />
          ),
        },
      );
    } else {
      base.push({
        id: 'paid',
        size: 160,
        accessorFn: (r) => Number(r.paidAmount),
        header: ({ column }) => <SortableHeader column={column} label="Desembolsado" />,
        cell: ({ row }) => (
          <div
            className={cn(
              'font-medium tabular-nums',
              esCero(row.original.paidAmount) ? 'text-muted-foreground/60' : 'text-coral',
            )}
          >
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
      size: 90,
      header: '',
      cell: ({ row }) => (
        <IconActions>
          <IconAction icon={Eye} label="Ver detalle" onClick={() => setDetalle(row.original)} />
          <IconAction icon={Pencil} label="Editar" onClick={() => setEditing(row.original)} />
          {canDelete && onDelete && (
            <IconAction icon={Trash2} label="Eliminar" destructive onClick={() => onDelete(row.original.id)} />
          )}
        </IconActions>
      ),
    });
    return base;
  }, [cur, canDelete, onDelete, type, talentName, adminName, isMutating, onQuickStatus]);

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label={hayFiltro ? 'Desembolsado (filtrado)' : 'Total desembolsado'}
            value={formatMoney(totales.totalPaid, cur)}
            icon={Wallet}
            color="text-coral"
            tooltip={
              hayFiltro
                ? `Lo que MIMOTECH gastó en esta persona, solo en lo que estás viendo ahora. Sin filtros el total es ${formatMoney(summary.totalPaid, cur)}.`
                : 'Lo que MIMOTECH gastó en esta persona. Es salida de dinero, no ingreso.'
            }
          />
          <KPICard
            label={hayFiltro ? 'Deuda (filtrada)' : 'Total deuda'}
            value={formatMoney(totales.totalDebt, cur)}
            icon={Banknote}
            color="text-info"
            tooltip={
              hayFiltro
                ? `Lo que el talento se comprometió a devolver, solo en lo que estás viendo ahora. Sin filtros el total es ${formatMoney(summary.totalDebt, cur)}.`
                : 'Suma de todo lo que el talento se comprometió a devolver, ya lo haya pagado o no.'
            }
          />
          <KPICard
            label="Falta pagar"
            value={formatMoney(totales.totalPending, cur)}
            icon={TrendingDown}
            color="text-destructive"
            tooltip={
              hayFiltro
                ? `Lo que sigue sin devolver, solo en lo que estás viendo ahora. Sin filtros el total es ${formatMoney(summary.totalPending, cur)}.`
                : 'De esa deuda, cuánto sigue sin devolver a día de hoy.'
            }
          />
          <KPICard
            label="Ya devuelto"
            value={formatMoney(totales.totalReturned, cur)}
            icon={PiggyBank}
            color="text-success"
            tooltip="Parte de la deuda que el talento ya te devolvió."
          />
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
            talentName={talentName}
            adminName={adminName}
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
            {esDeuda && (
              <FilterSelect
                value={status}
                onValueChange={setStatus}
                options={statusOptions}
                placeholder="Estado"
                allLabel="Todo estado"
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

      <TalentLedgerDetailDialog
        entry={detalle}
        currency={cur}
        talentName={talentName}
        adminName={adminName}
        onOpenChange={(next) => !next && setDetalle(null)}
      />

      {editing && (
        <LedgerFormDialog
          entry={editing}
          talentName={talentName}
          adminName={adminName}
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
