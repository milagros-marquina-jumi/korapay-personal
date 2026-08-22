'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard, statusLabel } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Eye, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { MonthAccordion } from '@/components/data-table/month-accordion';
import { MonthYearFilter } from '@/components/data-table/month-year-filter';
import { RefreshButton } from '@/components/data-table/refresh-button';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { StatusToggle } from '@/components/data-table/status-toggle';
import { TransactionFormDialog } from '@/components/forms/transaction-form-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { TransactionDetailDialog } from '@/components/transactions/transaction-detail-dialog';
import { Button } from '@/components/ui/button';
import { IconAction, IconActions } from '@/components/ui/icon-action';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Paginated, Person, Transaction } from '@/lib/api.types';
import { monthKeyOf } from '@/lib/employment-income';
import { queryKeys } from '@/lib/query-keys';
import { useDefaultYear } from '@/lib/use-default-year';
import { useOpenMonth } from '@/lib/use-open-month';
import { formatDateMedium, formatMonthYear } from '@/lib/utils';

function PagosEquipoContent() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const ws = activeWorkspaceId ?? '';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(FILTER_ALL);
  const [personId, setPersonId] = useState<string>(FILTER_ALL);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [month, setMonth] = useState<string>(FILTER_ALL);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.transactions(ws, { type: 'TEAM_PAYMENT', all: true }),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/transactions${buildQuery({
          workspaceId: ws,
          type: 'TEAM_PAYMENT',
          page: 1,
          pageSize: 500,
          sortBy: 'date',
          sortOrder: 'desc',
        })}`,
      ),
    enabled: !!ws,
  });

  const { data: peopleData } = useQuery({
    queryKey: queryKeys.people(ws),
    queryFn: () => apiFetch<Person[]>(`/people?workspaceId=${ws}&kind=TEAM`),
    enabled: !!ws,
  });

  const removeTxMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/transactions/${id}?workspaceId=${ws}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', ws] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(ws) });
    },
  });

  const statusOptions = useMemo(() => {
    const distinct = [...new Set((data?.data ?? []).map((tx) => tx.status))];
    return distinct.map((value) => ({ value, label: statusLabel(value) }));
  }, [data?.data]);

  const personOptions = useMemo(() => (peopleData ?? []).map((p) => ({ value: p.id, label: p.name })), [peopleData]);
  const personName = (id?: string | null) => peopleData?.find((p) => p.id === id)?.name;

  const availableYears = useMemo(() => {
    const set = new Set((data?.data ?? []).map((tx) => new Date(tx.date).getUTCFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [data?.data]);

  const [year, setYear] = useDefaultYear(availableYears);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.data ?? []).filter((tx) => {
      if (status !== FILTER_ALL && tx.status !== status) return false;
      if (personId !== FILTER_ALL && tx.personId !== personId) return false;
      const d = new Date(tx.date);
      if (year !== FILTER_ALL && d.getUTCFullYear() !== Number(year)) return false;
      if (month !== FILTER_ALL && d.getUTCMonth() + 1 !== Number(month)) return false;
      if (term) {
        const persona = tx.person?.name ?? personName(tx.personId) ?? tx.concept;
        if (!`${persona} ${tx.description ?? ''}`.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [data?.data, status, personId, year, month, search, peopleData]);

  const totalPagado = rows.reduce((sum, tx) => sum + Number(tx.amountBase), 0);

  const monthGroups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of rows) {
      const key = monthKeyOf(tx.date);
      const bucket = map.get(key) ?? [];
      bucket.push(tx);
      map.set(key, bucket);
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, items]) => {
        const total = items.reduce((s, t) => s + Number(t.amountBase), 0);
        const pagados = items.filter((t) => t.status === 'PAID').length;
        return {
          key,
          label: formatMonthYear(`${key}-01T00:00:00.000Z`),
          items,
          metrics: [
            { label: 'Total', value: formatMoney(String(total), 'PEN'), className: 'text-destructive' },
            { label: 'Pagados', value: `${pagados}/${items.length}` },
          ],
        };
      });
  }, [rows]);

  const now = new Date();
  const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const defaultMonthKey = monthGroups.some((g) => g.key === currentMonthKey)
    ? currentMonthKey
    : (monthGroups[0]?.key ?? null);
  const { isOpen: isMonthOpen, toggle: toggleMonth } = useOpenMonth('korapay.pagos-equipo.openMonth', defaultMonthKey);

  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        size: 130,
        header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
        cell: ({ row }) => <span className="text-sm">{formatDateMedium(row.original.date)}</span>,
      },
      {
        id: 'person',
        size: 190,
        header: ({ column }) => <SortableHeader column={column} label="Colaborador" />,
        accessorFn: (r) => r.person?.name ?? r.concept,
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.person?.name ?? personName(row.original.personId) ?? row.original.concept}
          </span>
        ),
      },
      {
        id: 'notes',
        size: 260,
        header: 'Notas',
        cell: ({ row }) => (
          <p className="max-w-88 truncate text-muted-foreground" title={row.original.description ?? undefined}>
            {row.original.description || '—'}
          </p>
        ),
      },
      {
        id: 'amount',
        size: 150,
        accessorFn: (r) => Number(r.amountBase),
        sortingFn: 'basic',
        header: ({ column }) => <SortableHeader column={column} label="Monto" className="ml-auto" />,
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums text-destructive">
            {formatMoney(row.original.amountBase, 'PEN')}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        size: 120,
        header: 'Estado',
        cell: ({ row }) => (
          <StatusToggle transactionId={row.original.id} workspaceId={ws} status={row.original.status} />
        ),
      },
      {
        id: 'actions',
        size: 110,
        header: '',
        cell: ({ row }) => (
          <IconActions>
            <IconAction icon={Eye} label="Ver detalle" onClick={() => setDetailTx(row.original)} />
            <IconAction icon={Pencil} label="Editar" onClick={() => setEditingTx(row.original)} />
            <IconAction
              icon={Trash2}
              label="Eliminar"
              destructive
              onClick={async () => {
                const ok = await confirm({
                  title: 'Eliminar pago',
                  description: 'Se eliminará este pago. Esta acción no se puede deshacer.',
                  confirmLabel: 'Eliminar',
                  destructive: true,
                });
                if (ok) removeTxMutation.mutate(row.original.id);
              }}
            />
          </IconActions>
        ),
      },
    ],
    [confirm, removeTxMutation, peopleData],
  );

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <KPICard
          label="Total en pantalla"
          value={formatMoney(String(totalPagado), 'PEN')}
          icon={Wallet}
          color="text-destructive"
          tooltip="Suma de los pagos que cumplen los filtros activos"
        />
        <KPICard
          label="Pagos registrados"
          value={String(rows.length)}
          icon={Wallet}
          color="text-info"
          tooltip="Cantidad de pagos en el listado"
        />
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar pagos..."
        showClear={
          search !== '' ||
          status !== FILTER_ALL ||
          personId !== FILTER_ALL ||
          year !== FILTER_ALL ||
          month !== FILTER_ALL
        }
        onClear={() => {
          setSearch('');
          setStatus(FILTER_ALL);
          setPersonId(FILTER_ALL);
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
              value={personId}
              onValueChange={setPersonId}
              options={personOptions}
              placeholder="Colaborador"
              allLabel="Todo colaborador"
            />
            <FilterSelect
              value={status}
              onValueChange={setStatus}
              options={statusOptions}
              placeholder="Estado"
              allLabel="Todo estado"
            />
          </>
        }
      />

      {isLoading && <p className="py-12 text-center text-muted-foreground text-sm">Cargando pagos...</p>}

      {!isLoading && monthGroups.length === 0 && (
        <EmptyState title="Sin pagos" description="Registra tu primer pago al equipo con el botón de arriba." />
      )}

      {!isLoading && monthGroups.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {rows.length} de {data?.data.length ?? 0} pagos en {monthGroups.length}{' '}
              {monthGroups.length === 1 ? 'mes' : 'meses'}
            </span>
            <span className="text-muted-foreground">
              Total:{' '}
              <span className="font-semibold text-destructive tabular-nums">
                {formatMoney(String(totalPagado), 'PEN')}
              </span>
            </span>
          </div>

          <MonthAccordion
            groups={monthGroups}
            currentMonthKey={currentMonthKey}
            isOpen={isMonthOpen}
            onToggle={toggleMonth}
            countLabel={(n) => `${n} ${n === 1 ? 'pago' : 'pagos'}`}
          >
            {(group) => <DataTable columns={columns} data={group.items} embedded />}
          </MonthAccordion>
        </>
      )}

      <TransactionDetailDialog
        transaction={detailTx}
        workspaceId={ws}
        categoryLabel="Colaborador"
        categoryName={() => detailTx?.person?.name ?? personName(detailTx?.personId) ?? '—'}
        onOpenChange={(next) => !next && setDetailTx(null)}
      />

      {ws && editingTx && (
        <TransactionFormDialog
          workspaceId={ws}
          defaultType="TEAM_PAYMENT"
          transaction={editingTx}
          open={!!editingTx}
          onOpenChange={(next) => !next && setEditingTx(null)}
        />
      )}
    </>
  );
}

export default function PagosEquipoPage() {
  const { activeWorkspaceId } = useWorkspace();

  return (
    <WorkspaceGate type="BUSINESS">
      <PageShell
        title="Pagos al equipo"
        description="Pagos realizados a los colaboradores de MIMOTECH"
        action={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/mimotech/equipo">
                <ArrowLeft className="mr-2 h-4 w-4" /> Colaboradores
              </Link>
            </Button>
            {activeWorkspaceId && (
              <>
                <RefreshButton workspaceId={activeWorkspaceId} />
                <TransactionFormDialog
                  workspaceId={activeWorkspaceId}
                  defaultType="TEAM_PAYMENT"
                  trigger={
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Nuevo pago
                    </Button>
                  }
                />
              </>
            )}
          </div>
        }
      >
        <PagosEquipoContent />
      </PageShell>
    </WorkspaceGate>
  );
}
