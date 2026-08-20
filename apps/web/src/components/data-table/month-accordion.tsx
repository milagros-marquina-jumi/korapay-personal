'use client';

import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface MonthMetric {
  label: string;
  value: string;
  className?: string;
}

export interface MonthGroup<T> {
  key: string;
  label: string;
  items: T[];
  metrics: MonthMetric[];
}

interface Props<T> {
  groups: MonthGroup<T>[];
  currentMonthKey: string;
  isOpen: (key: string) => boolean;
  onToggle: (key: string) => void;
  countLabel: (count: number) => string;
  children: (group: MonthGroup<T>) => ReactNode;
  headerAction?: (group: MonthGroup<T>) => ReactNode;
}

export function MonthAccordion<T>({
  groups,
  currentMonthKey,
  isOpen,
  onToggle,
  countLabel,
  children,
  headerAction,
}: Readonly<Props<T>>) {
  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const open = isOpen(group.key);
        return (
          <Card key={group.key} className="overflow-hidden">
            <div className={cn('flex items-center', open ? 'border-b bg-muted/40' : 'bg-card')}>
              <button
                type="button"
                onClick={() => onToggle(group.key)}
                aria-expanded={open}
                className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5 text-left transition-colors hover:bg-muted/50"
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-spring',
                    open && 'rotate-180',
                  )}
                />
                <span className="text-sm font-semibold capitalize">{group.label}</span>
                {group.key === currentMonthKey && (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-strong dark:text-brand">
                    Mes actual
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{countLabel(group.items.length)}</span>
                <span className="ml-auto flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-xs">
                  {group.metrics.map((m) => (
                    <span key={m.label} className="text-muted-foreground">
                      {m.label} <span className={cn('font-semibold tabular-nums', m.className)}>{m.value}</span>
                    </span>
                  ))}
                </span>
              </button>
              {headerAction && <div className="shrink-0 pr-4">{headerAction(group)}</div>}
            </div>
            {open && children(group)}
          </Card>
        );
      })}
    </div>
  );
}
