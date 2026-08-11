import Decimal from 'decimal.js';

export interface PersonalRow {
  date: Date;
  type: string;
  amountBase: Decimal | string;
  tags: string[];
}

export interface MonthMatrixRow {
  year: number;
  months: string[];
  total: string;
}

function isFixed(tags: string[] | null | undefined) {
  const lower = (tags ?? []).map((x) => x.toLowerCase());
  return lower.some((x) => x.includes('fijo')) && !lower.some((x) => x.includes('no fijo'));
}

function accumulate(rows: PersonalRow[], keep: (row: PersonalRow) => boolean): MonthMatrixRow[] {
  const byYear = new Map<number, Decimal[]>();

  for (const row of rows) {
    if (!keep(row)) continue;
    const year = row.date.getUTCFullYear();
    if (!byYear.has(year))
      byYear.set(
        year,
        Array.from({ length: 12 }, () => new Decimal(0)),
      );
    const bucket = byYear.get(year);
    if (!bucket) continue;
    const index = row.date.getUTCMonth();
    bucket[index] = (bucket[index] ?? new Decimal(0)).add(new Decimal(row.amountBase));
  }

  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, values]) => ({
      year,
      months: values.map((v) => v.toFixed(2)),
      total: values.reduce((sum, v) => sum.add(v), new Decimal(0)).toFixed(2),
    }));
}

export function buildPersonalMatrices(rows: PersonalRow[]) {
  return {
    expenseByMonth: accumulate(rows, (r) => r.type === 'EXPENSE'),
    incomeByMonth: accumulate(rows, (r) => r.type === 'INCOME'),
    fixedByMonth: accumulate(rows, (r) => r.type === 'EXPENSE' && isFixed(r.tags)),
    variableByMonth: accumulate(rows, (r) => r.type === 'EXPENSE' && !isFixed(r.tags)),
  };
}
