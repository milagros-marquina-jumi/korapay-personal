'use client';

import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { MONTH_OPTIONS } from '@/lib/months';

interface MonthYearFilterProps {
  year: string;
  month: string;
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  years: number[];
}

export function MonthYearFilter({ year, month, onYearChange, onMonthChange, years }: MonthYearFilterProps) {
  return (
    <>
      <FilterSelect
        value={year}
        onValueChange={onYearChange}
        options={years.map((y) => ({ value: String(y), label: String(y) }))}
        placeholder="Año"
        allLabel="Todos los años"
      />
      <FilterSelect
        value={month}
        onValueChange={onMonthChange}
        options={MONTH_OPTIONS}
        placeholder="Mes"
        allLabel="Todos los meses"
      />
    </>
  );
}

export { FILTER_ALL };
