'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Landmark, Plus, TrendingDown, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { MonthAccordion } from '@/components/data-table/month-accordion';
import { MonthYearFilter } from '@/components/data-table/month-year-filter';
import { TransactionFormDialog } from '@/components/forms/transaction-form-dialog';
import { buildIncomeColumns } from '@/components/income/income-columns';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { OwnCompanyToggle, useOwnCompanyVisibility } from '@/components/reports/own-company-toggle';
import { TransactionDetailDialog, UsdConversionDialog } from '@/components/transactions/transaction-detail-dialog';
import { Button } from '@/components/ui/button';
import { apiFetch, buildQuery } from '@/lib/api';
import type {
  BankCatalog,
  Company,
  EmploymentContract,
  Paginated,
  PaymentMethodCatalog,
  Transaction,
} from '@/lib/api.types';
import { conceptOrdinals, contractOf, grossOf, INCOME_STATUS_LABELS, monthKeyOf } from '@/lib/employment-income';
import { queryKeys } from '@/lib/query-keys';
import { splitTags } from '@/lib/transaction-tags';
import { useDefaultYear } from '@/lib/use-default-year';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { useOpenMonth } from '@/lib/use-open-month';
import { formatMonthYear } from '@/lib/utils';

function IngresosContent() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { markNew, highlightClass } = useHighlightNew();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(FILTER_ALL);
  const [companyId, setCompanyId] = useState<string>(FILTER_ALL);
  const [bank, setBank] = useState<string>(FILTER_ALL);
  const [concept, setConcept] = useState<string>(FILTER_ALL);
  const [paymentMethod, setPaymentMethod] = useState<string>(FILTER_ALL);
  const [month, setMonth] = useState<string>(FILTER_ALL);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const { show: showOwn, toggle: toggleOwn, isHidden } = useOwnCompanyVisibility();
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [usdDetail, setUsdDetail] = useState<Transaction | null>(null);

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

  const { data: contracts } = useQuery({
    queryKey: queryKeys.employmentContracts(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<EmploymentContract[]>(`/employment-contracts?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const { data: paymentMethods } = useQuery({
    queryKey: queryKeys.paymentMethods(),
    queryFn: () => apiFetch<PaymentMethodCatalog[]>('/payment-methods'),
  });

  const { data: banks } = useQuery({
    queryKey: queryKeys.banks(),
    queryFn: () => apiFetch<BankCatalog[]>('/banks'),
  });

  // El catalogo global decide si un tag es medio de pago o banco.
  const catalogs = useMemo(
    () => ({
      paymentMethods: new Set((paymentMethods ?? []).map((p) => p.name)),
      banks: new Set((banks ?? []).map((b) => b.name)),
    }),
    [paymentMethods, banks],
  );

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
    return distinct.map((value) => ({ value, label: INCOME_STATUS_LABELS[value] ?? value }));
  }, [data?.data]);

  const companyOptions = useMemo(() => (companies ?? []).map((c) => ({ value: c.id, label: c.name })), [companies]);

  const bankOptions = useMemo(() => {
    const set = new Set((data?.data ?? []).map((tx) => splitTags(tx.tags, catalogs).bank).filter(Boolean) as string[]);
    return [...set].sort((a, b) => a.localeCompare(b, 'es')).map((value) => ({ value, label: value }));
  }, [data?.data, catalogs]);

  const paymentMethodOptions = useMemo(() => {
    const set = new Set(
      (data?.data ?? []).map((tx) => splitTags(tx.tags, catalogs).paymentMethod).filter(Boolean) as string[],
    );
    return [...set].sort((a, b) => a.localeCompare(b, 'es')).map((value) => ({ value, label: value }));
  }, [data?.data, catalogs]);

  const conceptOptions = useMemo(() => {
    const set = new Set((data?.data ?? []).map((tx) => tx.concept.trim()).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, 'es')).map((value) => ({ value, label: value }));
  }, [data?.data]);

  const availableYears = useMemo(() => {
    const set = new Set((data?.data ?? []).map((tx) => new Date(tx.date).getUTCFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [data?.data]);

  const [year, setYear] = useDefaultYear(availableYears);

  const companyName = (id?: string | null) => companies?.find((c) => c.id === id)?.name;

  // Se numera sobre el total y no sobre lo filtrado: el sueldo 3 de 15 sigue
  // siendo el 3 aunque la vista muestre un solo mes.
  const ordinals = useMemo(() => conceptOrdinals(data?.data ?? []), [data?.data]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.data ?? []).filter((tx) => {
      if (status !== FILTER_ALL && tx.status !== status) return false;
      if (companyId !== FILTER_ALL && tx.companyId !== companyId) return false;
      if (bank !== FILTER_ALL || paymentMethod !== FILTER_ALL) {
        const split = splitTags(tx.tags, catalogs);
        if (bank !== FILTER_ALL && split.bank !== bank) return false;
        if (paymentMethod !== FILTER_ALL && split.paymentMethod !== paymentMethod) return false;
      }
      if (concept !== FILTER_ALL && tx.concept.trim() !== concept) return false;
      const d = new Date(tx.date);
      if (year !== FILTER_ALL && d.getUTCFullYear() !== Number(year)) return false;
      if (month !== FILTER_ALL && d.getUTCMonth() + 1 !== Number(month)) return false;
      if (isHidden(companyName(tx.companyId))) return false;
      if (term && !`${tx.concept} ${companyName(tx.companyId) ?? ''}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [data?.data, status, companyId, bank, paymentMethod, concept, year, month, search, companies, catalogs, isHidden]);

  const total = useMemo(() => rows.reduce((sum, tx) => sum + Number(tx.amountBase), 0), [rows]);
  const totalGross = useMemo(() => rows.reduce((sum, tx) => sum + grossOf(tx), 0), [rows]);
  const totalAll = useMemo(() => (data?.data ?? []).reduce((sum, tx) => sum + Number(tx.amountBase), 0), [data?.data]);
  const filtered = rows.length !== (data?.data.length ?? 0);

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
        const net = items.reduce((s, t) => s + Number(t.amountBase), 0);
        const gross = items.reduce((s, t) => s + grossOf(t), 0);
        const paid = items.filter((t) => t.status === 'PAID').length;
        return {
          key,
          label: formatMonthYear(`${key}-01T00:00:00.000Z`),
          items,
          metrics: [
            { label: 'Bruto', value: formatMoney(String(gross), 'PEN') },
            { label: 'Neto', value: formatMoney(String(net), 'PEN'), className: 'text-success' },
            { label: 'Pagados', value: `${paid}/${items.length}` },
          ],
        };
      });
  }, [rows]);

  const now = new Date();
  const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const defaultMonthKey = monthGroups.some((g) => g.key === currentMonthKey)
    ? currentMonthKey
    : (monthGroups[0]?.key ?? null);
  const { isOpen: isMonthOpen, toggle: toggleMonth } = useOpenMonth('korapay.ingresos.openMonth', defaultMonthKey);

  const removeIncome = async (tx: Transaction) => {
    const ok = await confirm({
      title: 'Eliminar ingreso',
      description: `Se eliminará "${tx.concept.slice(0, 60)}". Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) removeMutation.mutate(tx.id);
  };

  const columns = useMemo(
    () =>
      buildIncomeColumns({
        workspaceId: activeWorkspaceId,
        companyName,
        catalogs,
        onEdit: setEditing,
        onRemove: removeIncome,
        onShowDetail: setDetail,
        onShowConversion: setUsdDetail,
        showDate: false,
        ordinals,
      }),
    [activeWorkspaceId, companies, catalogs, confirm, removeMutation, ordinals],
  );

  return (
    <PageShell
      title="Ingresos"
      description="Ingresos por trabajos y empleos, desglosados por mes"
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label={filtered ? 'Total neto filtrado' : 'Total neto'}
          value={formatMoney(String(total), 'PEN')}
          icon={ArrowUpRight}
          color="text-success"
          tooltip="Suma de lo efectivamente recibido, ya descontada la planilla"
        />
        <KPICard
          label={filtered ? 'Total bruto filtrado' : 'Total bruto'}
          value={formatMoney(String(totalGross), 'PEN')}
          icon={Wallet}
          color="text-info"
          tooltip="Suma antes de descuentos. Si un ingreso no tuvo descuento, su bruto es igual al neto"
        />
        <KPICard
          label="Descuentos"
          value={formatMoney(String(Math.max(0, totalGross - total)), 'PEN')}
          icon={TrendingDown}
          color="text-muted-foreground"
          tooltip="Diferencia entre el bruto y el neto en el periodo mostrado"
        />
        <KPICard
          label="Total histórico neto"
          value={formatMoney(String(totalAll), 'PEN')}
          icon={Landmark}
          color="text-brand"
          tooltip="Neto acumulado de todos los ingresos registrados, sin aplicar filtros"
        />
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar ingresos..."
        showClear={
          search !== '' ||
          status !== FILTER_ALL ||
          companyId !== FILTER_ALL ||
          bank !== FILTER_ALL ||
          paymentMethod !== FILTER_ALL ||
          concept !== FILTER_ALL ||
          year !== FILTER_ALL ||
          month !== FILTER_ALL
        }
        onClear={() => {
          setSearch('');
          setStatus(FILTER_ALL);
          setCompanyId(FILTER_ALL);
          setBank(FILTER_ALL);
          setPaymentMethod(FILTER_ALL);
          setConcept(FILTER_ALL);
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
              value={concept}
              onValueChange={setConcept}
              options={conceptOptions}
              placeholder="Concepto"
              allLabel="Todo concepto"
            />
            <FilterSelect
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              options={paymentMethodOptions}
              placeholder="Forma de pago"
              allLabel="Toda forma de pago"
            />
            <FilterSelect
              value={bank}
              onValueChange={setBank}
              options={bankOptions}
              placeholder="Banco"
              allLabel="Todo banco"
            />
            <OwnCompanyToggle show={showOwn} onToggle={toggleOwn} />
          </>
        }
      />

      {isLoading && <p className="py-12 text-center text-sm text-muted-foreground">Cargando ingresos...</p>}

      {!isLoading && monthGroups.length === 0 && (
        <EmptyState title="Sin ingresos" description="Registra tu primer ingreso con el botón de arriba." />
      )}

      {!isLoading && monthGroups.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {rows.length} de {data?.data.length ?? 0} ingresos en {monthGroups.length}{' '}
              {monthGroups.length === 1 ? 'mes' : 'meses'}
            </span>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span className="text-muted-foreground">
                Bruto: <span className="font-semibold tabular-nums">{formatMoney(String(totalGross), 'PEN')}</span>
              </span>
              <span className="text-muted-foreground">
                Neto:{' '}
                <span className="font-semibold tabular-nums text-success">{formatMoney(String(total), 'PEN')}</span>
              </span>
            </div>
          </div>

          <MonthAccordion
            groups={monthGroups}
            currentMonthKey={currentMonthKey}
            isOpen={isMonthOpen}
            onToggle={toggleMonth}
            countLabel={(n) => `${n} ${n === 1 ? 'ingreso' : 'ingresos'}`}
          >
            {(group) => (
              <DataTable columns={columns} data={group.items} embedded rowClassName={(t) => highlightClass(t.id)} />
            )}
          </MonthAccordion>
        </>
      )}

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

      <TransactionDetailDialog
        transaction={detail}
        workspaceId={activeWorkspaceId}
        categoryLabel="Empresa"
        categoryName={() => companyName(detail?.companyId) ?? detail?.category?.name ?? '—'}
        contract={detail ? contractOf(detail, contracts ?? []) : null}
        ordinal={detail ? ordinals.get(detail.id) : null}
        onOpenChange={(next) => !next && setDetail(null)}
      />

      <UsdConversionDialog transaction={usdDetail} onOpenChange={(next) => !next && setUsdDetail(null)} />
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
