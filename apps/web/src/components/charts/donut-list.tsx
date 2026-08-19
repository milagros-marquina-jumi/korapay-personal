'use client';

import { formatMoney } from '@korapay/domain';

interface DonutListItem {
  name: string;
  total: string;
}

interface Props {
  items: DonutListItem[];
  currency?: 'PEN' | 'USD';
}

export function DonutList({ items, currency = 'PEN' }: Readonly<Props>) {
  const total = items.reduce((s, i) => s + Number(i.total), 0);
  return (
    <div className="divide-y">
      {items.map((i) => {
        const valor = Number(i.total);
        const pct = total > 0 ? (valor / total) * 100 : 0;
        return (
          <div key={i.name} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="truncate">{i.name}</span>
            <span className="shrink-0 tabular-nums">
              <span className="font-medium">{formatMoney(i.total, currency)}</span>
              <span className="ml-2 inline-block w-12 text-right text-muted-foreground text-xs">{pct.toFixed(1)}%</span>
            </span>
          </div>
        );
      })}
      <div className="flex items-center justify-between gap-3 py-2 text-sm">
        <span className="font-semibold">Total</span>
        <span className="shrink-0 font-semibold tabular-nums">
          {formatMoney(String(total), currency)}
          <span className="ml-2 inline-block w-12" />
        </span>
      </div>
    </div>
  );
}
