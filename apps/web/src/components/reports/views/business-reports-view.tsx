'use client';

import { formatMoney } from '@korapay/domain';
import { KPICard } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, Landmark, Users } from 'lucide-react';
import { CategoryDonut } from '@/components/charts/category-donut';
import { type HeatmapRow, HeatmapTable } from '@/components/charts/heatmap-table';
import { MonthlyBar, type MonthlyPoint } from '@/components/charts/monthly-bar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { MONTH_SHORT } from '@/components/reports/report-constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/api';
import type { BusinessReports } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useDefaultYear } from '@/lib/use-default-year';

export function BusinessReportsView({ workspaceId }: Readonly<{ workspaceId: string }>) {
  const { data: allYears } = useQuery({
    queryKey: queryKeys.businessReports(workspaceId, { years: true }),
    queryFn: () => apiFetch<BusinessReports>(`/reports/business?workspaceId=${workspaceId}`),
    enabled: !!workspaceId,
    select: (r) => r.years ?? [],
  });

  const [year, setYear] = useDefaultYear(allYears);
  const selectedYear = year !== FILTER_ALL ? Number(year) : undefined;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.businessReports(workspaceId, selectedYear ? { year: selectedYear } : {}),
    queryFn: () =>
      apiFetch<BusinessReports>(
        `/reports/business?workspaceId=${workspaceId}${selectedYear ? `&year=${selectedYear}` : ''}`,
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const allYearsView = year === FILTER_ALL;
  const costDonut = data.costByApp.slice(0, 8).map((c) => ({ name: c.name, value: Number(c.total) }));
  const projectDonut = data.costByProject.slice(0, 8).map((c) => ({ name: c.name, value: Number(c.total) }));

  const flowSeries: MonthlyPoint[] = allYearsView
    ? data.yearlyTotals.map((y) => ({
        label: String(y.year),
        ingresos: Number(y.income),
        egresos: Number(y.cost) + Number(y.teamPayment),
      }))
    : data.monthlyFlow.map((m) => ({
        label: `${MONTH_SHORT[m.month - 1]} ${String(m.year).slice(2)}`,
        ingresos: Number(m.income),
        egresos: Number(m.cost) + Number(m.teamPayment),
      }));

  const appHeatmap: HeatmapRow[] = data.costByAppMonth.map((a) => ({
    key: a.name,
    label: a.name,
    values: a.months,
    total: a.total,
  }));

  const flowRows = allYearsView
    ? data.yearlyTotals.map((y) => ({
        key: String(y.year),
        income: y.income,
        cost: y.cost,
        teamPayment: y.teamPayment,
        utility: y.utility,
      }))
    : data.monthlyFlow.map((m) => ({
        key: m.label,
        income: m.income,
        cost: m.cost,
        teamPayment: m.teamPayment,
        utility: m.utility,
      }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {allYearsView ? 'Todos los años' : `Año ${selectedYear}`} · {data.projectCount} proyectos
        </p>
        {yearFilter}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Ingresos"
          value={formatMoney(data.income, 'PEN')}
          icon={ArrowUpRight}
          color="text-success"
          tooltip="Facturación de los talentos colocados en clientes (NTT DATA, Seidor, Indra, etc.). Su detalle está en MIMOTALENTS."
        />
        <KPICard
          label="Costos"
          value={formatMoney(data.cost, 'PEN')}
          icon={ArrowDownRight}
          color="text-coral"
          tooltip="Servicios e infraestructura (AWS, Render, Fly, Cloudflare)"
        />
        <KPICard
          label="Pagos equipo"
          value={formatMoney(data.teamPayment, 'PEN')}
          icon={Users}
          color="text-info"
          tooltip="Pagos realizados al equipo de desarrollo"
        />
        <KPICard
          label="Utilidad"
          value={formatMoney(data.utility, 'PEN')}
          icon={Landmark}
          color="text-brand"
          tooltip="Ingresos menos costos y pagos de equipo"
        />
      </div>

      <Tabs defaultValue="flujo">
        <TabsList>
          <TabsTrigger value="flujo">Flujo</TabsTrigger>
          <TabsTrigger value="costos">Por aplicación</TabsTrigger>
          <TabsTrigger value="proyectos">Por proyecto</TabsTrigger>
          <TabsTrigger value="detalle">Costos por mes</TabsTrigger>
        </TabsList>

        <TabsContent value="flujo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos vs egresos por {allYearsView ? 'año' : 'mes'}</CardTitle>
            </CardHeader>
            <CardContent>
              {flowSeries.length ? (
                <>
                  <MonthlyBar data={flowSeries} secondName="Costos + equipo" />
                  <div className="mt-6 overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40 text-left">
                          <th className="px-3 py-2.5 font-medium">{allYearsView ? 'Año' : 'Mes'}</th>
                          <th className="px-3 py-2.5 text-right font-medium">Ingresos</th>
                          <th className="px-3 py-2.5 text-right font-medium">Costos</th>
                          <th className="px-3 py-2.5 text-right font-medium">Equipo</th>
                          <th className="px-3 py-2.5 text-right font-medium">Utilidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {flowRows.map((row) => (
                          <tr key={row.key} className="border-b last:border-0">
                            <td className="px-3 py-2.5 font-semibold capitalize">{row.key}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-success">
                              {formatMoney(row.income, 'PEN')}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-coral">
                              {formatMoney(row.cost, 'PEN')}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-info">
                              {formatMoney(row.teamPayment, 'PEN')}
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-brand-strong dark:text-brand">
                              {formatMoney(row.utility, 'PEN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin datos</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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

        <TabsContent value="proyectos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Costos por proyecto</CardTitle>
            </CardHeader>
            <CardContent>
              {projectDonut.length ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <CategoryDonut data={projectDonut} />
                  <div className="divide-y">
                    {data.costByProject.map((c) => (
                      <div key={c.name} className="flex items-center justify-between py-2 text-sm">
                        <span className="truncate">{c.name}</span>
                        <span className="font-medium tabular-nums">{formatMoney(c.total, 'PEN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin costos por proyecto</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detalle" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Costos por aplicación y mes</CardTitle>
            </CardHeader>
            <CardContent>
              {appHeatmap.length ? (
                <HeatmapTable rowHeader="Aplicación" columns={MONTH_SHORT} rows={appHeatmap} minWidth="52rem" />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin datos</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
