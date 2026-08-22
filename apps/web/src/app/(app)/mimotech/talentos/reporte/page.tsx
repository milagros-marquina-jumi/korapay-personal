'use client';

import { formatMoney } from '@korapay/domain';
import { KPICard } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  Eye,
  EyeOff,
  Landmark,
  ReceiptText,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CategoryDonut } from '@/components/charts/category-donut';
import { DonutList } from '@/components/charts/donut-list';
import { IncomeExpenseArea } from '@/components/charts/income-expense-area';
import { PersonBar, type PersonBarDatum } from '@/components/charts/person-bar';
import { PivotTable } from '@/components/charts/pivot-table';
import { YearlyHeatmap } from '@/components/charts/yearly-heatmap';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { PeruLaboralCalendar } from '@/components/reports/peru-laboral-calendar';
import { SortableTh, type Sorters, useSortedRows } from '@/components/reports/sortable';
import { GlobalProjectionDialog } from '@/components/talent/global-projection-dialog';
import { TalentName } from '@/components/talent/talent-name';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Money } from '@/components/ui/money';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/api';
import type { Talent, TalentGlobalReport } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { categoriaLedgerLabel } from '@/lib/talent-ledger-categories';

function TimeSeriesBars({
  data,
}: {
  data: { year: number; month: number; label: string; income: string; expense: string; net: string }[];
}) {
  if (!data.length) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Sin datos.</p>;
  }
  const max = Math.max(...data.map((d) => Math.max(Number(d.income), Number(d.expense))), 1);
  const money = (v: string | number) => formatMoney(String(v), 'PEN');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-coral" /> Egresos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-success" /> Ingresos
          </span>
        </span>
        <span className="text-muted-foreground">
          Cada barra sale del centro: a la izquierda lo que salió, a la derecha lo que entró.
        </span>
      </div>

      <div className="grid grid-cols-[7rem_1fr_7rem] gap-3 border-b px-2 pb-1.5 text-[11px] text-muted-foreground uppercase tracking-wide">
        <span>Mes</span>
        <span className="text-center">Egresos · Ingresos</span>
        <span className="text-right">Neto</span>
      </div>

      <div className="space-y-1">
        {data.map((d) => {
          const income = Number(d.income);
          const expense = Number(d.expense);
          const net = Number(d.net);
          return (
            <div
              key={`${d.year}-${d.month}`}
              className="grid grid-cols-[7rem_1fr_7rem] items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/40"
            >
              <span className="truncate text-muted-foreground text-xs capitalize">{d.label}</span>

              <div className="flex items-center">
                <div className="flex flex-1 justify-end">
                  {expense > 0 && (
                    <div
                      className="flex items-center justify-end gap-1.5"
                      style={{ width: `${(expense / max) * 100}%` }}
                    >
                      <span className="whitespace-nowrap text-[11px] text-coral tabular-nums">{money(expense)}</span>
                      <div className="h-4 min-w-1 flex-1 rounded-l-sm bg-coral" />
                    </div>
                  )}
                </div>
                <div className="h-5 w-px shrink-0 bg-border" />
                <div className="flex flex-1 justify-start">
                  {income > 0 && (
                    <div className="flex items-center gap-1.5" style={{ width: `${(income / max) * 100}%` }}>
                      <div className="h-4 min-w-1 flex-1 rounded-r-sm bg-success" />
                      <span className="whitespace-nowrap text-[11px] text-success tabular-nums">{money(income)}</span>
                    </div>
                  )}
                </div>
              </div>

              <span
                className={`text-right font-medium text-xs tabular-nums ${net < 0 ? 'text-destructive' : 'text-foreground'}`}
              >
                {money(net)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type IncomePersonRow = TalentGlobalReport['incomeByPerson'][number];
type ExpensePersonRow = TalentGlobalReport['expenseByPerson'][number];
type ProfitabilityRow = TalentGlobalReport['profitabilityByPerson'][number];
type CompanyRow = TalentGlobalReport['byCompany'][number];
type PaymentTypeRow = TalentGlobalReport['byPaymentType'][number];

const INCOME_SORTERS: Sorters<IncomePersonRow> = {
  name: (p) => p.name,
  salary: (p) => Number(p.salary),
  withDiscount: (p) => Number(p.withDiscount),
  received: (p) => Number(p.received),
  kept: (p) => Number(p.kept),
};

const EXPENSE_SORTERS: Sorters<ExpensePersonRow> = {
  name: (p) => p.name,
  count: (p) => p.count,
  paid: (p) => Number(p.paid),
  debt: (p) => Number(p.debt),
  pending: (p) => Number(p.pending),
};

const PROFIT_SORTERS: Sorters<ProfitabilityRow> = {
  name: (p) => p.name,
  received: (p) => Number(p.received),
  paid: (p) => Number(p.paid),
  net: (p) => Number(p.net),
  margin: (p) => Number(p.margin),
};

const COMPANY_SORTERS: Sorters<CompanyRow> = {
  name: (c) => c.name,
  salary: (c) => Number(c.salary),
  received: (c) => Number(c.received),
  kept: (c) => Number(c.kept),
  payments: (c) => c.payments,
};

const PAYTYPE_SORTERS: Sorters<PaymentTypeRow> = {
  name: (p) => p.name,
  received: (p) => Number(p.received),
  kept: (p) => Number(p.kept),
  count: (p) => p.count,
};

function filtrarVisibles<T extends { status?: string }>(lista: T[] | undefined, showInactive: boolean) {
  return showInactive ? (lista ?? []) : (lista ?? []).filter((p) => (p.status ?? 'ACTIVE') === 'ACTIVE');
}

function InactiveToggle({ show, count, onToggle }: Readonly<{ show: boolean; count: number; onToggle: () => void }>) {
  if (count <= 0) return null;
  return (
    <Button variant="outline" size="sm" onClick={onToggle} className="shrink-0">
      {show ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
      {show ? 'Ocultar inactivos' : `Ver inactivos (${count})`}
    </Button>
  );
}

function GlobalReportContent() {
  const { activeWorkspaceId } = useWorkspace();
  const ws = activeWorkspaceId ?? '';
  const [year, setYear] = useState(FILTER_ALL);
  const [showInactive, setShowInactive] = useState(false);

  const yearParam = year !== FILTER_ALL ? `&year=${year}` : '';
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.talentGlobalReport(ws, { year }),
    queryFn: () => apiFetch<TalentGlobalReport>(`/talents/report/global?workspaceId=${ws}${yearParam}`),
    enabled: !!ws,
  });

  const { data: talents } = useQuery({
    queryKey: queryKeys.talents(ws),
    queryFn: () => apiFetch<Talent[]>(`/talents?workspaceId=${ws}`),
    enabled: !!ws,
  });

  const activeNames = useMemo(
    () => new Set((talents ?? []).filter((t) => t.status === 'ACTIVE').map((t) => t.name)),
    [talents],
  );
  const sueldoPlanilla = useMemo(
    () =>
      (talents ?? [])
        .filter((t) => t.status === 'ACTIVE')
        .flatMap((t) => t.contracts ?? [])
        .filter(
          (c) =>
            c.status === 'ACTIVE' &&
            c.currency === 'PEN' &&
            (c.paymentType ?? '').toLowerCase() === 'planilla' &&
            c.rate,
        )
        .reduce((sum, c) => sum + Number(c.rate), 0),
    [talents],
  );
  const inactiveCount = (talents ?? []).length - activeNames.size;

  const pickColumns = (list: { name: string }[]) => [
    ...new Set(
      list.map((p) => p.name).filter((name) => showInactive || activeNames.size === 0 || activeNames.has(name)),
    ),
  ];

  const incomeColumns = useMemo(
    () => (data ? pickColumns(data.incomeByPerson) : []),
    [data, activeNames, showInactive],
  );
  const expenseColumns = useMemo(
    () => (data ? pickColumns(data.expenseByPerson) : []),
    [data, activeNames, showInactive],
  );

  const incomePersons = useMemo(() => filtrarVisibles(data?.incomeByPerson, showInactive), [data, showInactive]);
  const expensePersons = useMemo(() => filtrarVisibles(data?.expenseByPerson, showInactive), [data, showInactive]);
  const profitabilityPersons = useMemo(
    () => filtrarVisibles(data?.profitabilityByPerson, showInactive),
    [data, showInactive],
  );
  const incomeSort = useSortedRows(incomePersons, INCOME_SORTERS);
  const expenseSort = useSortedRows(expensePersons, EXPENSE_SORTERS);
  const profitSort = useSortedRows(profitabilityPersons, PROFIT_SORTERS);
  const companyRows = useMemo(() => data?.byCompany ?? [], [data]);
  const payTypeRows = useMemo(() => data?.byPaymentType ?? [], [data]);
  const companySort = useSortedRows(companyRows, COMPANY_SORTERS);
  const payTypeSort = useSortedRows(payTypeRows, PAYTYPE_SORTERS);

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const visible = <T extends { status?: string }>(lista: T[]) =>
    showInactive ? lista : lista.filter((p) => (p.status ?? 'ACTIVE') === 'ACTIVE');

  const yearlyPersons = visible(data.yearlyByTalent);

  const categoriaItems = data.expenseByCategory.map((c) => ({
    name: categoriaLedgerLabel(c.name),
    total: c.paid,
  }));
  const hayCategorias = categoriaItems.some((c) => c.name !== 'Sin categoría');

  let incAcum = 0;
  let expAcum = 0;
  const serieAcumulada = data.timeSeries.map((d) => {
    incAcum += Number(d.income);
    expAcum += Number(d.expense);
    return { label: d.label, ingresos: Math.round(incAcum * 100) / 100, egresos: Math.round(expAcum * 100) / 100 };
  });

  const incomeBars: PersonBarDatum[] = incomePersons.map((p) => ({
    id: p.talentId,
    name: p.name,
    value: Number(p.received),
    secondary: Number(p.kept),
  }));
  const expenseBars: PersonBarDatum[] = expensePersons.map((p) => ({
    id: p.talentId,
    name: p.name,
    value: Number(p.paid),
  }));

  return (
    <PageShell
      beforeHeader={
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/mimotech/talentos">
            <ArrowLeft className="mr-2 h-4 w-4" /> Talentos
          </Link>
        </Button>
      }
      title="Reporte general de Mimotalents"
      description="Ingresos y egresos por talento, calculados de sus pagos y estado de cuenta"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <PeruLaboralCalendar latestMonthlySalary={sueldoPlanilla} />
          <GlobalProjectionDialog projection={data.projection} />
          <InactiveToggle show={showInactive} count={inactiveCount} onToggle={() => setShowInactive((v) => !v)} />
          <FilterSelect
            value={year}
            onValueChange={setYear}
            options={data.years.map((y) => ({ value: String(y), label: String(y) }))}
            placeholder="Año"
            allLabel="Todos los años"
          />
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Recibí (MIMOTECH)"
          value={formatMoney(data.totals.received, 'PEN')}
          icon={ArrowDownLeft}
          color="text-info"
          tooltip="Comisión que entró a MIMOTECH por los pagos de los talentos colocados."
        />
        <KPICard
          label="Se quedaron (talentos)"
          value={formatMoney(data.totals.kept, 'PEN')}
          icon={ArrowUpRight}
          color="text-teal"
          tooltip="Parte del pago del cliente que se quedó cada talento."
        />
        <KPICard
          label="Invertido en talentos"
          value={formatMoney(data.totals.paid, 'PEN')}
          icon={Wallet}
          color="text-coral"
          tooltip="Gasto de MIMOTECH en los talentos (formación, equipos, pruebas). No es lo que cobran por su trabajo."
        />
        <KPICard
          label="Neto (MIMOTECH)"
          value={formatMoney(data.totals.net, 'PEN')}
          icon={Landmark}
          color="text-brand"
          tooltip="Recibí menos lo invertido en talentos. Es la ganancia real de la operación."
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        <KPICard
          label="Sueldo total"
          value={formatMoney(data.totals.salary, 'PEN')}
          icon={Banknote}
          color="text-muted-foreground"
          tooltip="Suma de los sueldos brutos que facturaron los clientes por los talentos."
        />
        <KPICard
          label="Deuda total"
          value={formatMoney(data.totals.debt, 'PEN')}
          icon={ReceiptText}
          color="text-warning"
          tooltip="Total de deudas registradas a los talentos, pagadas o no."
        />
        <KPICard
          label="Falta pagar total"
          value={formatMoney(data.totals.pending, 'PEN')}
          icon={ReceiptText}
          color="text-destructive"
          tooltip="De las deudas, lo que sigue sin devolverse a la fecha."
        />
        <KPICard
          label="Pérdida por fraude"
          value={formatMoney(data.totals.fraudLoss, 'PEN')}
          icon={AlertTriangle}
          color="text-destructive"
          tooltip="Egresos y deudas marcados como perdidos: talentos que se fueron sin devolver."
        />
      </div>

      <Tabs defaultValue="ingresos">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ingresos">Por persona</TabsTrigger>
          <TabsTrigger value="anual">Año a año</TabsTrigger>
          <TabsTrigger value="rentabilidad">Rentabilidad</TabsTrigger>
          <TabsTrigger value="empresa">Por empresa</TabsTrigger>
          <TabsTrigger value="pago">Planilla vs RxH</TabsTrigger>
          <TabsTrigger value="serie">Serie temporal</TabsTrigger>
          <TabsTrigger value="egresos">Egresos por persona</TabsTrigger>
          <TabsTrigger value="pivot-ingresos">Ingresos por mes</TabsTrigger>
          <TabsTrigger value="pivot-egresos">Egresos por mes</TabsTrigger>
        </TabsList>

        <TabsContent value="ingresos" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cómo se reparte lo que factura cada talento</CardTitle>
              <p className="text-muted-foreground text-xs">
                La barra completa es el pago del cliente: la parte azul es la comisión que queda en MIMOTECH y la verde
                lo que se lleva el talento. Cuanto más larga la barra, más facturó.
              </p>
            </CardHeader>
            <CardContent>
              {incomeBars.length ? (
                <PersonBar
                  data={incomeBars}
                  color="bg-info"
                  secondaryColor="bg-teal/70"
                  label="Recibí (MIMOTECH)"
                  secondaryLabel="Se quedó (talento)"
                />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin ingresos registrados</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Detalle por talento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <SortableTh
                        label="Talento"
                        sortKey="name"
                        sort={incomeSort.sort}
                        onToggle={incomeSort.toggle}
                        align="left"
                      />
                      <SortableTh label="Sueldo" sortKey="salary" sort={incomeSort.sort} onToggle={incomeSort.toggle} />
                      <SortableTh
                        label="Con descuento"
                        sortKey="withDiscount"
                        sort={incomeSort.sort}
                        onToggle={incomeSort.toggle}
                      />
                      <SortableTh
                        label="Recibí (MIMOTECH)"
                        sortKey="received"
                        sort={incomeSort.sort}
                        onToggle={incomeSort.toggle}
                      />
                      <SortableTh
                        label="Se quedó (talento)"
                        sortKey="kept"
                        sort={incomeSort.sort}
                        onToggle={incomeSort.toggle}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {incomeSort.sorted.map((p) => (
                      <tr key={p.talentId} className="border-b last:border-0">
                        <td className="p-3">
                          <TalentName name={p.name} role={p.role} status={p.status} />
                        </td>
                        <td className="p-3 text-right tabular-nums">
                          <Money value={formatMoney(p.salary, 'PEN')} />
                        </td>
                        <td className="p-3 text-right tabular-nums">
                          <Money value={formatMoney(p.withDiscount, 'PEN')} />
                        </td>
                        <td className="p-3 text-right font-medium tabular-nums text-info">
                          <Money value={formatMoney(p.received, 'PEN')} />
                        </td>
                        <td className="p-3 text-right tabular-nums">
                          <Money value={formatMoney(p.kept, 'PEN')} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="egresos" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Egresos por talento</CardTitle>
              <p className="text-muted-foreground text-xs">
                Lo que MIMOTECH desembolsó en cada persona: formación, equipos, pruebas técnicas. No es lo que cobran
                por su trabajo.
              </p>
            </CardHeader>
            <CardContent>
              {expenseBars.length ? (
                <PersonBar data={expenseBars} color="bg-coral" label="Desembolsado" />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin egresos registrados</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Detalle por talento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <SortableTh
                        label="Talento"
                        sortKey="name"
                        sort={expenseSort.sort}
                        onToggle={expenseSort.toggle}
                        align="left"
                      />
                      <SortableTh
                        label="N.º de egresos"
                        sortKey="count"
                        sort={expenseSort.sort}
                        onToggle={expenseSort.toggle}
                      />
                      <SortableTh label="Pagado" sortKey="paid" sort={expenseSort.sort} onToggle={expenseSort.toggle} />
                      <SortableTh label="Deuda" sortKey="debt" sort={expenseSort.sort} onToggle={expenseSort.toggle} />
                      <SortableTh
                        label="Falta pagar"
                        sortKey="pending"
                        sort={expenseSort.sort}
                        onToggle={expenseSort.toggle}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {expenseSort.sorted.map((p) => (
                      <tr key={p.talentId} className="border-b last:border-0">
                        <td className="p-3">
                          <TalentName name={p.name} role={p.role} status={p.status} />
                        </td>
                        <td className="p-3 text-right tabular-nums text-muted-foreground">{p.count}</td>
                        <td className="p-3 text-right font-medium text-coral tabular-nums">
                          <Money value={formatMoney(p.paid, 'PEN')} />
                        </td>
                        <td className="p-3 text-right tabular-nums text-warning">
                          <Money value={formatMoney(p.debt, 'PEN')} />
                        </td>
                        <td className="p-3 text-right tabular-nums text-destructive">
                          <Money value={formatMoney(p.pending, 'PEN')} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Egresos por categoría</CardTitle>
              <p className="text-xs text-muted-foreground">
                En qué se va lo invertido en talentos. Asigna la categoría al crear o editar cada egreso.
              </p>
            </CardHeader>
            <CardContent>
              {categoriaItems.length ? (
                <>
                  {!hayCategorias && (
                    <p className="mb-4 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      Los egresos existentes aún no tienen categoría. Edita cada egreso y asígnale una para ver este
                      desglose.
                    </p>
                  )}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <CategoryDonut
                      data={categoriaItems.map((c) => ({ name: c.name, value: Number(c.total) }))}
                      height={260}
                    />
                    <DonutList items={categoriaItems} />
                  </div>
                </>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin egresos registrados</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pivot-ingresos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Comisión recibida, mes por mes y talento</CardTitle>
              <p className="text-muted-foreground text-xs">
                Cada fila es un mes y cada columna un talento: el número es la comisión que entró a MIMOTECH por sus
                pagos de ese mes.
              </p>
            </CardHeader>
            <CardContent>
              <PivotTable periods={data.incomePivot} columns={incomeColumns} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pivot-egresos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gasto en talentos, mes por mes</CardTitle>
              <p className="text-muted-foreground text-xs">
                Cada fila es un mes y cada columna un talento: el número es lo que MIMOTECH desembolsó en él (formación,
                equipos, pruebas), no lo que cobra por su trabajo.
              </p>
            </CardHeader>
            <CardContent>
              <PivotTable periods={data.expensePivot} columns={expenseColumns} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anual" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos por talento, año a año</CardTitle>
              <p className="text-sm text-muted-foreground">
                Comisión que quedó en MIMOTECH por cada talento en cada año. Sirve para ver quién creció, quién se
                estancó y quién dejó de generar.
              </p>
            </CardHeader>
            <CardContent>
              <YearlyHeatmap data={yearlyPersons} metric="received" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Egresos por talento, año a año</CardTitle>
              <p className="text-sm text-muted-foreground">
                Lo que MIMOTECH desembolsó en cada talento por año, y cuántos egresos fueron.
              </p>
            </CardHeader>
            <CardContent>
              <YearlyHeatmap data={yearlyPersons} metric="paid" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rentabilidad" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Rentabilidad por talento</CardTitle>
              <p className="text-xs text-muted-foreground">
                Neto = Recibí (MIMOTECH) − Pagado al talento. Margen = Neto / Recibí.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <SortableTh
                      label="Talento"
                      sortKey="name"
                      sort={profitSort.sort}
                      onToggle={profitSort.toggle}
                      align="left"
                    />
                    <SortableTh label="Recibí" sortKey="received" sort={profitSort.sort} onToggle={profitSort.toggle} />
                    <SortableTh label="Pagado" sortKey="paid" sort={profitSort.sort} onToggle={profitSort.toggle} />
                    <SortableTh label="Neto" sortKey="net" sort={profitSort.sort} onToggle={profitSort.toggle} />
                    <SortableTh label="Margen" sortKey="margin" sort={profitSort.sort} onToggle={profitSort.toggle} />
                  </tr>
                </thead>
                <tbody>
                  {profitSort.sorted.map((p) => (
                    <tr key={p.talentId} className="border-b last:border-0">
                      <td className="p-3">
                        <TalentName name={p.name} role={p.role} status={p.status} />
                      </td>
                      <td className="p-3 text-right tabular-nums text-info">
                        <Money value={formatMoney(p.received, 'PEN')} />
                      </td>
                      <td className="p-3 text-right text-coral tabular-nums">
                        <Money value={formatMoney(p.paid, 'PEN')} />
                      </td>
                      <td
                        className={`p-3 text-right font-semibold tabular-nums ${Number(p.net) < 0 ? 'text-destructive' : ''}`}
                      >
                        <Money value={formatMoney(p.net, 'PEN')} />
                      </td>
                      <td className="p-3 text-right tabular-nums text-muted-foreground">{p.margin}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresa" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos por empresa</CardTitle>
              <p className="text-xs text-muted-foreground">
                Qué empresas generan la comisión de MIMOTECH y con qué talentos.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {companyRows.length > 1 && (
                <div className="mb-6">
                  <CategoryDonut
                    data={companyRows.slice(0, 8).map((c) => ({ name: c.name, value: Number(c.received) }))}
                    height={260}
                  />
                </div>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <SortableTh
                      label="Empresa"
                      sortKey="name"
                      sort={companySort.sort}
                      onToggle={companySort.toggle}
                      align="left"
                    />
                    <SortableTh label="Sueldo" sortKey="salary" sort={companySort.sort} onToggle={companySort.toggle} />
                    <SortableTh
                      label="Recibí (MIMOTECH)"
                      sortKey="received"
                      sort={companySort.sort}
                      onToggle={companySort.toggle}
                    />
                    <SortableTh label="Se quedó" sortKey="kept" sort={companySort.sort} onToggle={companySort.toggle} />
                    <SortableTh
                      label="Pagos"
                      sortKey="payments"
                      sort={companySort.sort}
                      onToggle={companySort.toggle}
                    />
                    <th className="p-3">Talentos</th>
                  </tr>
                </thead>
                <tbody>
                  {companySort.sorted.map((c) => (
                    <tr key={c.name} className="border-b last:border-0">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3 text-right tabular-nums">
                        <Money value={formatMoney(c.salary, 'PEN')} />
                      </td>
                      <td className="p-3 text-right font-medium tabular-nums text-info">
                        <Money value={formatMoney(c.received, 'PEN')} />
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        <Money value={formatMoney(c.kept, 'PEN')} />
                      </td>
                      <td className="p-3 text-right text-xs text-muted-foreground">{c.payments}</td>
                      <td className="p-3 text-xs text-muted-foreground">{c.talents.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pago" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Por tipo de pago (Planilla / RxH / CTS / Gratificación / Liquidación)</CardTitle>
              <p className="text-xs text-muted-foreground">
                Cómo se reparte lo que recibió MIMOTECH según el tipo de pago del talento.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {payTypeRows.length > 1 && (
                <div className="mb-6">
                  <CategoryDonut
                    data={payTypeRows.map((p) => ({ name: p.name, value: Number(p.received) }))}
                    height={260}
                  />
                </div>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <SortableTh
                      label="Tipo"
                      sortKey="name"
                      sort={payTypeSort.sort}
                      onToggle={payTypeSort.toggle}
                      align="left"
                    />
                    <SortableTh
                      label="Recibí"
                      sortKey="received"
                      sort={payTypeSort.sort}
                      onToggle={payTypeSort.toggle}
                    />
                    <SortableTh label="Se quedó" sortKey="kept" sort={payTypeSort.sort} onToggle={payTypeSort.toggle} />
                    <SortableTh label="Pagos" sortKey="count" sort={payTypeSort.sort} onToggle={payTypeSort.toggle} />
                  </tr>
                </thead>
                <tbody>
                  {payTypeSort.sorted.map((p) => (
                    <tr key={p.name} className="border-b last:border-0">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-right font-medium tabular-nums text-info">
                        <Money value={formatMoney(p.received, 'PEN')} />
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        <Money value={formatMoney(p.kept, 'PEN')} />
                      </td>
                      <td className="p-3 text-right text-xs text-muted-foreground">{p.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="serie" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia acumulada</CardTitle>
              <p className="text-xs text-muted-foreground">
                Ingresos y egresos sumados mes a mes desde el inicio. La distancia entre las dos áreas es la ganancia
                acumulada de la operación.
              </p>
            </CardHeader>
            <CardContent>
              {serieAcumulada.length ? (
                <IncomeExpenseArea data={serieAcumulada} height={320} />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin datos.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Detalle mensual</CardTitle>
              <p className="text-xs text-muted-foreground">Lo que entró y salió en cada mes, sin acumular.</p>
            </CardHeader>
            <CardContent>
              <TimeSeriesBars data={data.timeSeries} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

export default function GlobalReportPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <GlobalReportContent />
    </WorkspaceGate>
  );
}
