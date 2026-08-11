'use client';

import { formatMoney } from '@korapay/domain';
import { KPICard, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Lock,
  ReceiptText,
  TrendingUp,
  Users,
} from 'lucide-react';
import { CategoryDonut, type HeatmapRow, HeatmapTable, MonthlyBar, type MonthlyPoint } from '@/components/charts';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { PageShell } from '@/components/layout/page-shell';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/api';
import type { BusinessReports, EmploymentReports, PersonalReports, TaxObligation } from '@/lib/api.types';
import { MONTH_NAMES } from '@/lib/months';
import { queryKeys } from '@/lib/query-keys';
import { useDefaultYear } from '@/lib/use-default-year';

const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

const TOP_CATEGORIES = 10;

function buildCategoryHeatmap(yearly: PersonalReports['yearlyByCategory'] | undefined) {
  if (!yearly?.length) return null;

  const totals = new Map<string, number>();
  for (const y of yearly) {
    for (const c of y.categories) totals.set(c.name, (totals.get(c.name) ?? 0) + Number(c.total));
  }
  const columns = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_CATEGORIES)
    .map(([name]) => name);

  if (!columns.length) return null;

  const rows = yearly.map((y) => {
    const byName = new Map(y.categories.map((c) => [c.name, Number(c.total)]));
    const values = columns.map((name) => byName.get(name) ?? 0);
    return {
      key: String(y.year),
      label: y.year,
      values,
      total: y.categories.reduce((sum, c) => sum + Number(c.total), 0),
    };
  });

  return { columns, rows };
}

