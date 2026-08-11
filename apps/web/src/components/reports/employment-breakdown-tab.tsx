'use client';

import { useState } from 'react';
import { type HeatmapRow, HeatmapTable } from '@/components/charts/heatmap-table';
import { type YearSeries, YearSeriesChart } from '@/components/charts/year-series-chart';
import { QuarterRanking } from '@/components/reports/quarter-ranking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EmploymentBreakdown } from '@/lib/api.types';
import { MONTH_NAMES } from '@/lib/months';

const SCOPE_ALL = 'all';
const SCOPE_SALARY = 'salary';

const SCOPE_OPTIONS = [
  { value: SCOPE_ALL, label: 'Con extraordinarios' },
  { value: SCOPE_SALARY, label: 'Solo sueldos y empresa' },
];

const QUARTERS = ['T1', 'T2', 'T3', 'T4'];
const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3).toUpperCase());

interface Props {
  breakdown: EmploymentBreakdown;
}

function toSeries(rows: { year: number; months?: string[]; quarters?: string[] }[]): YearSeries[] {
  return rows.map((r) => ({
    year: r.year,
    values: (r.months ?? r.quarters ?? []).map(Number),
  }));
}

function toHeatmap(rows: { year: number; months?: string[]; quarters?: string[]; total: string }[]): HeatmapRow[] {
  return rows.map((r) => ({
    key: String(r.year),
    label: r.year,
    values: (r.months ?? r.quarters ?? []).map(Number),
    total: Number(r.total),
  }));
}

export function EmploymentBreakdownTab({ breakdown }: Readonly<Props>) {
  const [scope, setScope] = useState<string>(SCOPE_ALL);
  const isAll = scope === SCOPE_ALL;

  const monthly = isAll ? breakdown.monthlyAll : breakdown.monthlySalary;
  const quarterly = isAll ? breakdown.quarterlyAll : breakdown.quarterlySalary;

  const scopeNote = isAll
    ? 'Incluye liquidación, gratificación, CTS, utilidades, AFP y pagos de empresa.'
    : 'Solo el sueldo recurrente de cada empresa; excluye liquidación, gratificación, CTS, utilidades, AFP y pagos de empresa.';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">{scopeNote}</p>
        <Select value={scope} onValueChange={setScope}>
          <SelectTrigger className="h-10 w-56" aria-label="Alcance del reporte">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCOPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingresos netos por mes</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Pasa el cursor sobre un punto para ver el monto de ese mes.
          </p>
        </CardHeader>
        <CardContent>
          {monthly.length ? (
            <div className="space-y-5">
              <YearSeriesChart series={toSeries(monthly)} categories={MONTH_SHORT} variant="line" height={400} />
              <HeatmapTable
                rowHeader="Año"
                columns={MONTH_SHORT}
                rows={toHeatmap(monthly)}
                totalLabel="Total"
                minWidth="58rem"
              />
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">Sin datos</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingresos por trimestre</CardTitle>
        </CardHeader>
        <CardContent>
          {quarterly.length ? (
            <div className="space-y-5">
              <YearSeriesChart series={toSeries(quarterly)} categories={QUARTERS} variant="bar" height={360} />
              <HeatmapTable
                rowHeader="Año"
                columns={QUARTERS}
                rows={toHeatmap(quarterly)}
                totalLabel="Total"
                minWidth="34rem"
              />
              <QuarterRanking rows={quarterly} />
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">Sin datos</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
