import { Decimal } from '@prisma/client/runtime/library';
import { MONTH_NAMES } from '@/common/constants/months';

export interface CompanyIncomeRow {
  date: Date;
  amountBase: Decimal | string;
  concept?: string | null;
  company: { name: string } | null;
}

export interface CompanyProfitability {
  name: string;
  total: string;
  months: number;
  payments: number;
  monthlyAverage: string;
  salaryAverage: string;
  salaryMonths: number;
  bestMonthAmount: string;
  bestMonthLabel: string | null;
  firstDate: string | null;
  lastDate: string | null;
}

const SALARY_CONCEPT = 'sueldo';

function esSueldo(concept?: string | null) {
  return (concept ?? '').trim().toLowerCase() === SALARY_CONCEPT;
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [year = '', month = '1'] = key.split('-');
  return `${MONTH_NAMES[Number(month) - 1] ?? ''} ${year}`;
}

interface Bucket {
  total: Decimal;
  payments: number;
  byMonth: Map<string, Decimal>;
  salaryByMonth: Map<string, Decimal>;
  first: Date;
  last: Date;
}

export function buildCompanyProfitability(rows: CompanyIncomeRow[]): CompanyProfitability[] {
  const buckets = new Map<string, Bucket>();

  for (const row of rows) {
    const name = row.company?.name ?? 'Sin empresa';
    const amount = new Decimal(row.amountBase);
    let bucket = buckets.get(name);
    if (!bucket) {
      bucket = {
        total: new Decimal(0),
        payments: 0,
        byMonth: new Map(),
        salaryByMonth: new Map(),
        first: row.date,
        last: row.date,
      };
      buckets.set(name, bucket);
    }
    bucket.total = bucket.total.add(amount);
    bucket.payments += 1;
    if (row.date < bucket.first) bucket.first = row.date;
    if (row.date > bucket.last) bucket.last = row.date;

    const key = monthKey(row.date);
    bucket.byMonth.set(key, (bucket.byMonth.get(key) ?? new Decimal(0)).add(amount));
    if (esSueldo(row.concept)) {
      bucket.salaryByMonth.set(key, (bucket.salaryByMonth.get(key) ?? new Decimal(0)).add(amount));
    }
  }

  return [...buckets.entries()]
    .map(([name, bucket]) => {
      const months = bucket.byMonth.size;
      let bestKey: string | null = null;
      let bestAmount = new Decimal(0);
      for (const [key, value] of bucket.byMonth.entries()) {
        if (value.greaterThan(bestAmount)) {
          bestAmount = value;
          bestKey = key;
        }
      }

      const salaryMonths = bucket.salaryByMonth.size;
      const salaryTotal = [...bucket.salaryByMonth.values()].reduce((s, v) => s.add(v), new Decimal(0));

      return {
        name,
        total: bucket.total.toFixed(2),
        months,
        payments: bucket.payments,
        monthlyAverage: months > 0 ? bucket.total.div(months).toFixed(2) : '0.00',
        salaryAverage: salaryMonths > 0 ? salaryTotal.div(salaryMonths).toFixed(2) : '0.00',
        salaryMonths,
        bestMonthAmount: bestAmount.toFixed(2),
        bestMonthLabel: bestKey ? monthLabel(bestKey) : null,
        firstDate: bucket.first.toISOString(),
        lastDate: bucket.last.toISOString(),
      };
    })
    .sort(
      (a, b) =>
        Number(b.salaryAverage) - Number(a.salaryAverage) || Number(b.monthlyAverage) - Number(a.monthlyAverage),
    );
}
