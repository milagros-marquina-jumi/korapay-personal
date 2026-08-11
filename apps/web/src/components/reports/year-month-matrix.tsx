'use client';

import { type HeatmapRow, HeatmapTable } from '@/components/charts/heatmap-table';
import type { MonthlyMatrixRow } from '@/lib/api.types';
import { MONTH_NAMES } from '@/lib/months';

const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3).toUpperCase());

interface Props {
  title: string;
  rows?: MonthlyMatrixRow[];
}

export function YearMonthMatrix({ title, rows }: Readonly<Props>) {
  if (!rows?.length) return null;

  const heatmap: HeatmapRow[] = rows.map((r) => ({
    key: String(r.year),
    label: r.year,
    values: r.months.map(Number),
    total: Number(r.total),
  }));

  return (
    <div>
      <h4 className="mb-3 text-sm font-medium text-muted-foreground">{title}</h4>
      <HeatmapTable rowHeader="Año" columns={MONTH_SHORT} rows={heatmap} totalLabel="Total" minWidth="58rem" />
    </div>
  );
}
