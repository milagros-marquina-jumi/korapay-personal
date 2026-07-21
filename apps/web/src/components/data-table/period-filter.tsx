'use client';

import { X } from 'lucide-react';
import { FILTER_ALL } from '@/components/data-table/filter-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PeriodFilterProps {
  year: string;
  month: string;
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  years?: number[];
}

export function PeriodFilter({ year, month, onYearChange, onMonthChange }: PeriodFilterProps) {
  const value = year !== FILTER_ALL && month !== FILTER_ALL ? `${year}-${String(month).padStart(2, '0')}` : '';

  const handleChange = (raw: string) => {
    if (!raw) {
      onYearChange(FILTER_ALL);
      onMonthChange(FILTER_ALL);
      return;
    }
    const [y, m] = raw.split('-');
    onYearChange(y ?? FILTER_ALL);
    onMonthChange(m ? String(Number(m)) : FILTER_ALL);
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        type="month"
        aria-label="Periodo (año y mes)"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="h-10 w-[11rem]"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          aria-label="Limpiar periodo"
          onClick={() => handleChange('')}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}

export function yearsFrom(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => b - a);
}

export { FILTER_ALL };
