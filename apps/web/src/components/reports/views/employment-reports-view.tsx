'use client';

import { formatMoney } from '@korapay/domain';
import { KPICard, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Landmark, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { CategoryDonut } from '@/components/charts/category-donut';
import { type HeatmapRow, HeatmapTable } from '@/components/charts/heatmap-table';
import { MonthlyBar, type MonthlyPoint } from '@/components/charts/monthly-bar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { CompaniesMonthDialog, type CompaniesMonthSelection } from '@/components/reports/companies-month-dialog';
import { CompanyDurationTable } from '@/components/reports/company-duration-table';
import { EmploymentBreakdownTab } from '@/components/reports/employment-breakdown-tab';
import { DURATION_LIMITS, MONTH_SHORT } from '@/components/reports/report-constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/api';
import type { EmploymentReports, TaxObligation } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useDefaultYear } from '@/lib/use-default-year';

export function EmploymentReportsView({ workspaceId }: Readonly<{ workspaceId: string }>) {
  const { data: allYears } = useQuery({
    queryKey: queryKeys.employmentReports(workspaceId, { years: true }),
    queryFn: () => apiFetch<EmploymentReports>(`/reports/employment?workspaceId=${workspaceId}`),
    enabled: !!workspaceId,
    select: (r) => r.years ?? [],
  });

  const [year, setYear] = useDefaultYear(allYears);
  const [companiesDetail, setCompaniesDetail] = useState<CompaniesMonthSelection | null>(null);
  const [durationLimit, setDurationLimit] = useState<string>('5');
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

  const averageSeries: MonthlyPoint[] = data.yearlyTotals.map((y) => ({
    label: String(y.year),
    ingresos: Number(y.average),
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

  const openCompaniesDetail = (rowKey: string, monthIndex: number) => {
    const row = data.companiesPerMonth.find((r) => String(r.year) === rowKey);
    if (!row) return;
    setCompaniesDetail({ year: rowKey, monthIndex, companies: row.monthDetail?.[monthIndex] ?? [] });
  };

  const openYearDetail = (rowKey: string) => {
    const row = data.companiesPerMonth.find((r) => String(r.year) === rowKey);
    if (!row) return;
    setCompaniesDetail({ year: rowKey, monthIndex: null, companies: row.totalDetail ?? [] });
  };

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
          <TabsTrigger value="periodos">Trimestres y meses</TabsTrigger>
          <TabsTrigger value="empresa">Por empresa</TabsTrigger>
          <TabsTrigger value="concepto">Por concepto</TabsTrigger>
          <TabsTrigger value="actividad">Empresas por mes</TabsTrigger>
          <TabsTrigger value="duracion">Duración por empresa</TabsTrigger>
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
                  {allYearsView ? (
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div>
                        <h4 className="mb-3 text-sm font-medium text-muted-foreground">Total del año</h4>
                        <MonthlyBar data={timeSeries} firstName="Total" />
                      </div>
                      <div>
                        <h4 className="mb-3 text-sm font-medium text-muted-foreground">Promedio mensual</h4>
                        <MonthlyBar data={averageSeries} firstName="Promedio" />
                      </div>
                    </div>
                  ) : (
                    <MonthlyBar data={timeSeries} firstName="Ingresos" />
                  )}
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

        <TabsContent value="periodos" className="mt-4">
          {data.breakdown ? (
            <EmploymentBreakdownTab breakdown={data.breakdown} />
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">Sin datos</p>
          )}
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
                <>
                  <HeatmapTable
                    rowHeader="Año"
                    columns={MONTH_SHORT}
                    rows={heatmapRows}
                    totalLabel="Únicas"
                    format={(v) => (v === 0 ? '—' : String(v))}
                    minWidth="46rem"
                    legend={false}
                    onCellClick={openCompaniesDetail}
                    onTotalClick={openYearDetail}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Haz clic en un número para ver las empresas y sus clientes. La columna Únicas muestra la lista
                    completa del año sin repetir empresas.
                  </p>
                </>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin datos</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="duracion" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>Duración por empresa</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tiempo acumulado en cada empresa. Si hubo reingresos, los periodos se suman: haz clic en la empresa
                  para ver cada contrato con sus fechas.
                </p>
              </div>
              <FilterSelect
                value={durationLimit}
                onValueChange={setDurationLimit}
                options={DURATION_LIMITS}
                placeholder="Mostrar"
                allLabel="Todas"
              />
            </CardHeader>
            <CardContent>
              <CompanyDurationTable
                data={data.companyDurations ?? []}
                limit={durationLimit === FILTER_ALL ? undefined : Number(durationLimit)}
              />
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
                        <th className="px-3 py-2.5 text-center font-medium">Cuotas</th>
                        <th className="px-3 py-2.5 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentaRows.map((r) => (
                        <tr key={r.id} className="border-b last:border-0">
                          <td className="px-3 py-2.5 font-semibold">{r.year}</td>
                          <td className="px-3 py-2.5">{r.name}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(r.amount, 'PEN')}</td>
                          <td className="px-3 py-2.5 text-center tabular-nums">
                            {r.installments ? (
                              <span className={r.paidInstallments === r.installments ? 'text-success' : undefined}>
                                {r.paidInstallments ?? 0}/{r.installments}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
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

      <CompaniesMonthDialog selection={companiesDetail} onOpenChange={(o) => !o && setCompaniesDetail(null)} />
    </div>
  );
}
