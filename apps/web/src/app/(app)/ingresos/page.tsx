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
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { IconAction } from '@/components/ui/icon-action';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Company, Paginated, Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { formatMonthYear } from '@/lib/utils';

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
  const [year, setYear] = useState<string>(FILTER_ALL);
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

  const availableYears = useMemo(() => {
    const set = new Set((data?.data ?? []).map((tx) => new Date(tx.date).getUTCFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [data?.data]);

  const companyName = (id?: string | null) => companies?.find((c) => c.id === id)?.name;

  const rows = useMemo(() => {
    return (data?.data ?? []).filter((tx) => {
      if (status !== FILTER_ALL && tx.status !== status) return false;
      if (companyId !== FILTER_ALL && tx.companyId !== companyId) return false;
      const d = new Date(tx.date);
      if (year !== FILTER_ALL && d.getUTCFullYear() !== Number(year)) return false;
      if (month !== FILTER_ALL && d.getUTCMonth() + 1 !== Number(month)) return false;
      return true;
    });
  }, [data?.data, status, companyId, year, month]);

  const total = useMemo(() => rows.reduce((sum, tx) => sum + Number(tx.amountBase), 0), [rows]);
  const totalAll = useMemo(() => (data?.data ?? []).reduce((sum, tx) => sum + Number(tx.amountBase), 0), [data?.data]);

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
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {companyName(row.original.companyId) ?? row.original.category?.name ?? '-'}
          </span>
        ),
      },
      {
        id: 'amount',
        accessorFn: (r) => Number(r.amountBase),
        sortingFn: 'basic',
        header: ({ column }) => <SortableHeader column={column} label="Monto" className="ml-auto" />,
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
    <div className="space-y-6">
      <PageHeader
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
      />

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar ingresos..."
        showClear={
          search !== '' ||
          status !== FILTER_ALL ||
          companyId !== FILTER_ALL ||
          year !== FILTER_ALL ||
          month !== FILTER_ALL
        }
        onClear={() => {
          setSearch('');
          setStatus(FILTER_ALL);
          setCompanyId(FILTER_ALL);
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
        footer={
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {rows.length} de {data?.data.length ?? 0} ingresos
            </span>
            <div className="flex gap-6">
              <span className="text-muted-foreground">
                Total filtrado:{' '}
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
    </div>
  );
}

export default function IngresosPage() {
  return (
    <WorkspaceGate type="EMPLOYMENT">
      <IngresosContent />
    </WorkspaceGate>
  );
}
