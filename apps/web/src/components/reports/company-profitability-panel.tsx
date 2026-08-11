'use client';

import { formatMoney } from '@korapay/domain';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CompanyProfitability } from '@/lib/api.types';
import { cn } from '@/lib/utils';

const LIMIT_OPTIONS = [
  { value: '8', label: 'Top 8' },
  { value: '15', label: 'Top 15' },
  { value: 'all', label: 'Todas' },
];

function formatRange(from: string | null, to: string | null) {
  if (!from) return '-';
  const fmt = (v: string) =>
    new Date(v).toLocaleDateString('es-PE', { month: '2-digit', year: 'numeric', timeZone: 'UTC' });
  return to && to !== from ? `${fmt(from)} - ${fmt(to)}` : fmt(from);
}

export function CompanyProfitabilityPanel({ rows }: Readonly<{ rows: CompanyProfitability[] }>) {
  const [limit, setLimit] = useState<string>('8');

  if (!rows.length) return <p className="py-12 text-center text-sm text-muted-foreground">Sin datos</p>;

  const visible = limit === 'all' ? rows : rows.slice(0, Number(limit));
  const best = rows[0];
  const topAverage = Number(best?.monthlyAverage ?? 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Ordenado por lo que pagaban al mes, no por el total: una empresa de pocos meses puede pagar mejor que otra de
          muchos.
        </p>
        <Select value={limit} onValueChange={setLimit}>
          <SelectTrigger className="h-10 w-40" aria-label="Empresas a mostrar">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIMIT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {best && (
        <div className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm">
          <span className="font-medium">{best.name} es donde mejor te pagaban</span>
          <span className="ml-2 text-muted-foreground">
            {formatMoney(best.monthlyAverage, 'PEN')} al mes durante {best.months} {best.months === 1 ? 'mes' : 'meses'}
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-10 px-3 py-2.5 font-medium">#</th>
              <th className="px-3 py-2.5 font-medium">Empresa</th>
              <th className="px-3 py-2.5 text-center font-medium">Meses</th>
              <th className="px-3 py-2.5 font-medium">Promedio por mes</th>
              <th className="px-3 py-2.5 text-right font-medium">Total</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Mejor mes</th>
              <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">Periodo</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => {
              const average = Number(row.monthlyAverage);
              const width = topAverage > 0 ? Math.max(2, (average / topAverage) * 100) : 0;
              const isTop = index === 0;
              return (
                <tr key={row.name} className={cn('border-b last:border-0', isTop && 'bg-brand/5')}>
                  <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{index + 1}</td>
                  <td className="px-3 py-2.5 font-medium">{row.name}</td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {row.months}
                    <span className="ml-1 text-xs text-muted-foreground">({row.payments} pagos)</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn('h-full rounded-full', isTop ? 'bg-brand' : 'bg-brand/40')}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <span className="tabular-nums">{formatMoney(row.monthlyAverage, 'PEN')}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatMoney(row.total, 'PEN')}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right text-xs tabular-nums text-muted-foreground">
                    {formatMoney(row.bestMonthAmount, 'PEN')}
                    {row.bestMonthLabel && <div className="capitalize">{row.bestMonthLabel}</div>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right text-xs tabular-nums text-muted-foreground">
                    {formatRange(row.firstDate, row.lastDate)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
