'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface HeatmapRow {
  key: string;
  label: ReactNode;
  values: (string | number | null)[];
  total?: string | number;
}

interface Props {
  columns: string[];
  rows: HeatmapRow[];
  rowHeader?: string;
  totalLabel?: string;
  columnTotals?: (string | number)[];
  grandTotal?: string | number;
  format?: (value: number) => string;
  emptyCell?: string;
  minWidth?: string;
  legend?: boolean;
}

const STEPS = [
  { limit: 0.001, cell: 'bg-transparent text-muted-foreground/40', label: 'Sin dato' },
  { limit: 0.2, cell: 'bg-brand/[0.07] text-foreground', label: 'Muy bajo' },
  { limit: 0.4, cell: 'bg-brand/[0.16] text-foreground', label: 'Bajo' },
  { limit: 0.6, cell: 'bg-brand/[0.3] text-foreground', label: 'Medio' },
  { limit: 0.8, cell: 'bg-brand/[0.48] text-foreground', label: 'Alto' },
  { limit: Number.POSITIVE_INFINITY, cell: 'bg-brand/[0.68] font-semibold text-foreground', label: 'Máximo' },
];

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value);
}

function defaultFormat(value: number) {
  return value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function HeatmapTable({
  columns,
  rows,
  rowHeader = '',
  totalLabel = 'Total',
  columnTotals,
  grandTotal,
  format = defaultFormat,
  emptyCell = '—',
  minWidth = '62rem',
  legend = true,
}: Readonly<Props>) {
  const all = rows.flatMap((r) => r.values.map(toNumber)).filter((v) => v > 0);
  const min = all.length ? Math.min(...all) : 0;
  const max = all.length ? Math.max(...all) : 0;
  const span = max - min;

  const fallback = STEPS.at(-1) as (typeof STEPS)[number];
  const empty = STEPS[0] as (typeof STEPS)[number];

  const intensity = (value: number): (typeof STEPS)[number] => {
    if (value <= 0) return empty;
    const ratio = span === 0 ? 1 : (value - min) / span;
    return STEPS.find((s) => ratio < s.limit) ?? fallback;
  };

  const isExtreme = (value: number) => ({
    max: value > 0 && value === max,
    min: value > 0 && value === min && max !== min,
  });

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs" style={{ minWidth }}>
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="sticky left-0 z-20 bg-muted/50 px-3 py-2.5 font-medium">{rowHeader}</th>
              {columns.map((c) => (
                <th key={c} className="px-2 py-2.5 text-right font-medium">
                  {c}
                </th>
              ))}
              {grandTotal !== undefined && (
                <th className="sticky right-0 z-20 bg-muted/50 px-3 py-2.5 text-right font-semibold">{totalLabel}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b last:border-0">
                <td className="sticky left-0 z-20 bg-card px-3 py-2.5 font-semibold">{row.label}</td>
                {row.values.map((value, i) => {
                  const num = toNumber(value);
                  const step = intensity(num);
                  const extreme = isExtreme(num);
                  let title: string | undefined;
                  if (extreme.max) title = 'Monto mayor';
                  else if (extreme.min) title = 'Monto menor';
                  return (
                    <td
                      key={columns[i] ?? String(i)}
                      title={title}
                      className={cn(
                        'relative whitespace-nowrap px-2 py-2.5 text-right tabular-nums transition-colors',
                        step.cell,
                        extreme.max && 'ring-1 ring-inset ring-brand',
                        extreme.min && 'ring-1 ring-inset ring-border',
                      )}
                    >
                      {num === 0 ? emptyCell : format(num)}
                    </td>
                  );
                })}
                {row.total !== undefined && (
                  <td className="sticky right-0 z-20 whitespace-nowrap bg-card px-3 py-2.5 text-right font-semibold tabular-nums text-brand-strong dark:text-brand">
                    {format(toNumber(row.total))}
                  </td>
                )}
              </tr>
            ))}
            {columnTotals && (
              <tr className="border-t-2 bg-muted/40 font-medium">
                <td className="sticky left-0 z-20 bg-muted/40 px-3 py-2.5 font-semibold">{totalLabel}</td>
                {columnTotals.map((value, i) => (
                  <td key={columns[i] ?? String(i)} className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums">
                    {toNumber(value) === 0 ? emptyCell : format(toNumber(value))}
                  </td>
                ))}
                {grandTotal !== undefined && (
                  <td className="sticky right-0 z-20 whitespace-nowrap bg-muted/40 px-3 py-2.5 text-right font-bold tabular-nums text-brand-strong dark:text-brand">
                    {format(toNumber(grandTotal))}
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {legend && all.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>Menor</span>
            {STEPS.slice(1).map((s) => (
              <span key={s.label} className={cn('h-3.5 w-6 rounded-sm border border-border/40', s.cell)} />
            ))}
            <span>Mayor</span>
          </div>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-6 rounded-sm ring-1 ring-inset ring-brand" />
            Máximo: {format(max)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 w-6 rounded-sm ring-1 ring-inset ring-border" />
            Mínimo: {format(min)}
          </span>
        </div>
      )}
    </div>
  );
}
