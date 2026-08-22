'use client';

import { dotColor } from '@/components/calendar/calendar-shared';
import type { CalendarEvent } from '@/lib/api.types';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MAX_DOTS = 3;

function isoOf(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function MonthGrid({
  year,
  month,
  byDate,
  selected,
  onSelect,
  today,
}: Readonly<{
  year: number;
  month: number;
  byDate: Map<string, CalendarEvent[]>;
  selected: string;
  onSelect: (iso: string) => void;
  today: string;
}>) {
  const primero = new Date(Date.UTC(year, month, 1));
  const offset = (primero.getUTCDay() + 6) % 7;
  const diasEnMes = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const celdas: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 pb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={`${d}-${i}`} className="py-1 text-center text-xs font-semibold text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {celdas.map((day, index) => {
          if (day === null) return <div key={`v-${index}`} />;
          const iso = isoOf(year, month, day);
          const eventos = byDate.get(iso) ?? [];
          const esHoy = iso === today;
          const esSeleccionado = iso === selected;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              aria-label={`${day}, ${eventos.length} eventos`}
              aria-pressed={esSeleccionado}
              className={cn(
                'flex min-h-14 flex-col items-center justify-start gap-1.5 rounded-lg border p-2 transition-colors',
                esSeleccionado
                  ? 'border-brand bg-brand-soft'
                  : 'border-border/50 hover:border-border hover:bg-accent/60',
              )}
            >
              <span
                className={cn(
                  'text-sm tabular-nums',
                  esHoy && 'flex size-6 items-center justify-center rounded-full bg-brand font-bold text-white',
                  !esHoy && esSeleccionado && 'font-semibold text-brand',
                  !esHoy && !esSeleccionado && 'text-foreground',
                )}
              >
                {day}
              </span>
              {eventos.length > 0 && (
                <span className="flex flex-wrap items-center justify-center gap-0.5">
                  {eventos.slice(0, MAX_DOTS).map((event) => (
                    <span key={event.id} className={cn('size-1.5 rounded-full', dotColor(event))} />
                  ))}
                  {eventos.length > MAX_DOTS && (
                    <span className="text-[9px] font-semibold leading-none text-muted-foreground">
                      +{eventos.length - MAX_DOTS}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
