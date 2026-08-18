'use client';

import { formatMoney } from '@korapay/domain';
import { cn } from '@/lib/utils';

export interface PersonBarDatum {
  id?: string;
  name: string;
  value: number;
  secondary?: number;
}

interface Props {
  data: PersonBarDatum[];
  color?: string;
  secondaryColor?: string;
  label?: string;
  secondaryLabel?: string;
}

export function PersonBar({
  data,
  color = 'bg-brand',
  secondaryColor = 'bg-warning/70',
  label = 'Principal',
  secondaryLabel,
}: Readonly<Props>) {
  const conTotal = data.map((d) => ({ ...d, total: d.value + (d.secondary ?? 0) }));
  const max = Math.max(1, ...conTotal.map((d) => d.total));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className={cn('inline-block h-2.5 w-2.5 rounded-sm', color)} /> {label}
        </span>
        {secondaryLabel && (
          <span className="flex items-center gap-1.5">
            <span className={cn('inline-block h-2.5 w-2.5 rounded-sm', secondaryColor)} /> {secondaryLabel}
          </span>
        )}
      </div>

      {conTotal.map((d) => {
        const pct = d.total > 0 ? Math.round((d.value / d.total) * 100) : 0;
        return (
          <div key={d.id ?? d.name} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
              <span className="truncate font-medium">{d.name}</span>
              <span className="tabular-nums">
                <span className="font-semibold">{formatMoney(String(d.value), 'PEN')}</span>
                {d.secondary !== undefined && d.secondary > 0 && (
                  <span className="text-muted-foreground">
                    {' de '}
                    {formatMoney(String(d.total), 'PEN')} <span className="text-xs">({pct}%)</span>
                  </span>
                )}
              </span>
            </div>
            <div
              className="flex h-4 overflow-hidden rounded-md bg-muted"
              style={{ width: `${Math.max(4, (d.total / max) * 100)}%` }}
            >
              <div
                className={cn('h-full', color)}
                style={{ width: `${d.total > 0 ? (d.value / d.total) * 100 : 0}%` }}
              />
              <div className={cn('h-full flex-1', secondaryColor)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