function PersonalReportsView({ workspaceId }: Readonly<{ workspaceId: string }>) {
  const { data: allYears } = useQuery({
    queryKey: queryKeys.personalReports(workspaceId, { years: true }),
    queryFn: () => apiFetch<PersonalReports>(`/reports/personal?workspaceId=${workspaceId}`),
    enabled: !!workspaceId,
    select: (r) => r.years ?? [],
  });

  const [year, setYear] = useDefaultYear(allYears);
  const selectedYear = year !== FILTER_ALL ? Number(year) : undefined;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.personalReports(workspaceId, selectedYear ? { year: selectedYear } : {}),
    queryFn: () =>
      apiFetch<PersonalReports>(
        `/reports/personal?workspaceId=${workspaceId}${selectedYear ? `&year=${selectedYear}` : ''}`,
      ),
    enabled: !!workspaceId,
    placeholderData: (prev) => prev,
  });

  const yearFilter = (
    <FilterSelect
      value={year}
      onValueChange={setYear}
      options={(allYears ?? []).map((y) => ({ value: String(y), label: String(y) }))}
      placeholder="Año"
      allLabel="Todos los años"
    />
  );

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    );
  }

  const allYearsView = year === FILTER_ALL;

  const donutData = data.expenseByCategory.slice(0, 8).map((c) => ({ name: c.name, value: Number(c.total) }));

  const incomeExpenseData: MonthlyPoint[] = allYearsView
    ? (data.yearlyTotals ?? []).map((y) => ({
        label: String(y.year),
        ingresos: Number(y.income),
        egresos: Number(y.expense),
      }))
    : data.incomeVsExpense.slice(-12).map((m) => ({
        label: `${MONTH_SHORT[m.month - 1]} ${String(m.year).slice(2)}`,
        ingresos: Number(m.income),
        egresos: Number(m.expense),
      }));

  const fixedVariableData: MonthlyPoint[] = allYearsView
    ? (data.yearlyTotals ?? []).map((y) => ({
        label: String(y.year),
        ingresos: Number(y.fixed),
        egresos: Number(y.variable),
      }))
    : data.monthlyFixedVsVariable.map((m) => ({
        label: `${MONTH_SHORT[m.month - 1]} ${String(m.year).slice(2)}`,
        ingresos: Number(m.fixed),
        egresos: Number(m.variable),
      }));

  const categoryHeatmap = buildCategoryHeatmap(allYearsView ? data.yearlyByCategory : undefined);

  const fixed = Number(data.fixedVsVariable.fixed);
  const variable = Number(data.fixedVsVariable.variable);
  const totalFixedVar = fixed + variable;
  const fixedPct = totalFixedVar > 0 ? (fixed / totalFixedVar) * 100 : 0;

  return (
    <Tabs defaultValue="categoria">
      <TabsList>
        <TabsTrigger value="categoria">Gastos por categoría</TabsTrigger>
        <TabsTrigger value="mes">Ingresos vs egresos</TabsTrigger>
        <TabsTrigger value="fijo">Fijo vs no fijo</TabsTrigger>
      </TabsList>

      <TabsContent value="categoria" className="mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Gastos por categoría</CardTitle>
            {yearFilter}
          </CardHeader>
          <CardContent>
            {donutData.length ? (
              <>
                <div className="grid gap-6 lg:grid-cols-2">
                  <CategoryDonut data={donutData} />
                  <div className="divide-y">
                    {data.expenseByCategory.map((c) => (
                      <div key={c.name} className="flex items-center justify-between py-2 text-sm">
                        <span className="truncate">{c.name}</span>
                        <span className="tabular-nums font-medium">{formatMoney(c.total, 'PEN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {allYearsView && data.yearlyTotals?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="mb-3 text-sm font-medium text-muted-foreground">Egresos por año</h4>
                    <MonthlyBar
                      data={data.yearlyTotals.map((y) => ({
                        label: String(y.year),
                        ingresos: 0,
                        egresos: Number(y.expense),
                      }))}
                    />
                  </div>
                )}
                {allYearsView && categoryHeatmap && (
                  <div className="mt-6">
                    <h4 className="mb-3 text-sm font-medium text-muted-foreground">Categorías por año</h4>
                    <HeatmapTable
                      rowHeader="Año"
                      columns={categoryHeatmap.columns}
                      rows={categoryHeatmap.rows}
                      minWidth="48rem"
                    />
                  </div>
                )}
                {!allYearsView && data.incomeVsExpense.length > 0 && (
                  <div className="mt-6">
                    <h4 className="mb-3 text-sm font-medium text-muted-foreground">Egresos por mes</h4>
                    <MonthlyBar
                      data={data.incomeVsExpense.map((m) => ({
                        label: `${MONTH_SHORT[m.month - 1]} ${String(m.year).slice(2)}`,
                        ingresos: 0,
                        egresos: Number(m.expense),
                      }))}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Sin gastos registrados</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="mes" className="mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Ingresos vs egresos por {allYearsView ? 'año' : 'mes'}</CardTitle>
            {yearFilter}
          </CardHeader>
          <CardContent>
            {incomeExpenseData.length ? (
              <MonthlyBar data={incomeExpenseData} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Sin datos suficientes</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="fijo" className="mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Gasto fijo vs no fijo</CardTitle>
            {yearFilter}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <KPICard
                label="Gasto fijo"
                value={formatMoney(data.fixedVsVariable.fixed, 'PEN')}
                icon={Lock}
                color="text-warning"
              />
              <KPICard
                label="Gasto no fijo"
                value={formatMoney(data.fixedVsVariable.variable, 'PEN')}
                icon={TrendingUp}
                color="text-info"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Fijo {Math.round(fixedPct)}%</span>
                <span>No fijo {Math.round(100 - fixedPct)}%</span>
              </div>
              <Progress value={fixedPct} />
            </div>
            {fixedVariableData.length > 0 && (
              <MonthlyBar
                data={fixedVariableData}
                firstName="Fijo"
                firstColor="#f59e0b"
                secondName="No fijo"
                secondColor="#3b82f6"
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function BusinessReportsView({ workspaceId }: { workspaceId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.businessReports(workspaceId),
    queryFn: () => apiFetch<BusinessReports>(`/reports/business?workspaceId=${workspaceId}`),
    enabled: !!workspaceId,
    placeholderData: (prev) => prev,
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const costDonut = data.costByApp.slice(0, 8).map((c) => ({ name: c.name, value: Number(c.total) }));

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Ingresos" value={formatMoney(data.income, 'PEN')} icon={ArrowUpRight} color="text-success" />
        <KPICard label="Costos" value={formatMoney(data.cost, 'PEN')} icon={ArrowDownRight} color="text-coral" />
        <KPICard label="Pagos equipo" value={formatMoney(data.teamPayment, 'PEN')} icon={Users} color="text-info" />
        <KPICard label="Utilidad" value={formatMoney(data.utility, 'PEN')} icon={Landmark} color="text-brand" />
      </div>

      <Tabs defaultValue="costos">
        <TabsList>
          <TabsTrigger value="costos">Costos por aplicación</TabsTrigger>
          <TabsTrigger value="equipo">Pagos por persona</TabsTrigger>
          <TabsTrigger value="talentos">Talentos</TabsTrigger>
        </TabsList>

        <TabsContent value="costos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Costos por aplicación</CardTitle>
            </CardHeader>
            <CardContent>
              {costDonut.length ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <CategoryDonut data={costDonut} />
                  <div className="divide-y">
                    {data.costByApp.map((c) => (
                      <div key={c.name} className="flex items-center justify-between py-2 text-sm">
                        <span className="truncate">{c.name}</span>
                        <span className="font-medium tabular-nums">{formatMoney(c.total, 'PEN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin costos registrados</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagos de equipo por persona</CardTitle>
            </CardHeader>
            <CardContent>
              {data.teamByPerson.length ? (
                <div className="divide-y">
                  {data.teamByPerson.map((p) => (
                    <div key={p.name} className="flex items-center justify-between py-2 text-sm">
                      <span className="truncate">{p.name}</span>
                      <span className="font-medium tabular-nums">{formatMoney(p.total, 'PEN')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin pagos de equipo</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="talentos" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              label="Pagado a talentos"
              value={formatMoney(data.talent.paid, 'PEN')}
              icon={ArrowDownRight}
              color="text-coral"
            />
            <KPICard
              label="Deuda"
              value={formatMoney(data.talent.debt, 'PEN')}
              icon={ReceiptText}
              color="text-warning"
            />
            <KPICard
              label="Falta pagar"
              value={formatMoney(data.talent.pending, 'PEN')}
              icon={AlertTriangle}
              color="text-destructive"
            />
            <KPICard
              label="Saldo talentos"
              value={formatMoney(data.talent.balance, 'PEN')}
              icon={Landmark}
              color="text-brand"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmploymentReportsView({ workspaceId }: Readonly<{ workspaceId: string }>) {
  const { data: allYears } = useQuery({
    queryKey: queryKeys.employmentReports(workspaceId, { years: true }),
    queryFn: () => apiFetch<EmploymentReports>(`/reports/employment?workspaceId=${workspaceId}`),
    enabled: !!workspaceId,
    select: (r) => r.years ?? [],
  });

  const [year, setYear] = useDefaultYear(allYears);
  const selectedYear = year !== FILTER_ALL ? Number(year) : undefined;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.employmentReports(workspaceId, selectedYear ? { year: selectedYear } : {}),
    queryFn: () =>
      apiFetch<EmploymentReports>(
        `/reports/employment?workspaceId=${workspaceId}${selectedYear ? `&year=${selectedYear}` : ''}`,
      ),
    enabled: !!workspaceId,
    placeholderData: (prev) => prev,
  });

  const { data: renta } = useQuery({
    queryKey: queryKeys.taxObligations(workspaceId),
    queryFn: () => apiFetch<TaxObligation[]>(`/tax-obligations?workspaceId=${workspaceId}`),
    enabled: !!workspaceId,
  });

  const yearFilter = (
    <FilterSelect
      value={year}
      onValueChange={setYear}
      options={(allYears ?? []).map((y) => ({ value: String(y), label: String(y) }))}
      placeholder="Año"
      allLabel="Todos los años"
    />
  );

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const allYearsView = year === FILTER_ALL;
  const companyDonut = data.incomeByCompany.slice(0, 8).map((c) => ({ name: c.name, value: Number(c.total) }));
  const conceptDonut = data.incomeByConcept.slice(0, 8).map((c) => ({ name: c.name, value: Number(c.total) }));

  const timeSeries: MonthlyPoint[] = allYearsView
    ? data.yearlyTotals.map((y) => ({ label: String(y.year), ingresos: Number(y.total), egresos: 0 }))
    : data.incomeByMonth.map((m) => ({
        label: `${MONTH_SHORT[m.month - 1]} ${String(m.year).slice(2)}`,
        ingresos: Number(m.total),
        egresos: 0,
      }));

  const currentYearRow = data.yearlyTotals.find((y) => y.year === selectedYear);
  const totalGeneral = data.yearlyTotals.reduce((s, y) => s + Number(y.total), 0);
  const empresasActivas = allYearsView
    ? new Set(data.incomeByCompany.map((c) => c.name)).size
    : (currentYearRow?.companies ?? 0);
  const promedio = allYearsView
    ? data.yearlyTotals.reduce((s, y) => s + Number(y.average), 0) / (data.yearlyTotals.length || 1)
    : Number(currentYearRow?.average ?? 0);

  const rentaRows = renta ?? [];
  const rentaPending = rentaRows.filter((r) => r.status !== 'PAID').reduce((s, r) => s + Number(r.amount), 0);

  const heatmapRows: HeatmapRow[] = data.companiesPerMonth.map((r) => ({
    key: String(r.year),
    label: r.year,
    values: r.months,
    total: r.total,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label={allYearsView ? 'Ingresos totales' : `Ingresos ${selectedYear}`}
          value={formatMoney(allYearsView ? String(totalGeneral) : data.total, 'PEN')}
          icon={ArrowUpRight}
          color="text-success"
          tooltip="Suma de los montos netos recibidos, ya descontada la planilla"
        />
        <KPICard
          label="Promedio mensual"
          value={formatMoney(String(promedio), 'PEN')}
          icon={TrendingUp}
          color="text-info"
          tooltip="Total dividido entre los meses con ingresos registrados"
        />
        <KPICard
          label="Empresas"
          value={String(empresasActivas)}
          icon={Users}
          color="text-brand"
          tooltip="Empresas distintas que te pagaron en el periodo"
        />
        <KPICard
          label="Renta pendiente"
          value={formatMoney(String(rentaPending), 'PEN')}
          icon={Landmark}
          color="text-warning"
          tooltip="Obligaciones de renta anual aún no pagadas"
        />
      </div>

      <Tabs defaultValue="evolucion">
        <TabsList>
          <TabsTrigger value="evolucion">Evolución</TabsTrigger>
          <TabsTrigger value="empresa">Por empresa</TabsTrigger>
          <TabsTrigger value="concepto">Por concepto</TabsTrigger>
          <TabsTrigger value="actividad">Empresas por mes</TabsTrigger>
          <TabsTrigger value="renta">Renta anual</TabsTrigger>
        </TabsList>

        <TabsContent value="evolucion" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Ingresos por {allYearsView ? 'año' : 'mes'}</CardTitle>
              {yearFilter}
            </CardHeader>
            <CardContent>
              {timeSeries.length ? (
                <>
                  <MonthlyBar data={timeSeries} firstName="Ingresos" />
                  {allYearsView && (
                    <div className="mt-6 overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40 text-left">
                            <th className="px-3 py-2.5 font-medium">Año</th>
                            <th className="px-3 py-2.5 text-right font-medium">Total</th>
                            <th className="px-3 py-2.5 text-right font-medium">Promedio mensual</th>
                            <th className="px-3 py-2.5 text-right font-medium">Empresas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.yearlyTotals.map((y) => (
                            <tr key={y.year} className="border-b last:border-0">
                              <td className="px-3 py-2.5 font-semibold">{y.year}</td>
                              <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-success">
                                {formatMoney(y.total, 'PEN')}
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(y.average, 'PEN')}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums">{y.companies}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin ingresos registrados</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresa" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Ingresos por empresa</CardTitle>
              {yearFilter}
            </CardHeader>
            <CardContent>
              {companyDonut.length ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <CategoryDonut data={companyDonut} />
                  <div className="divide-y">
                    {data.incomeByCompany.map((c) => (
                      <div key={c.name} className="flex items-center justify-between py-2 text-sm">
                        <span className="truncate">{c.name}</span>
                        <span className="font-medium tabular-nums">{formatMoney(c.total, 'PEN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin datos</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="concepto" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Ingresos por concepto</CardTitle>
              {yearFilter}
            </CardHeader>
            <CardContent>
              {conceptDonut.length ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <CategoryDonut data={conceptDonut} />
                  <div className="divide-y">
                    {data.incomeByConcept.map((c) => (
                      <div key={c.name} className="flex items-center justify-between py-2 text-sm">
                        <span className="truncate">{c.name}</span>
                        <span className="font-medium tabular-nums">{formatMoney(c.total, 'PEN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin datos</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actividad" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Empresas activas por mes</CardTitle>
            </CardHeader>
            <CardContent>
              {heatmapRows.length ? (
                <HeatmapTable
                  rowHeader="Año"
                  columns={MONTH_SHORT}
                  rows={heatmapRows}
                  totalLabel="Únicas"
                  format={(v) => (v === 0 ? '—' : String(v))}
                  minWidth="46rem"
                  legend={false}
                />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin datos</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renta" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Obligaciones de renta</CardTitle>
            </CardHeader>
            <CardContent>
              {rentaRows.length ? (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <th className="px-3 py-2.5 font-medium">Año</th>
                        <th className="px-3 py-2.5 font-medium">Concepto</th>
                        <th className="px-3 py-2.5 text-right font-medium">Monto</th>
                        <th className="px-3 py-2.5 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentaRows.map((r) => (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="px-3 py-2.5 font-semibold">{r.year}</td>
                          <td className="px-3 py-2.5">{r.name}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(r.amount, 'PEN')}</td>
                          <td className="px-3 py-2.5">
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin obligaciones registradas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ReportesPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const isBusiness = activeWorkspace?.type === 'BUSINESS';
  const isEmployment = activeWorkspace?.type === 'EMPLOYMENT';
  const isPersonal = activeWorkspace?.type === 'PERSONAL' || activeWorkspace?.type === 'SHARED';

  return (
    <PageShell title="Reportes" description="Resumen y análisis financiero">
      {activeWorkspaceId && isBusiness ? (
        <BusinessReportsView workspaceId={activeWorkspaceId} />
      ) : activeWorkspaceId && isEmployment ? (
        <EmploymentReportsView workspaceId={activeWorkspaceId} />
      ) : activeWorkspaceId && isPersonal ? (
        <PersonalReportsView workspaceId={activeWorkspaceId} />
      ) : (
        <p className="text-sm text-muted-foreground">Selecciona un workspace para ver sus reportes.</p>
      )}
    </PageShell>
  );
}
