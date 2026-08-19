'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

export type Sorters<T> = Record<string, (row: T) => string | number>;

export function useSortedRows<T>(rows: T[], sorters: Sorters<T>, initial?: SortState) {
  const [sort, setSort] = useState<SortState | null>(initial ?? null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const accessor = sorters[sort.key];
    if (!accessor) return rows;
    const copia = [...rows].sort((a, b) => {
      const va = accessor(a);
      const vb = accessor(b);
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return copia;
  }, [rows, sort, sorters]);

  const toggle = (key: string) =>
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: 'desc' };
      if (prev.dir === 'desc') return { key, dir: 'asc' };
      return null;
    });

  return { sorted, sort, toggle };
}

interface SortableThProps {
  label: string;
  sortKey: string;
  sort: SortState | null;
  onToggle: (key: string) => void;
  align?: 'left' | 'right';
  className?: string;
}

export function SortableTh({ label, sortKey, sort, onToggle, align = 'right', className }: Readonly<SortableThProps>) {
  const active = sort?.key === sortKey;
  const Icon = active ? (sort?.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className={cn('p-0', className)}>
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        className={cn(
          'flex w-full items-center gap-1 p-3 font-medium hover:text-foreground',
          align === 'right' ? 'justify-end text-right' : 'justify-start text-left',
          active && 'text-foreground',
        )}
        title="Ordenar"
      >
        {align === 'right' && <Icon className={cn('size-3 shrink-0', active ? 'opacity-100' : 'opacity-40')} />}
        {label}
        {align === 'left' && <Icon className={cn('size-3 shrink-0', active ? 'opacity-100' : 'opacity-40')} />}
      </button>
    </th>
  );
}
