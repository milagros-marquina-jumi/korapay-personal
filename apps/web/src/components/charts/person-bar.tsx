'use client';

import { formatMoney } from '@korapay/domain';

export interface PersonBarDatum {
  name: string;
  value: number;
  secondary?: number;
}

interface Props {
  data: PersonBarDatum[];
  color?: string;
  secondaryColor?: string;
  secondaryLabel?: string;
}

export function PersonBar({ data, color = 'bg-brand', secondaryColor = 'bg-warning/70', secondaryLabel }: Props) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.secondary ?? 0)));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.name} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate font-medium">{d.name}</span>
            <span className="tabular-nums text-muted-foreground">{formatMoney(String(d.value), 'PEN')}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          {d.secondary !== undefined && d.secondary > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${secondaryColor}`}
                  style={{ width: `${(d.secondary / max) * 100}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {secondaryLabel ? `${secondaryLabel}: ` : ''}
                {formatMoney(String(d.secondary), 'PEN')}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
