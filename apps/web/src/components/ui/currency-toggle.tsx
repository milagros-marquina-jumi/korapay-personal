'use client';

import { cn } from '@/lib/utils';

type Moneda = 'PEN' | 'USD';

const OPCIONES: { value: Moneda; label: string; title: string }[] = [
  { value: 'PEN', label: 'S/', title: 'Soles' },
  { value: 'USD', label: '$', title: 'Dólares' },
];

interface Props {
  value: Moneda;
  onChange: (value: Moneda) => void;
}

export function CurrencyToggle({ value, onChange }: Readonly<Props>) {
  return (
    <fieldset className="inline-flex h-10 shrink-0 items-center rounded-lg border bg-card p-0.5" aria-label="Moneda">
      {OPCIONES.map((o) => {
        const activo = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            title={o.title}
            aria-pressed={activo}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-full w-9 rounded-md font-medium text-sm transition-colors',
              activo ? 'bg-primary text-primary-foreground shadow-soft' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </fieldset>
  );
}
