'use client';

import { formatMoney } from '@korapay/domain';
import { Trophy } from 'lucide-react';
import type { QuarterMatrixRow } from '@/lib/api.types';
import { cn } from '@/lib/utils';

const QUARTER_LABELS = ['T1', 'T2', 'T3', 'T4'];
const QUARTER_MONTHS = ['Ene - Mar', 'Abr - Jun', 'Jul - Sep', 'Oct - Dic'];

interface QuarterStat {
  index: number;
  label: string;
  months: string;
  total: number;
  years: number;
  average: number;
  best: number;
  bestYear: number | null;
}

function buildStats(rows: QuarterMatrixRow[]): QuarterStat[] {
  return QUARTER_LABELS.map((label, index) => {
    let total = 0;
    let years = 0;
    let best = 0;
    let bestYear: number | null = null;

    for (const row of rows) {
      const value = Number(row.quarters[index] ?? 0);
      if (value <= 0) continue;
      total += value;
      years += 1;
      if (value > best) {
        best = value;
        bestYear = row.year;
      }
    }

    return {
      index,
      label,
      months: QUARTER_MONTHS[index] ?? '',
      total,
      years,
      average: years > 0 ? total / years : 0,
      best,
      bestYear,
    };
  });
}

export function QuarterRanking({ rows }: Readonly<{ rows: QuarterMatrixRow[] }>) {
  const stats = buildStats(rows);
  const withData = stats.filter((s) => s.years > 0);

  if (!withData.length) return null;

  const topAverage = Math.max(...withData.map((s) => s.average));
  const ranked = [...withData].sort((a, b) => b.average - a.average);
  const winner = ranked[0];

  return (
    <div className="space-y-3">
      {winner && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm">
          <Trophy className="size-4 text-brand-strong dark:text-brand" />
          <span className="font-medium">
            {winner.label} es tu mejor trimestre ({winner.months})
          </span>
          <span className="text-muted-foreground">promedio {formatMoney(String(winner.average), 'PEN')} por año</span>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-12 px-3 py-2.5 font-medium">#</th>
              <th className="px-3 py-2.5 font-medium">Trimestre</th>
              <th className="px-3 py-2.5 font-medium">Promedio por año</th>
              <th className="px-3 py-2.5 text-right font-medium">Total acumulado</th>
              <th className="px-3 py-2.5 text-right font-medium">Mejor año</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((stat, position) => {
              const width = topAverage > 0 ? Math.max(2, (stat.average / topAverage) * 100) : 0;
              const isWinner = position === 0;
              return (
                <tr key={stat.label} className={cn('border-b last:border-0', isWinner && 'bg-brand/5')}>
                  <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{position + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col">
                      <span className={cn('font-medium', isWinner && 'text-brand-strong dark:text-brand')}>
                        {stat.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{stat.months}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn('h-full rounded-full', isWinner ? 'bg-brand' : 'bg-brand/40')}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="w-28 shrink-0 text-right tabular-nums">
                        {formatMoney(String(stat.average), 'PEN')}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatMoney(String(stat.total), 'PEN')}
                    <span className="ml-1 text-xs">({stat.years} años)</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {stat.bestYear ? `${stat.bestYear}: ${formatMoney(String(stat.best), 'PEN')}` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        El ranking usa el promedio por año, no el total, porque no todos los trimestres tienen el mismo número de años
        con datos.
      </p>
    </div>
  );
}
