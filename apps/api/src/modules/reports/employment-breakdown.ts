import { Decimal } from '@prisma/client/runtime/library';
import { MONTH_NAMES } from '@/common/constants/months';

const EXTRAORDINARY = /liquidaci|gratificaci|cts|utilidad|^empresas$|^afp$/i;

export interface IncomeRow {
  date: Date;
  amountBase: Decimal | string;
  concept: string;
}

export interface MonthlyMatrixRow {
  year: number;
  months: string[];
  total: string;
}

export interface QuarterRow {
  year: number;
  quarters: string[];
  total: string;
}

export function isExtraordinary(concept: string): boolean {
  return EXTRAORDINARY.test(concept.trim());
}

function accumulate(rows: IncomeRow[], slots: number, slotOf: (d: Date) => number) {
  const byYear = new Map<number, Decimal[]>();
  for (const row of rows) {
    const year = row.date.getUTCFullYear();
    if (!byYear.has(year))
      byYear.set(
        year,
        Array.from({ length: slots }, () => new Decimal(0)),
      );
    const bucket = byYear.get(year);
    if (!bucket) continue;
    const index = slotOf(row.date);
    bucket[index] = (bucket[index] ?? new Decimal(0)).add(new Decimal(row.amountBase));
  }
  return byYear;
}

function toRows<T>(byYear: Map<number, Decimal[]>, build: (year: number, values: string[], total: string) => T): T[] {
  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, values]) => {
      const total = values.reduce((sum, v) => sum.add(v), new Decimal(0));
      return build(
        year,
        values.map((v) => v.toFixed(2)),
        total.toFixed(2),
      );
    });
}

export function monthlyMatrix(rows: IncomeRow[]): MonthlyMatrixRow[] {
  const byYear = accumulate(rows, 12, (d) => d.getUTCMonth());
  return toRows(byYear, (year, months, total) => ({ year, months, total }));
}

export function quarterlyMatrix(rows: IncomeRow[]): QuarterRow[] {
  const byYear = accumulate(rows, 4, (d) => Math.floor(d.getUTCMonth() / 3));
  return toRows(byYear, (year, quarters, total) => ({ year, quarters, total }));
}

export function monthLabels(): string[] {
  return [...MONTH_NAMES];
}

export function buildEmploymentBreakdown(rows: IncomeRow[]) {
  const salaryOnly = rows.filter((r) => !isExtraordinary(r.concept));
  return {
    monthlyAll: monthlyMatrix(rows),
    monthlySalary: monthlyMatrix(salaryOnly),
    quarterlyAll: quarterlyMatrix(rows),
    quarterlySalary: quarterlyMatrix(salaryOnly),
  };
}
