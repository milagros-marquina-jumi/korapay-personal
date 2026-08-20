'use client';

import { formatMoney } from '@korapay/domain';
import { KPICard } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { Lock, Tag, TrendingUp, Wallet } from 'lucide-react';
import { CategoryDonut } from '@/components/charts/category-donut';
import { DonutList } from '@/components/charts/donut-list';
import { HeatmapTable } from '@/components/charts/heatmap-table';
import { MonthlyBar, type MonthlyPoint } from '@/components/charts/monthly-bar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { buildCategoryHeatmap, MONTH_SHORT } from '@/components/reports/report-constants';
import { YearMonthMatrix } from '@/components/reports/year-month-matrix';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/api';
import type { PersonalReports } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useDefaultYear } from '@/lib/use-default-year';

export function PersonalReportsView({ workspaceId }: Readonly<{ workspaceId: string }>) {
  const { data: todos } = useQuery({
    queryKey: queryKeys.personalReports(workspaceId, {}),
    queryFn: () => apiFetch<PersonalReports>(`/reports/personal?workspaceId=${workspaceId}`),
    enabled: !!workspaceId,
  });
  const allYears = todos?.years;

  const [year, setYear] = useDefaultYear(allYears);
  const selectedYear = year !== FILTER_ALL ? Number(year) : undefined;

  const { data: delAnio, isLoading: cargandoAnio } = useQuery({
    queryKey: queryKeys.personalReports(workspaceId, { year: selectedYear }),
    queryFn: () => apiFetch<PersonalReports>(`/reports/personal?workspaceId=${workspaceId}&year=${selectedYear}`),
    enabled: !!workspaceId && !!selectedYear,
    placeholderData: (prev) => prev,
  });

  const data = selectedYear ? delAnio : todos;
  const isLoading = selectedYear ? cargandoAnio && !delAnio : !todos;

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
  const matrices = data.matrices;

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

  // Sin categorias registradas la pestaña queda vacia: no se muestra.
  const hasCategories = (data.expenseByCategory ?? []).length > 0;

  const gastado = data.incomeVsExpense.reduce((s, m) => s + Number(m.expense), 0);
  const mesesConGasto = data.incomeVsExpense.filter((m) => Number(m.expense) > 0).length;
  const promedioMensual = mesesConGasto > 0 ? gastado / mesesConGasto : 0;
  const categoriaTop = (data.expenseByCategory ?? []).reduce(
    (top, c) => (Number(c.total) > Number(top?.total ?? 0) ? c : top),
    undefined as { name: string; total: string } | undefined,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <KPICard
          label={allYearsView ? 'Gastado total' : `Gastado ${year}`}
          value={formatMoney(String(gastado), 'PEN')}
          icon={Wallet}
          color="text-coral"
          tooltip="Suma de todos los egresos del periodo, pagados o pendientes."
        />
        <KPICard
          label="Promedio mensual"
          value={formatMoney(String(promedioMensual), 'PEN')}
          icon={TrendingUp}
          color="text-info"
          tooltip="Gasto total dividido entre los meses que registran egresos."
        />
        <KPICard
          label="Mayor categoría"
          value={categoriaTop ? categoriaTop.name : '—'}
          icon={Tag}
          color="text-warning"
          tooltip={
            categoriaTop
              ? `${categoriaTop.name} concentra ${formatMoney(categoriaTop.total, 'PEN')} del gasto del periodo.`
              : 'Aún no hay gastos categorizados.'
          }
        />
      </div>

      <Tabs defaultValue={hasCategories ? 'categoria' : 'mes'}>
        <TabsList>
          {hasCategories && <TabsTrigger value="categoria">Gastos por categoría</TabsTrigger>}
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
                    <DonutList items={data.expenseByCategory} />
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
                  <div className="mt-6">
                    <YearMonthMatrix title="Egresos por año y mes" rows={matrices?.expenseByMonth} />
                  </div>
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
                <div className="space-y-6">
                  <MonthlyBar data={incomeExpenseData} />
                  <YearMonthMatrix title="Ingresos por año y mes" rows={matrices?.incomeByMonth} />
                  <YearMonthMatrix title="Egresos por año y mes" rows={matrices?.expenseByMonth} />
                </div>
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
                  tooltip="Gastos recurrentes que se repiten cada mes (etiquetados como fijos): alquiler, suscripciones, servicios."
                />
                <KPICard
                  label="Gasto no fijo"
                  value={formatMoney(data.fixedVsVariable.variable, 'PEN')}
                  icon={TrendingUp}
                  color="text-info"
                  tooltip="Gastos variables u ocasionales. Es donde suele haber espacio para recortar."
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
              <YearMonthMatrix title="Gasto fijo por año y mes" rows={matrices?.fixedByMonth} />
              <YearMonthMatrix title="Gasto no fijo por año y mes" rows={matrices?.variableByMonth} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
