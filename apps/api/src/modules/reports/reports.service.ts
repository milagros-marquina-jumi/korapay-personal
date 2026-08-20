import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { MONTH_NAMES } from '@/common/constants/months';
import { PrismaService } from '@/common/prisma/prisma.service';
import { distribucionEnSoles, ultimoTipoCambio } from '@/common/talent/distribucion-soles';
import { workspacesDeIngresoPersonal } from '@/common/workspace/ingresos-personales';
import { buildCompanyProfitability } from './company-profitability';
import { buildEmploymentBreakdown } from './employment-breakdown';
import { buildPersonalMatrices } from './personal-matrix';
import { buildTaxBurden } from './tax-burden';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private yearFilter(year?: number): Prisma.TransactionWhereInput {
    if (!year) return {};
    return { date: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } };
  }

  private isFixedExpense(tags: string[] | null | undefined) {
    const lower = (tags ?? []).map((x) => x.toLowerCase());
    return lower.some((x) => x.includes('fijo')) && !lower.some((x) => x.includes('no fijo'));
  }

  private addToCategory(target: Map<number, Map<string, Decimal>>, year: number, name: string, amount: Decimal) {
    let categories = target.get(year);
    if (!categories) {
      categories = new Map();
      target.set(year, categories);
    }
    categories.set(name, (categories.get(name) ?? new Decimal(0)).add(amount));
  }

  private aggregateByYear(
    rows: {
      date: Date;
      type: string;
      amountBase: Decimal | string;
      tags: string[];
      category: { name: string } | null;
    }[],
  ) {
    const totals = new Map<number, { income: Decimal; expense: Decimal; fixed: Decimal; variable: Decimal }>();
    const byCategory = new Map<number, Map<string, Decimal>>();

    for (const row of rows) {
      const year = row.date.getUTCFullYear();
      if (!totals.has(year)) {
        totals.set(year, {
          income: new Decimal(0),
          expense: new Decimal(0),
          fixed: new Decimal(0),
          variable: new Decimal(0),
        });
      }
      const bucket = totals.get(year);
      if (!bucket) continue;
      const amount = new Decimal(row.amountBase);

      if (row.type === 'INCOME') {
        bucket.income = bucket.income.add(amount);
        continue;
      }
      if (row.type !== 'EXPENSE') continue;

      bucket.expense = bucket.expense.add(amount);
      if (this.isFixedExpense(row.tags)) bucket.fixed = bucket.fixed.add(amount);
      else bucket.variable = bucket.variable.add(amount);

      this.addToCategory(byCategory, year, row.category?.name ?? 'Sin categoría', amount);
    }

    const yearlyTotals = [...totals.entries()]
      .map(([year, v]) => ({
        year,
        income: v.income.toFixed(2),
        expense: v.expense.toFixed(2),
        net: v.income.minus(v.expense).toFixed(2),
        fixed: v.fixed.toFixed(2),
        variable: v.variable.toFixed(2),
      }))
      .sort((a, b) => a.year - b.year);

    const yearlyByCategory = [...byCategory.entries()]
      .map(([year, categories]) => ({
        year,
        categories: [...categories.entries()]
          .map(([name, total]) => ({ name, total: total.toFixed(2) }))
          .sort((a, b) => Number(b.total) - Number(a.total)),
      }))
      .sort((a, b) => a.year - b.year);

    return { yearlyTotals, yearlyByCategory };
  }

  async personal(workspaceId: string, year?: number) {
    const externos = await workspacesDeIngresoPersonal(this.prisma, workspaceId);
    const scopeTransaccion = externos.length
      ? {
          OR: [{ workspaceId }, { workspaceId: { in: externos }, type: 'INCOME' }],
        }
      : { workspaceId };
    const [transactions, balances, allTransactions, allBalanceYears] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { ...scopeTransaccion, deletedAt: null, ...this.yearFilter(year) },
        include: { category: true },
      }),
      this.prisma.savingBalance.findMany({
        where: { workspaceId, deletedAt: null, ...(year ? { year } : {}) },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      }),
      this.prisma.transaction.findMany({
        where: { ...scopeTransaccion, deletedAt: null },
        select: { date: true, type: true, amountBase: true, tags: true, category: { select: { name: true } } },
      }),
      this.prisma.savingBalance.findMany({
        where: { workspaceId, deletedAt: null },
        select: { year: true },
        distinct: ['year'],
      }),
    ]);

    const years = [
      ...new Set([...allTransactions.map((t) => t.date.getUTCFullYear()), ...allBalanceYears.map((b) => b.year)]),
    ].sort((a, b) => b - a);

    const { yearlyTotals, yearlyByCategory } = this.aggregateByYear(allTransactions);

    const byCategory = new Map<string, Decimal>();
    for (const t of transactions) {
      if (t.type !== 'EXPENSE') continue;
      const name = t.category?.name ?? 'Sin categoría';
      byCategory.set(name, (byCategory.get(name) ?? new Decimal(0)).add(new Decimal(t.amountBase)));
    }
    const expenseByCategory = [...byCategory.entries()]
      .map(([name, total]) => ({ name, total: total.toFixed(2) }))
      .sort((a, b) => Number(b.total) - Number(a.total));

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

    // La clasificacion fijo/no fijo viene de un tag heredado del Excel, no de un campo.
    let fixed = new Decimal(0);
    let variable = new Decimal(0);
    const monthlyFixedVar = new Map<string, { fixed: Decimal; variable: Decimal }>();
    for (const t of transactions) {
      if (t.type !== 'EXPENSE') continue;
      const tags = (t.tags ?? []).map((x) => x.toLowerCase());
      const isFixed = tags.some((x) => x === 'fijo' || x.includes('fijo')) && !tags.some((x) => x.includes('no fijo'));
      const amount = new Decimal(t.amountBase);
      if (isFixed) fixed = fixed.add(amount);
      else variable = variable.add(amount);
      const key = `${t.date.getUTCFullYear()}-${t.date.getUTCMonth() + 1}`;
      if (!monthlyFixedVar.has(key)) monthlyFixedVar.set(key, { fixed: new Decimal(0), variable: new Decimal(0) });
      const bucket = monthlyFixedVar.get(key);
      if (!bucket) continue;
      if (isFixed) bucket.fixed = bucket.fixed.add(amount);
      else bucket.variable = bucket.variable.add(amount);
    }
    const fixedVsVariable = { fixed: fixed.toFixed(2), variable: variable.toFixed(2) };
    const monthlyFixedVsVariable = [...monthlyFixedVar.entries()]
      .map(([key, v]) => {
        const [y = 0, m = 1] = key.split('-').map(Number);
        return {
          year: y,
          month: m,
          label: `${MONTH_NAMES[m - 1]} ${y}`,
          fixed: v.fixed.toFixed(2),
          variable: v.variable.toFixed(2),
        };
      })
      .sort((a, b) => a.year - b.year || a.month - b.month);

    return {
      years,
      yearlyTotals,
      yearlyByCategory,
      expenseByCategory,
      incomeVsExpense,
      savingsEvolution,
      fixedVsVariable,
      monthlyFixedVsVariable,
      matrices: buildPersonalMatrices(allTransactions),
    };
  }

  async employment(workspaceId: string, year?: number) {
    const [transactions, allTransactions, taxObligations] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { workspaceId, deletedAt: null, type: 'INCOME', ...this.yearFilter(year) },
        include: { company: { select: { name: true } } },
        orderBy: { date: 'asc' },
      }),
      this.prisma.transaction.findMany({
        where: { workspaceId, deletedAt: null, type: 'INCOME' },
        select: { date: true, amountBase: true, concept: true, companyId: true },
      }),
      this.prisma.taxObligation.findMany({
        where: { workspaceId, deletedAt: null },
        select: { year: true, amount: true, status: true },
      }),
    ]);

    const years = [...new Set(allTransactions.map((t) => t.date.getUTCFullYear()))].sort((a, b) => b - a);

    const yearAgg = new Map<number, { total: Decimal; months: Set<number>; companies: Set<string> }>();
    for (const t of allTransactions) {
      const y = t.date.getUTCFullYear();
      if (!yearAgg.has(y)) yearAgg.set(y, { total: new Decimal(0), months: new Set(), companies: new Set() });
      const bucket = yearAgg.get(y);
      if (!bucket) continue;
      bucket.total = bucket.total.add(new Decimal(t.amountBase));
      bucket.months.add(t.date.getUTCMonth() + 1);
      if (t.companyId) bucket.companies.add(t.companyId);
    }
    const yearlyTotals = [...yearAgg.entries()]
      .map(([y, v]) => ({
        year: y,
        total: v.total.toFixed(2),
        average: v.months.size ? v.total.div(v.months.size).toFixed(2) : '0.00',
        months: v.months.size,
        companies: v.companies.size,
      }))
      .sort((a, b) => a.year - b.year);

    const companiesByYear = new Map<number, Map<number, Set<string>>>();
    for (const t of allTransactions) {
      if (!t.companyId) continue;
      const y = t.date.getUTCFullYear();
      const m = t.date.getUTCMonth() + 1;
      if (!companiesByYear.has(y)) companiesByYear.set(y, new Map());
      const months = companiesByYear.get(y);
      if (!months) continue;
      if (!months.has(m)) months.set(m, new Set());
      months.get(m)?.add(t.companyId);
    }
    const companyRows = await this.prisma.company.findMany({
      where: { workspaceId, deletedAt: null },
      select: {
        id: true,
        name: true,
        clients: { where: { deletedAt: null }, select: { name: true } },
        globalCompany: {
          select: { clients: { where: { deletedAt: null }, select: { name: true }, orderBy: { name: 'asc' } } },
        },
      },
    });
    const companyLookup = new Map(
      companyRows.map((c) => {
        const own = c.clients.map((cl) => cl.name);
        const global = c.globalCompany?.clients.map((cl) => cl.name) ?? [];
        return [c.id, { name: c.name, clients: own.length ? own : global }];
      }),
    );

    const detailOf = (ids: Iterable<string>) =>
      [...ids]
        .map((id) => companyLookup.get(id))
        .filter((c): c is { name: string; clients: string[] } => !!c)
        .map((c) => ({ name: c.name, clients: c.clients }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const companiesPerMonth = [...companiesByYear.entries()]
      .map(([y, months]) => {
        const unique = new Set([...months.values()].flatMap((s) => [...s]));
        return {
          year: y,
          months: Array.from({ length: 12 }, (_, i) => months.get(i + 1)?.size ?? 0),
          monthDetail: Array.from({ length: 12 }, (_, i) => detailOf(months.get(i + 1) ?? [])),
          total: unique.size,
          totalDetail: detailOf(unique),
        };
      })
      .sort((a, b) => a.year - b.year);

    const byConcept = new Map<string, Decimal>();
    const byCompany = new Map<string, Decimal>();
    const monthly = new Map<string, Decimal>();
    for (const t of transactions) {
      const amount = new Decimal(t.amountBase);
      byConcept.set(t.concept, (byConcept.get(t.concept) ?? new Decimal(0)).add(amount));
      const company = t.company?.name ?? 'Sin empresa';
      byCompany.set(company, (byCompany.get(company) ?? new Decimal(0)).add(amount));
      const key = `${t.date.getUTCFullYear()}-${t.date.getUTCMonth() + 1}`;
      monthly.set(key, (monthly.get(key) ?? new Decimal(0)).add(amount));
    }

    const sortDesc = (map: Map<string, Decimal>) =>
      [...map.entries()]
        .map(([name, total]) => ({ name, total: total.toFixed(2) }))
        .sort((a, b) => Number(b.total) - Number(a.total));

    const incomeByMonth = [...monthly.entries()]
      .map(([key, total]) => {
        const [y = 0, m = 1] = key.split('-').map(Number);
        return { year: y, month: m, label: `${MONTH_NAMES[m - 1]} ${y}`, total: total.toFixed(2) };
      })
      .sort((a, b) => a.year - b.year || a.month - b.month);

    const total = transactions.reduce((s, t) => s.add(new Decimal(t.amountBase)), new Decimal(0));
    const sumaPorEstado = (estado: string) =>
      transactions
        .filter((t) => t.status === estado)
        .reduce((s, t) => s.add(new Decimal(t.amountBase)), new Decimal(0));
    const receivable = {
      overdue: sumaPorEstado('OVERDUE').toFixed(2),
      pending: sumaPorEstado('PENDING').toFixed(2),
    };

    return {
      years,
      total: total.toFixed(2),
      receivable,
      yearlyTotals,
      companiesPerMonth,
      companyDurations: await this.companyDurations(workspaceId),
      breakdown: buildEmploymentBreakdown(allTransactions),
      incomeByConcept: sortDesc(byConcept),
      incomeByCompany: sortDesc(byCompany),
      companyProfitability: buildCompanyProfitability(transactions),
      incomeByMonth,
      taxBurden: buildTaxBurden(allTransactions, taxObligations),
    };
  }

  private static daysBetween(start: Date, end: Date) {
    return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
  }

  private async companyDurations(workspaceId: string) {
    const [contracts, companies] = await Promise.all([
      this.prisma.employmentContract.findMany({
        where: { workspaceId, deletedAt: null },
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.company.findMany({
        where: { workspaceId, deletedAt: null },
        select: { id: true, name: true },
      }),
    ]);

    const nameOf = new Map(companies.map((c) => [c.id, c.name]));
    const grouped = new Map<string, typeof contracts>();
    for (const c of contracts) {
      const name = nameOf.get(c.companyId ?? '') ?? 'Sin empresa';
      const bucket = grouped.get(name) ?? [];
      bucket.push(c);
      grouped.set(name, bucket);
    }

    const today = new Date();
    return [...grouped.entries()]
      .map(([name, rows]) => {
        // Varios contratos de la misma empresa se suman: son reingresos, no periodos paralelos.
        const periods = rows.map((r) => {
          const end = r.endDate ?? today;
          return {
            id: r.id,
            startDate: r.startDate.toISOString(),
            endDate: r.endDate?.toISOString() ?? null,
            position: r.position,
            type: r.type,
            active: !r.endDate,
            days: ReportsService.daysBetween(r.startDate, end),
          };
        });
        const first = rows[0];
        const last = rows.at(-1);
        return {
          name,
          contracts: periods.length,
          totalDays: periods.reduce((s, p) => s + p.days, 0),
          active: periods.some((p) => p.active),
          firstStart: first ? first.startDate.toISOString() : null,
          lastEnd: last?.endDate?.toISOString() ?? null,
          periods,
        };
      })
      .sort((a, b) => b.totalDays - a.totalDays);
  }

  async business(workspaceId: string, year?: number) {
    const [transactions, applications, people, ledger, allTransactions, projects, distributions] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { workspaceId, deletedAt: null, ...this.yearFilter(year) },
        include: { projects: { select: { name: true } } },
      }),
      this.prisma.application.findMany({ where: { workspaceId, deletedAt: null } }),
      this.prisma.person.findMany({ where: { workspaceId, deletedAt: null } }),
      this.prisma.talentLedgerEntry.findMany({ where: { workspaceId, deletedAt: null } }),
      this.prisma.transaction.findMany({
        where: { workspaceId, deletedAt: null },
        select: { date: true, type: true, amountBase: true, applicationId: true },
      }),
      this.prisma.project.findMany({ where: { workspaceId, deletedAt: null } }),
      this.prisma.talentIncomeDistribution.findMany({
        where: { contract: { talentProfile: { workspaceId } } },
        select: {
          amountReceived: true,
          amountRetained: true,
          amountWithDiscount: true,
          year: true,
          month: true,
          exchangeRate: true,
          contract: { select: { currency: true } },
        },
      }),
    ]);

    const tipoCambio = await ultimoTipoCambio(this.prisma);
    const distribucionesSoles = distributions.map((d) => distribucionEnSoles(d, d.contract?.currency, tipoCambio));

    const years = [...new Set(allTransactions.map((t) => t.date.getUTCFullYear()))].sort((a, b) => b - a);
    const appName = new Map(applications.map((a) => [a.id, a.name]));
    const personName = new Map(people.map((p) => [p.id, p.name]));

    const yearAgg = new Map<number, { income: Decimal; cost: Decimal; team: Decimal }>();
    const appMonthAgg = new Map<string, Decimal[]>();
    for (const t of allTransactions) {
      const y = t.date.getUTCFullYear();
      if (!yearAgg.has(y)) yearAgg.set(y, { income: new Decimal(0), cost: new Decimal(0), team: new Decimal(0) });
      const bucket = yearAgg.get(y);
      if (!bucket) continue;
      const amount = new Decimal(t.amountBase);
      if (t.type === 'INCOME') bucket.income = bucket.income.add(amount);
      else if (t.type === 'BUSINESS_COST') {
        bucket.cost = bucket.cost.add(amount);
        const name = appName.get(t.applicationId ?? '') ?? 'Sin aplicación';
        if (!appMonthAgg.has(name))
          appMonthAgg.set(
            name,
            Array.from({ length: 12 }, () => new Decimal(0)),
          );
        const months = appMonthAgg.get(name);
        const idx = t.date.getUTCMonth();
        if (months?.[idx]) months[idx] = months[idx].add(amount);
      } else if (t.type === 'TEAM_PAYMENT') bucket.team = bucket.team.add(amount);
    }

    // La comision por periodo reemplaza al bruto facturado: sin esto los años y
    // meses comparaban el sueldo del cliente contra los costos de MIMOTECH.
    const comisionAnio = new Map<number, Decimal>();
    const comisionMes = new Map<string, Decimal>();
    for (const d of distribucionesSoles) {
      const comisionMimotech = new Decimal(String(d.amountReceived));
      if (d.year) comisionAnio.set(d.year, (comisionAnio.get(d.year) ?? new Decimal(0)).add(comisionMimotech));
      if (d.year && d.month) {
        const key = `${d.year}-${d.month}`;
        comisionMes.set(key, (comisionMes.get(key) ?? new Decimal(0)).add(comisionMimotech));
      }
    }
    const hayComision = comisionAnio.size > 0;

    const yearlyTotals = [...yearAgg.entries()]
      .map(([y, v]) => {
        const ingreso = hayComision ? (comisionAnio.get(y) ?? new Decimal(0)) : v.income;
        return {
          year: y,
          income: ingreso.toFixed(2),
          grossIncome: v.income.toFixed(2),
          cost: v.cost.toFixed(2),
          teamPayment: v.team.toFixed(2),
          utility: ingreso.minus(v.cost).minus(v.team).toFixed(2),
        };
      })
      .sort((a, b) => a.year - b.year);

    const costByAppMonth = [...appMonthAgg.entries()]
      .map(([name, months]) => ({
        name,
        months: months.map((m) => m.toFixed(2)),
        total: months.reduce((s, m) => s.add(m), new Decimal(0)).toFixed(2),
      }))
      .sort((a, b) => Number(b.total) - Number(a.total));

    const projectAgg = new Map<string, Decimal>();
    const monthlyAgg = new Map<string, { income: Decimal; cost: Decimal; team: Decimal }>();
    for (const t of transactions) {
      const amount = new Decimal(t.amountBase);
      const key = `${t.date.getUTCFullYear()}-${t.date.getUTCMonth() + 1}`;
      if (!monthlyAgg.has(key)) {
        monthlyAgg.set(key, { income: new Decimal(0), cost: new Decimal(0), team: new Decimal(0) });
      }
      const bucket = monthlyAgg.get(key);
      if (bucket) {
        if (t.type === 'INCOME') bucket.income = bucket.income.add(amount);
        else if (t.type === 'BUSINESS_COST') bucket.cost = bucket.cost.add(amount);
        else if (t.type === 'TEAM_PAYMENT') bucket.team = bucket.team.add(amount);
      }
      if (t.type !== 'BUSINESS_COST') continue;
      const names = t.projects.length ? t.projects.map((p) => p.name) : ['Sin proyecto'];
      for (const name of names) {
        projectAgg.set(name, (projectAgg.get(name) ?? new Decimal(0)).add(amount.div(names.length)));
      }
    }

    const costByProject = [...projectAgg.entries()]
      .map(([name, total]) => ({ name, total: total.toFixed(2) }))
      .sort((a, b) => Number(b.total) - Number(a.total));

    const monthlyFlow = [...monthlyAgg.entries()]
      .map(([key, v]) => {
        const [y = 0, m = 1] = key.split('-').map(Number);
        const ingreso = hayComision ? (comisionMes.get(`${y}-${m}`) ?? new Decimal(0)) : v.income;
        return {
          year: y,
          month: m,
          label: `${MONTH_NAMES[m - 1]} ${y}`,
          income: ingreso.toFixed(2),
          grossIncome: v.income.toFixed(2),
          cost: v.cost.toFixed(2),
          teamPayment: v.team.toFixed(2),
          utility: ingreso.minus(v.cost).minus(v.team).toFixed(2),
        };
      })
      .sort((a, b) => a.year - b.year || a.month - b.month);

    const projectCount = projects.length;

    let income = new Decimal(0);
    let cost = new Decimal(0);
    let teamPayment = new Decimal(0);
    const byApp = new Map<string, Decimal>();
    const byPerson = new Map<string, Decimal>();
    const teamPersonMonth = new Map<string, Decimal[]>();
    for (const t of transactions) {
      const amount = new Decimal(t.amountBase);
      if (t.type === 'INCOME') income = income.add(amount);
      else if (t.type === 'BUSINESS_COST') {
        cost = cost.add(amount);
        const name = appName.get(t.applicationId ?? '') ?? t.concept;
        byApp.set(name, (byApp.get(name) ?? new Decimal(0)).add(amount));
      } else if (t.type === 'TEAM_PAYMENT') {
        teamPayment = teamPayment.add(amount);
        const name = personName.get(t.personId ?? '') ?? t.concept;
        byPerson.set(name, (byPerson.get(name) ?? new Decimal(0)).add(amount));
        if (!teamPersonMonth.has(name)) {
          teamPersonMonth.set(
            name,
            Array.from({ length: 12 }, () => new Decimal(0)),
          );
        }
        const meses = teamPersonMonth.get(name);
        const idx = t.date.getUTCMonth();
        if (meses?.[idx]) meses[idx] = meses[idx].add(amount);
      }
    }

    const costByApp = [...byApp.entries()]
      .map(([name, total]) => ({ name, total: total.toFixed(2) }))
      .sort((a, b) => Number(b.total) - Number(a.total));
    const teamByPerson = [...byPerson.entries()]
      .map(([name, total]) => ({ name, total: total.toFixed(2) }))
      .sort((a, b) => Number(b.total) - Number(a.total));

    const teamByPersonMonth = [...teamPersonMonth.entries()]
      .map(([name, months]) => ({
        name,
        months: months.map((m) => m.toFixed(2)),
        total: months.reduce((s, m) => s.add(m), new Decimal(0)).toFixed(2),
      }))
      .sort((a, b) => Number(b.total) - Number(a.total));

    let talentPaid = new Decimal(0);
    let talentDebt = new Decimal(0);
    let talentPending = new Decimal(0);
    for (const e of ledger) {
      talentPaid = talentPaid.add(new Decimal(e.paidAmount));
      talentDebt = talentDebt.add(new Decimal(e.debtAmount));
      talentPending = talentPending.add(new Decimal(e.pendingAmount));
    }

    // El ingreso de un talento se registra con el monto que factura el cliente,
    // pero de ahi MIMOTECH cobra amountReceived y el talento se queda con
    // amountRetained: esa comision es el ingreso real de la empresa.
    const paraTalento = distribucionesSoles.reduce(
      (s, d) => s.plus(new Decimal(String(d.amountRetained))),
      new Decimal(0),
    );
    const comision = distribucionesSoles.reduce(
      (s, d) => s.plus(new Decimal(String(d.amountReceived))),
      new Decimal(0),
    );
    const facturado = distribucionesSoles.reduce(
      (s, d) => s.plus(new Decimal(String(d.amountWithDiscount))),
      new Decimal(0),
    );
    const realIncome = comision.gt(0) ? comision : income;

    const incomeUnderReview = transactions
      .filter((t) => t.type === 'INCOME' && t.status !== 'PAID')
      .reduce((s, t) => s.add(new Decimal(t.amountBase)), new Decimal(0));

    return {
      years,
      income: income.toFixed(2),
      incomeUnderReview: incomeUnderReview.toFixed(2),
      receivedIncome: realIncome.toFixed(2),
      talentBilled: facturado.toFixed(2),
      talentPayout: paraTalento.toFixed(2),
      talentCommission: comision.toFixed(2),
      teamByPersonMonth,
      cost: cost.toFixed(2),
      teamPayment: teamPayment.toFixed(2),
      utility: realIncome.minus(cost).minus(teamPayment).toFixed(2),
      costByApp,
      costByProject,
      costByAppMonth,
      teamByPerson,
      yearlyTotals,
      monthlyFlow,
      projectCount,
      talent: {
        paid: talentPaid.toFixed(2),
        debt: talentDebt.toFixed(2),
        pending: talentPending.toFixed(2),
        balance: talentPaid.minus(talentPending).toFixed(2),
      },
    };
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
        accounts: {
          id: string;
          bucket: string;
          bank: string | null;
          currency: string;
          amount: string;
          amountBase: string;
        }[];
      }
    >();

    for (const b of balances) {
      const key = `${b.year}-${b.month}`;
      if (!periods.has(key)) periods.set(key, { year: b.year, month: b.month, total: new Decimal(0), accounts: [] });
      const period = periods.get(key);
      if (!period) continue;
      period.total = period.total.add(new Decimal(b.amountBase));
      period.accounts.push({
        id: b.id,
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
