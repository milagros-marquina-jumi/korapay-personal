'use client';

import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

interface PeriodFilterProps {
  year: string;
  month: string;
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  years: number[];
}

export function PeriodFilter({ year, month, onYearChange, onMonthChange, years }: PeriodFilterProps) {
  const yearOptions = years.map((y) => ({ value: String(y), label: String(y) }));
  const monthOptions = MONTHS.map((label, i) => ({ value: String(i + 1), label }));

  return (
    <>
      <FilterSelect
        value={year}
        onValueChange={onYearChange}
        options={yearOptions}
        placeholder="Año"
        allLabel="Todo año"
      />
      <FilterSelect
        value={month}
        onValueChange={onMonthChange}
        options={monthOptions}
        placeholder="Mes"
        allLabel="Todo mes"
      />
    </>
  );
}

export function yearsFrom(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => b - a);
}

export { FILTER_ALL };
