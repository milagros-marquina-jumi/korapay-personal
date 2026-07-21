import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '@/common/prisma/prisma.service';

const MONTH_NAMES = [
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

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private yearFilter(year?: number): Prisma.TransactionWhereInput {
    if (!year) return {};
    return { date: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } };
  }

  async personal(workspaceId: string, year?: number) {
    const [transactions, balances] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { workspaceId, deletedAt: null, ...this.yearFilter(year) },
        include: { category: true },
      }),
      this.prisma.savingBalance.findMany({
        where: { workspaceId, deletedAt: null, ...(year ? { year } : {}) },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      }),
    ]);

    const years = [
      ...new Set([...transactions.map((t) => t.date.getUTCFullYear()), ...balances.map((b) => b.year)]),
    ].sort((a, b) => b - a);

    // 1. Gastos por categoría
    const byCategory = new Map<string, Decimal>();
    for (const t of transactions) {
      if (t.type !== 'EXPENSE') continue;
      const name = t.category?.name ?? 'Sin categoría';
      byCategory.set(name, (byCategory.get(name) ?? new Decimal(0)).add(new Decimal(t.amountBase)));
    }
    const expenseByCategory = [...byCategory.entries()]
      .map(([name, total]) => ({ name, total: total.toFixed(2) }))
      .sort((a, b) => Number(b.total) - Number(a.total));

    // 2. Ingresos vs egresos por mes
    const monthly = new Map<string, { income: Decimal; expense: Decimal }>();
    for (const t of transactions) {
      const key = `${t.date.getUTCFullYear()}-${t.date.getUTCMonth() + 1}`;
      if (!monthly.has(key)) monthly.set(key, { income: new Decimal(0), expense: new Decimal(0) });
      const bucket = monthly.get(key);
      if (!bucket) continue;
      if (t.type === 'INCOME') bucket.income = bucket.income.add(new Decimal(t.amountBase));
      else if (t.type === 'EXPENSE') bucket.expense = bucket.expense.add(new Decimal(t.amountBase));
    }
    const incomeVsExpense = [...monthly.entries()]
      .map(([key, v]) => {
        const [y = 0, m = 1] = key.split('-').map(Number);
        return {
          year: y,
          month: m,
          label: `${MONTH_NAMES[m - 1]} ${y}`,
          income: v.income.toFixed(2),
          expense: v.expense.toFixed(2),
          net: v.income.minus(v.expense).toFixed(2),
        };
      })
      .sort((a, b) => a.year - b.year || a.month - b.month);

    // 3. Evolución de ahorros por mes (suma de saldos del mes)
    const savingsMap = new Map<string, Decimal>();
    for (const b of balances) {
      const key = `${b.year}-${b.month}`;
      savingsMap.set(key, (savingsMap.get(key) ?? new Decimal(0)).add(new Decimal(b.amountBase)));
    }
    const savingsEvolution = [...savingsMap.entries()]
      .map(([key, total]) => {
        const [y = 0, m = 1] = key.split('-').map(Number);
        return { year: y, month: m, label: `${MONTH_NAMES[m - 1]} ${y}`, total: total.toFixed(2) };
      })
      .sort((a, b) => a.year - b.year || a.month - b.month);

    // 4. Gasto fijo vs no fijo (tag Fijo/No fijo del Excel)
    let fixed = new Decimal(0);
    let variable = new Decimal(0);
    for (const t of transactions) {
      if (t.type !== 'EXPENSE') continue;
      const tags = (t.tags ?? []).map((x) => x.toLowerCase());
      const isFixed = tags.some((x) => x === 'fijo' || x.includes('fijo')) && !tags.some((x) => x.includes('no fijo'));
      if (isFixed) fixed = fixed.add(new Decimal(t.amountBase));
      else variable = variable.add(new Decimal(t.amountBase));
    }
    const fixedVsVariable = { fixed: fixed.toFixed(2), variable: variable.toFixed(2) };

    return { years, expenseByCategory, incomeVsExpense, savingsEvolution, fixedVsVariable };
  }

  async savingBalancesMonthly(workspaceId: string, year?: number) {
    const balances = await this.prisma.savingBalance.findMany({
      where: { workspaceId, deletedAt: null, ...(year ? { year } : {}) },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { bucket: 'asc' }],
    });

    const years = [...new Set(balances.map((b) => b.year))].sort((a, b) => b - a);
    const periods = new Map<
      string,
      {
        year: number;
        month: number;
        total: Decimal;
        accounts: { bucket: string; bank: string | null; currency: string; amount: string; amountBase: string }[];
      }
    >();

    for (const b of balances) {
      const key = `${b.year}-${b.month}`;
      if (!periods.has(key)) periods.set(key, { year: b.year, month: b.month, total: new Decimal(0), accounts: [] });
      const period = periods.get(key);
      if (!period) continue;
      period.total = period.total.add(new Decimal(b.amountBase));
      period.accounts.push({
        bucket: b.bucket,
        bank: b.bank,
        currency: b.currency,
        amount: b.amount.toString(),
        amountBase: b.amountBase.toString(),
      });
    }

    const data = [...periods.values()]
      .sort((a, b) => b.year - a.year || b.month - a.month)
      .map((p) => ({
        year: p.year,
        month: p.month,
        label: `${MONTH_NAMES[p.month - 1]} ${p.year}`,
        total: p.total.toFixed(2),
        accounts: p.accounts,
      }));

    return { data, years };
  }
}
