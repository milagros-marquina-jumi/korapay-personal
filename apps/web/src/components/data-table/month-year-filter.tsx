'use client';

import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';

const MONTHS = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

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
        options={MONTHS}
        placeholder="Mes"
        allLabel="Todos los meses"
      />
    </>
  );
}

export { FILTER_ALL };
