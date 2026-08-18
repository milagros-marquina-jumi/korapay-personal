import { randomBytes } from 'node:crypto';
import { isNeverPaid } from '@korapay/domain';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { sincronizarEmpresaCliente } from '@/common/catalog/sync-global-catalog';
import { ordenarDeudas } from '@/common/constants/debt-order';
import { MONTH_NAMES } from '@/common/constants/months';
import { PrismaService } from '@/common/prisma/prisma.service';
import type {
  CreateTalentDistributionDto,
  CreateTalentDto,
  UpdateTalentContractDto,
  UpdateTalentDistributionDto,
  UpdateTalentDto,
} from './talent.dto';

interface MonthlyBucket {
  salary: Decimal;
  withDiscount: Decimal;
  income: Decimal;
  kept: Decimal;
  expense: Decimal;
  debt: Decimal;
  pending: Decimal;
}

@Injectable()
export class TalentService {
  constructor(private readonly prisma: PrismaService) {}

  async report(talentId: string, workspaceId: string) {
    const talent = await this.prisma.talentProfile.findFirst({
      where: { id: talentId, workspaceId, deletedAt: null },
      include: { contracts: { include: { incomeDistributions: true } } },
    });
    if (!talent) throw new NotFoundException('Talent not found');
    const looseDistributions = await this.prisma.talentIncomeDistribution.findMany({
      where: { talentId, contractId: null },
    });
    const ledger = await this.prisma.talentLedgerEntry.findMany({
      where: { talentId, workspaceId, deletedAt: null },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    let salary = new Decimal(0);
    let withDiscount = new Decimal(0);
    let receivedByMe = new Decimal(0);
    let keptByTalent = new Decimal(0);
    const monthly = new Map<string, MonthlyBucket>();
    const bucket = (year: number | null | undefined, month: number | null | undefined) => {
      const key = `${year ?? 0}-${month ?? 0}`;
      let b = monthly.get(key);
      if (!b) {
        b = {
          salary: new Decimal(0),
          withDiscount: new Decimal(0),
          income: new Decimal(0),
          kept: new Decimal(0),
          expense: new Decimal(0),
          debt: new Decimal(0),
          pending: new Decimal(0),
        };
        monthly.set(key, b);
      }
      return b;
    };

    const allDistributions: {
      salary: unknown;
      amountWithDiscount: unknown;
      amountReceived: unknown;
      amountRetained: unknown;
      year: number | null;
      month: number | null;
      companyName?: string | null;
      clientName?: string | null;
      paymentType: string;
    }[] = [];
    for (const c of talent.contracts) {
      for (const d of c.incomeDistributions) {
        allDistributions.push({
          ...d,
          companyName: d.companyName ?? c.companyName,
          clientName: d.clientName ?? c.clientName,
        });
      }
    }
    for (const d of looseDistributions) allDistributions.push(d);

    for (const d of allDistributions) {
      salary = salary.add(new Decimal(String(d.salary ?? 0)));
      withDiscount = withDiscount.add(new Decimal(String(d.amountWithDiscount)));
      receivedByMe = receivedByMe.add(new Decimal(String(d.amountReceived)));
      keptByTalent = keptByTalent.add(new Decimal(String(d.amountRetained)));
      const b = bucket(d.year, d.month);
      b.salary = b.salary.add(new Decimal(String(d.salary ?? 0)));
      b.withDiscount = b.withDiscount.add(new Decimal(String(d.amountWithDiscount)));
      b.income = b.income.add(new Decimal(String(d.amountReceived)));
      b.kept = b.kept.add(new Decimal(String(d.amountRetained)));
    }

    let paid = new Decimal(0);
    let debt = new Decimal(0);
    let pending = new Decimal(0);
    for (const e of ledger) {
      paid = paid.add(new Decimal(e.paidAmount));
      debt = debt.add(new Decimal(e.debtAmount));
      pending = pending.add(new Decimal(e.pendingAmount));
      const b = bucket(e.year, e.month);
      b.expense = b.expense.add(new Decimal(e.paidAmount));
      b.debt = b.debt.add(new Decimal(e.debtAmount));
      b.pending = b.pending.add(new Decimal(e.pendingAmount));
    }

    const byMonth = [...monthly.entries()]
      .map(([key, v]) => {
        const [y = 0, m = 0] = key.split('-').map(Number);
        return {
          year: y,
          month: m,
          label: m >= 1 && m <= 12 ? `${MONTH_NAMES[m - 1]} ${y}` : String(y),
          salary: v.salary.toFixed(2),
          withDiscount: v.withDiscount.toFixed(2),
          income: v.income.toFixed(2),
          kept: v.kept.toFixed(2),
          expense: v.expense.toFixed(2),
          debt: v.debt.toFixed(2),
          pending: v.pending.toFixed(2),
          net: v.income.minus(v.expense).toFixed(2),
        };
      })
      .sort((a, b) => a.year - b.year || a.month - b.month);

    const debtRows = ordenarDeudas(
      ledger
        .filter((e) => new Decimal(e.debtAmount).gt(0) || new Decimal(e.pendingAmount).gt(0))
        .map((e) => ({
          id: e.id,
          date: e.date.toISOString().slice(0, 10),
          description: e.description ?? '',
          debt: new Decimal(e.debtAmount).toFixed(2),
          pending: new Decimal(e.pendingAmount).toFixed(2),
          status: e.status,
          debtOwner: e.debtOwner,
        })),
    );

    const companyMap = new Map<string, { received: Decimal; kept: Decimal; salary: Decimal; count: number }>();
    for (const d of allDistributions) {
      const name = (d.companyName ?? 'Sin empresa') || 'Sin empresa';
      let row = companyMap.get(name);
      if (!row) {
        row = { received: new Decimal(0), kept: new Decimal(0), salary: new Decimal(0), count: 0 };
        companyMap.set(name, row);
      }
      row.received = row.received.add(new Decimal(String(d.amountReceived)));
      row.kept = row.kept.add(new Decimal(String(d.amountRetained)));
      row.salary = row.salary.add(new Decimal(String(d.salary ?? 0)));
      row.count += 1;
    }

    const clientMap = new Map<string, { received: Decimal; kept: Decimal }>();
    for (const d of allDistributions) {
      const name = (d.clientName ?? 'Sin cliente') || 'Sin cliente';
      let row = clientMap.get(name);
      if (!row) {
        row = { received: new Decimal(0), kept: new Decimal(0) };
        clientMap.set(name, row);
      }
      row.received = row.received.add(new Decimal(String(d.amountReceived)));
      row.kept = row.kept.add(new Decimal(String(d.amountRetained)));
    }

    const paymentTypeMap = new Map<string, { received: Decimal; kept: Decimal; count: number }>();
    for (const d of allDistributions) {
      const key = d.paymentType || 'Otro';
      let row = paymentTypeMap.get(key);
      if (!row) {
        row = { received: new Decimal(0), kept: new Decimal(0), count: 0 };
        paymentTypeMap.set(key, row);
      }
      row.received = row.received.add(new Decimal(String(d.amountReceived)));
      row.kept = row.kept.add(new Decimal(String(d.amountRetained)));
      row.count += 1;
    }

    const expenseCategoryMap = new Map<string, { paid: Decimal; debt: Decimal; pending: Decimal }>();
    for (const e of ledger) {
      const key = e.category ?? 'SIN_CATEGORIA';
      let row = expenseCategoryMap.get(key);
      if (!row) {
        row = { paid: new Decimal(0), debt: new Decimal(0), pending: new Decimal(0) };
        expenseCategoryMap.set(key, row);
      }
      row.paid = row.paid.add(new Decimal(String(e.paidAmount)));
      row.debt = row.debt.add(new Decimal(String(e.debtAmount)));
      row.pending = row.pending.add(new Decimal(String(e.pendingAmount)));
    }

    const fraudLoss = ledger
      .filter((e) => isNeverPaid(e.status))
      .reduce(
        (s, e) => s.plus(new Decimal(String(e.paidAmount))).plus(new Decimal(String(e.pendingAmount))),
        new Decimal(0),
      );

    return {
      income: {
        salary: salary.toFixed(2),
        withDiscount: withDiscount.toFixed(2),
        receivedByMe: receivedByMe.toFixed(2),
        keptByTalent: keptByTalent.toFixed(2),
      },
      expense: {
        paid: paid.toFixed(2),
        debt: debt.toFixed(2),
        pending: pending.toFixed(2),
        fraudLoss: fraudLoss.toFixed(2),
      },
      net: receivedByMe.minus(paid).toFixed(2),
      byMonth,
      debtRows,
      byCompany: [...companyMap.entries()]
        .map(([name, v]) => ({
          name,
          received: v.received.toFixed(2),
          kept: v.kept.toFixed(2),
          salary: v.salary.toFixed(2),
          payments: v.count,
        }))
        .sort((a, b) => Number(b.received) - Number(a.received)),
      byClient: [...clientMap.entries()]
        .map(([name, v]) => ({ name, received: v.received.toFixed(2), kept: v.kept.toFixed(2) }))
        .sort((a, b) => Number(b.received) - Number(a.received)),
      byPaymentType: [...paymentTypeMap.entries()]
        .map(([name, v]) => ({
          name,
          received: v.received.toFixed(2),
          kept: v.kept.toFixed(2),
          count: v.count,
        }))
        .sort((a, b) => Number(b.received) - Number(a.received)),
      expenseByCategory: [...expenseCategoryMap.entries()]
        .map(([name, v]) => ({
          name,
          paid: v.paid.toFixed(2),
          debt: v.debt.toFixed(2),
          pending: v.pending.toFixed(2),
        }))
        .sort((a, b) => Number(b.paid) - Number(a.paid)),
    };
  }
  async globalReport(workspaceId: string, year?: number) {
    const talents = await this.prisma.talentProfile.findMany({
      where: { workspaceId, deletedAt: null },
      include: { contracts: { include: { incomeDistributions: true } } },
      orderBy: { name: 'asc' },
    });
    const looseDistributions = await this.prisma.talentIncomeDistribution.findMany({
      where: { contractId: null, talent: { workspaceId, deletedAt: null } },
    });
    const looseByTalent = new Map<string, typeof looseDistributions>();
    for (const d of looseDistributions) {
      if (!d.talentId) continue;
      const arr = looseByTalent.get(d.talentId) ?? [];
      arr.push(d);
      looseByTalent.set(d.talentId, arr);
    }
    const ledger = await this.prisma.talentLedgerEntry.findMany({
      where: { workspaceId, deletedAt: null },
    });

    const yearSet = new Set<number>();
    const incomeByPerson: {
      talentId: string;
      name: string;
      salary: Decimal;
      withDiscount: Decimal;
      received: Decimal;
      kept: Decimal;
    }[] = [];
    const expenseByPerson: {
      talentId: string;
      name: string;
      paid: Decimal;
      debt: Decimal;
      pending: Decimal;
      count: number;
    }[] = [];

    const estadoPorNombre = new Map<string, string>();
    const rolPorNombre = new Map<string, string | null>();
    for (const t of talents) {
      estadoPorNombre.set(t.name, t.status ?? 'ACTIVE');
      rolPorNombre.set(t.name, t.role ?? null);
    }

    const yearlyByTalent = new Map<string, Map<number, { received: Decimal; paid: Decimal; count: number }>>();
    const yearlyBucket = (talentName: string, anio: number) => {
      let porAnio = yearlyByTalent.get(talentName);
      if (!porAnio) {
        porAnio = new Map();
        yearlyByTalent.set(talentName, porAnio);
      }
      let fila = porAnio.get(anio);
      if (!fila) {
        fila = { received: new Decimal(0), paid: new Decimal(0), count: 0 };
        porAnio.set(anio, fila);
      }
      return fila;
    };

    const incomePivot = new Map<string, Map<string, Decimal>>();
    const expensePivot = new Map<string, Map<string, Decimal>>();
    const incomePeriodTotals = new Map<string, Decimal>();
    const expensePeriodTotals = new Map<string, Decimal>();
    const setCell = (
      map: Map<string, Map<string, Decimal>>,
      totals: Map<string, Decimal>,
      period: string,
      name: string,
      amount: Decimal,
    ) => {
      let row = map.get(period);
      if (!row) {
        row = new Map<string, Decimal>();
        map.set(period, row);
      }
      row.set(name, (row.get(name) ?? new Decimal(0)).add(amount));
      totals.set(period, (totals.get(period) ?? new Decimal(0)).add(amount));
    };

    const companyAgg = new Map<
      string,
      { received: Decimal; kept: Decimal; salary: Decimal; talents: Set<string>; count: number }
    >();
    const clientAgg = new Map<string, { received: Decimal; kept: Decimal; talents: Set<string> }>();
    const paymentTypeAgg = new Map<string, { received: Decimal; kept: Decimal; count: number }>();
    const timeSeries = new Map<string, { income: Decimal; expense: Decimal }>();
    const timeSeriesBucket = (y: number | null | undefined, m: number | null | undefined) => {
      const k = `${y ?? 0}-${m ?? 0}`;
      let b = timeSeries.get(k);
      if (!b) {
        b = { income: new Decimal(0), expense: new Decimal(0) };
        timeSeries.set(k, b);
      }
      return b;
    };
    const addDistribAgg = (
      talentName: string,
      talentId: string,
      d: {
        salary: unknown;
        amountWithDiscount: unknown;
        amountReceived: unknown;
        amountRetained: unknown;
        year: number | null;
        month: number | null;
        companyName?: string | null;
        clientName?: string | null;
        paymentType?: string | null;
      },
    ) => {
      const cName = (d.companyName ?? 'Sin empresa') || 'Sin empresa';
      let cRow = companyAgg.get(cName);
      if (!cRow) {
        cRow = { received: new Decimal(0), kept: new Decimal(0), salary: new Decimal(0), talents: new Set(), count: 0 };
        companyAgg.set(cName, cRow);
      }
      cRow.received = cRow.received.add(new Decimal(String(d.amountReceived)));
      cRow.kept = cRow.kept.add(new Decimal(String(d.amountRetained)));
      cRow.salary = cRow.salary.add(new Decimal(String(d.salary ?? 0)));
      cRow.talents.add(talentName);
      cRow.count += 1;

      const clName = (d.clientName ?? 'Sin cliente') || 'Sin cliente';
      let clRow = clientAgg.get(clName);
      if (!clRow) {
        clRow = { received: new Decimal(0), kept: new Decimal(0), talents: new Set() };
        clientAgg.set(clName, clRow);
      }
      clRow.received = clRow.received.add(new Decimal(String(d.amountReceived)));
      clRow.kept = clRow.kept.add(new Decimal(String(d.amountRetained)));
      clRow.talents.add(talentName);

      const pt = d.paymentType || 'Otro';
      let ptRow = paymentTypeAgg.get(pt);
      if (!ptRow) {
        ptRow = { received: new Decimal(0), kept: new Decimal(0), count: 0 };
        paymentTypeAgg.set(pt, ptRow);
      }
      ptRow.received = ptRow.received.add(new Decimal(String(d.amountReceived)));
      ptRow.kept = ptRow.kept.add(new Decimal(String(d.amountRetained)));
      ptRow.count += 1;

      if (d.year && d.month) {
        const ts = timeSeriesBucket(d.year, d.month);
        ts.income = ts.income.add(new Decimal(String(d.amountReceived)));
      }
      if (d.year) {
        const anual = yearlyBucket(talentName, d.year);
        anual.received = anual.received.add(new Decimal(String(d.amountReceived)));
      }
    };

    for (const t of talents) {
      let salary = new Decimal(0);
      let withDiscount = new Decimal(0);
      let received = new Decimal(0);
      let kept = new Decimal(0);
      for (const c of t.contracts) {
        for (const d of c.incomeDistributions) {
          if (year && d.year !== year) continue;
          if (d.year) yearSet.add(d.year);
          salary = salary.add(new Decimal(d.salary ?? 0));
          withDiscount = withDiscount.add(new Decimal(d.amountWithDiscount));
          received = received.add(new Decimal(d.amountReceived));
          kept = kept.add(new Decimal(d.amountRetained));
          if (d.year && d.month) {
            setCell(incomePivot, incomePeriodTotals, `${d.year}-${d.month}`, t.name, new Decimal(d.amountReceived));
          }
          addDistribAgg(t.name, t.id, {
            ...d,
            companyName: d.companyName ?? c.companyName,
            clientName: d.clientName ?? c.clientName,
          });
        }
      }
      const loose = looseByTalent.get(t.id) ?? [];
      for (const d of loose) {
        if (year && d.year !== year) continue;
        if (d.year) yearSet.add(d.year);
        salary = salary.add(new Decimal(String(d.salary ?? 0)));
        withDiscount = withDiscount.add(new Decimal(String(d.amountWithDiscount)));
        received = received.add(new Decimal(String(d.amountReceived)));
        kept = kept.add(new Decimal(String(d.amountRetained)));
        if (d.year && d.month) {
          setCell(
            incomePivot,
            incomePeriodTotals,
            `${d.year}-${d.month}`,
            t.name,
            new Decimal(String(d.amountReceived)),
          );
        }
        addDistribAgg(t.name, t.id, d);
      }
      incomeByPerson.push({ talentId: t.id, name: t.name, salary, withDiscount, received, kept });
    }

    const ledgerByTalent = new Map<string, { name: string; entries: typeof ledger }>();
    for (const t of talents) ledgerByTalent.set(t.id, { name: t.name, entries: [] });
    for (const e of ledger) {
      if (year && e.year !== year) continue;
      if (e.year) yearSet.add(e.year);
      const owner = ledgerByTalent.get(e.talentId);
      if (owner) owner.entries.push(e);
    }
    const expenseCategoryAgg = new Map<string, { paid: Decimal; debt: Decimal; pending: Decimal }>();
    let totalFraudLoss = new Decimal(0);
    for (const [talentId, { name, entries }] of ledgerByTalent) {
      let paid = new Decimal(0);
      let debt = new Decimal(0);
      let pending = new Decimal(0);
      for (const e of entries) {
        paid = paid.add(new Decimal(e.paidAmount));
        debt = debt.add(new Decimal(e.debtAmount));
        pending = pending.add(new Decimal(e.pendingAmount));
        if (e.year && e.month) {
          setCell(expensePivot, expensePeriodTotals, `${e.year}-${e.month}`, name, new Decimal(e.paidAmount));
          const ts = timeSeriesBucket(e.year, e.month);
          ts.expense = ts.expense.add(new Decimal(String(e.paidAmount)));
        }
        if (e.year) {
          const anual = yearlyBucket(name, e.year);
          anual.paid = anual.paid.add(new Decimal(String(e.paidAmount)));
          if (e.type === 'EGRESO') anual.count += 1;
        }
        const catKey = e.category ?? 'SIN_CATEGORIA';
        let catRow = expenseCategoryAgg.get(catKey);
        if (!catRow) {
          catRow = { paid: new Decimal(0), debt: new Decimal(0), pending: new Decimal(0) };
          expenseCategoryAgg.set(catKey, catRow);
        }
        catRow.paid = catRow.paid.add(new Decimal(String(e.paidAmount)));
        catRow.debt = catRow.debt.add(new Decimal(String(e.debtAmount)));
        catRow.pending = catRow.pending.add(new Decimal(String(e.pendingAmount)));
        if (isNeverPaid(e.status)) {
          totalFraudLoss = totalFraudLoss
            .plus(new Decimal(String(e.paidAmount)))
            .plus(new Decimal(String(e.pendingAmount)));
        }
      }
      expenseByPerson.push({
        talentId,
        name,
        paid,
        debt,
        pending,
        count: entries.filter((e) => e.type === 'EGRESO').length,
      });
    }

    const periodLabel = (key: string) => {
      const [y = 0, m = 0] = key.split('-').map(Number);
      return { year: y, month: m, label: m >= 1 && m <= 12 ? `${MONTH_NAMES[m - 1]} ${y}` : String(y) };
    };
    const buildPivot = (map: Map<string, Map<string, Decimal>>, totals: Map<string, Decimal>) =>
      [...map.entries()]
        .map(([key, row]) => ({
          ...periodLabel(key),
          total: (totals.get(key) ?? new Decimal(0)).toFixed(2),
          cells: [...row.entries()]
            .map(([name, amount]) => ({ name, amount: amount.toFixed(2) }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .sort((a, b) => a.year - b.year || a.month - b.month);

    const totalReceived = incomeByPerson.reduce((s, p) => s.plus(p.received), new Decimal(0));
    const totalWithDiscount = incomeByPerson.reduce((s, p) => s.plus(p.withDiscount), new Decimal(0));
    const totalSalary = incomeByPerson.reduce((s, p) => s.plus(p.salary), new Decimal(0));
    const totalKept = incomeByPerson.reduce((s, p) => s.plus(p.kept), new Decimal(0));
    const totalPaid = expenseByPerson.reduce((s, p) => s.plus(p.paid), new Decimal(0));
    const totalDebt = expenseByPerson.reduce((s, p) => s.plus(p.debt), new Decimal(0));
    const totalPending = expenseByPerson.reduce((s, p) => s.plus(p.pending), new Decimal(0));

    const timeSeriesRows = [...timeSeries.entries()]
      .map(([key, v]) => {
        const [y = 0, m = 0] = key.split('-').map(Number);
        return {
          year: y,
          month: m,
          label: m >= 1 && m <= 12 ? `${MONTH_NAMES[m - 1]} ${y}` : String(y),
          income: v.income.toFixed(2),
          expense: v.expense.toFixed(2),
          net: v.income.minus(v.expense).toFixed(2),
        };
      })
      .sort((a, b) => a.year - b.year || a.month - b.month);

    const profitabilityByPerson = incomeByPerson
      .map((p) => {
        const exp = expenseByPerson.find((e) => e.talentId === p.talentId);
        const paidDec = exp?.paid ?? new Decimal(0);
        const net = p.received.minus(paidDec);
        return {
          talentId: p.talentId,
          name: p.name,
          received: p.received.toFixed(2),
          paid: paidDec.toFixed(2),
          net: net.toFixed(2),
          margin: p.received.gt(0) ? net.div(p.received).mul(100).toFixed(1) : '0.0',
          status: estadoPorNombre.get(p.name) ?? 'ACTIVE',
          role: rolPorNombre.get(p.name) ?? null,
        };
      })
      .sort((a, b) => Number(b.net) - Number(a.net));

    return {
      years: [...yearSet].sort((a, b) => b - a),
      totals: {
        salary: totalSalary.toFixed(2),
        withDiscount: totalWithDiscount.toFixed(2),
        received: totalReceived.toFixed(2),
        kept: totalKept.toFixed(2),
        paid: totalPaid.toFixed(2),
        debt: totalDebt.toFixed(2),
        pending: totalPending.toFixed(2),
        net: totalReceived.minus(totalPaid).toFixed(2),
        fraudLoss: totalFraudLoss.toFixed(2),
      },
      incomeByPerson: incomeByPerson
        .map((p) => ({
          talentId: p.talentId,
          name: p.name,
          salary: p.salary.toFixed(2),
          withDiscount: p.withDiscount.toFixed(2),
          received: p.received.toFixed(2),
          kept: p.kept.toFixed(2),
          status: estadoPorNombre.get(p.name) ?? 'ACTIVE',
          role: rolPorNombre.get(p.name) ?? null,
        }))
        .sort((a, b) => Number(b.received) - Number(a.received)),
      expenseByPerson: expenseByPerson
        .map((p) => ({
          talentId: p.talentId,
          name: p.name,
          paid: p.paid.toFixed(2),
          debt: p.debt.toFixed(2),
          pending: p.pending.toFixed(2),
          count: p.count,
          status: estadoPorNombre.get(p.name) ?? 'ACTIVE',
          role: rolPorNombre.get(p.name) ?? null,
        }))
        .sort((a, b) => Number(b.paid) - Number(a.paid)),
      yearlyByTalent: [...yearlyByTalent.entries()]
        .map(([name, porAnio]) => ({
          name,
          status: estadoPorNombre.get(name) ?? 'ACTIVE',
          role: rolPorNombre.get(name) ?? null,
          years: [...porAnio.entries()]
            .map(([anio, v]) => ({
              year: anio,
              received: v.received.toFixed(2),
              paid: v.paid.toFixed(2),
              count: v.count,
            }))
            .sort((a, b) => a.year - b.year),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      incomePivot: buildPivot(incomePivot, incomePeriodTotals),
      expensePivot: buildPivot(expensePivot, expensePeriodTotals),
      byCompany: [...companyAgg.entries()]
        .map(([name, v]) => ({
          name,
          received: v.received.toFixed(2),
          kept: v.kept.toFixed(2),
          salary: v.salary.toFixed(2),
          talents: [...v.talents].sort(),
          payments: v.count,
        }))
        .sort((a, b) => Number(b.received) - Number(a.received)),
      byClient: [...clientAgg.entries()]
        .map(([name, v]) => ({
          name,
          received: v.received.toFixed(2),
          kept: v.kept.toFixed(2),
          talents: [...v.talents].sort(),
        }))
        .sort((a, b) => Number(b.received) - Number(a.received)),
      byPaymentType: [...paymentTypeAgg.entries()]
        .map(([name, v]) => ({
          name,
          received: v.received.toFixed(2),
          kept: v.kept.toFixed(2),
          count: v.count,
        }))
        .sort((a, b) => Number(b.received) - Number(a.received)),
      expenseByCategory: [...expenseCategoryAgg.entries()]
        .map(([name, v]) => ({
          name,
          paid: v.paid.toFixed(2),
          debt: v.debt.toFixed(2),
          pending: v.pending.toFixed(2),
        }))
        .sort((a, b) => Number(b.paid) - Number(a.paid)),
      timeSeries: timeSeriesRows,
      profitabilityByPerson,
    };
  }

  async generateAccessToken(id: string, workspaceId: string) {
    const talent = await this.prisma.talentProfile.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!talent) throw new NotFoundException('Talent not found');
    const token = randomBytes(24).toString('base64url');
    return this.prisma.talentProfile.update({
      where: { id },
      data: { accessToken: token, tokenEnabledAt: new Date() },
    });
  }
  async revokeAccessToken(id: string, workspaceId: string) {
    const talent = await this.prisma.talentProfile.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!talent) throw new NotFoundException('Talent not found');
    return this.prisma.talentProfile.update({
      where: { id },
      data: { accessToken: null, tokenEnabledAt: null },
    });
  }
  async findAll(workspaceId: string) {
    return this.prisma.talentProfile.findMany({
      where: { workspaceId, deletedAt: null },
      include: { contracts: true },
      orderBy: { name: 'asc' },
    });
  }
  async findOne(id: string, workspaceId: string) {
    const talent = await this.prisma.talentProfile.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: { contracts: { include: { incomeDistributions: true } } },
    });
    if (!talent) throw new NotFoundException('Talent not found');
    const looseDistributions = await this.prisma.talentIncomeDistribution.findMany({
      where: { talentId: id, contractId: null },
      orderBy: [{ date: 'desc' }],
    });
    const sortedContracts = [...talent.contracts].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    const claveEmpresa = (nombre: string | null) => (nombre ?? '').trim().toLowerCase() || '__none__';
    const totalPorEmpresa = new Map<string, number>();
    for (const c of sortedContracts) {
      const key = claveEmpresa(c.companyName);
      totalPorEmpresa.set(key, (totalPorEmpresa.get(key) ?? 0) + 1);
    }
    const companyCounter = new Map<string, number>();
    for (const c of sortedContracts) {
      const key = claveEmpresa(c.companyName);
      const next = (companyCounter.get(key) ?? 0) + 1;
      companyCounter.set(key, next);
      const conSecuencia = c as unknown as { sequenceIndex: number; sequenceTotal: number };
      conSecuencia.sequenceIndex = next;
      conSecuencia.sequenceTotal = totalPorEmpresa.get(key) ?? 1;
    }
    return { ...talent, contracts: sortedContracts, looseDistributions };
  }
  private mapTalentData(data: CreateTalentDto | UpdateTalentDto): Prisma.TalentProfileUncheckedUpdateInput {
    const out: Prisma.TalentProfileUncheckedUpdateInput = {};
    // name y status no son anulables en el esquema: solo se escriben si traen valor.
    if (data.name) out.name = data.name;
    if (data.status) out.status = data.status;
    for (const key of ['email', 'phone', 'notes', 'terminationReason', 'role', 'studyPlace', 'slideUrl'] as const) {
      if (data[key] !== undefined) out[key] = data[key] === '' ? null : data[key];
    }
    for (const key of ['startedWithMeAt', 'endedWithMeAt', 'firstJobAt', 'studyStartAt', 'studyEndAt'] as const) {
      if (data[key] !== undefined) out[key] = data[key] ? new Date(data[key]) : null;
    }
    if (data.startedWithMeAt && data.endedWithMeAt && data.endedWithMeAt < data.startedWithMeAt) {
      throw new BadRequestException('La fecha de fin no puede ser anterior a la de inicio');
    }
    return out;
  }
  async create(data: CreateTalentDto) {
    return this.prisma.talentProfile.create({
      data: {
        ...(this.mapTalentData(data) as Prisma.TalentProfileUncheckedCreateInput),
        workspaceId: data.workspaceId,
        name: data.name,
      },
    });
  }
  async update(id: string, workspaceId: string, data: UpdateTalentDto) {
    const talent = await this.prisma.talentProfile.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!talent) throw new NotFoundException('Talent not found');
    return this.prisma.talentProfile.update({
      where: { id },
      data: this.mapTalentData(data),
    });
  }
  async remove(id: string, workspaceId: string) {
    const talent = await this.prisma.talentProfile.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!talent) throw new NotFoundException('Talent not found');
    return this.prisma.talentProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  async addContract(
    talentProfileId: string,
    workspaceId: string,
    data: {
      companyName?: string;
      clientName?: string;
      position?: string;
      paymentType?: string;
      rate?: string;
      currency?: string;
      startDate: string;
      endDate?: string;
      status?: string;
      contractTerm?: string;
      notes?: string;
    },
  ) {
    const talent = await this.prisma.talentProfile.findFirst({
      where: { id: talentProfileId, workspaceId, deletedAt: null },
    });
    if (!talent) throw new NotFoundException('Talent not found');
    await sincronizarEmpresaCliente(this.prisma, data.companyName, data.clientName);
    return this.prisma.talentContract.create({
      data: {
        talentProfileId,
        companyName: data.companyName ?? null,
        clientName: data.clientName ?? null,
        position: data.position ?? null,
        paymentType: data.paymentType ?? null,
        rate: data.rate ?? null,
        currency: data.currency ?? 'PEN',
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status ?? (data.endDate ? 'FINISHED' : 'ACTIVE'),
        contractTerm: data.contractTerm ?? null,
        notes: data.notes ?? null,
      },
    });
  }
  async updateContract(contractId: string, workspaceId: string, data: UpdateTalentContractDto) {
    const contract = await this.prisma.talentContract.findFirst({
      where: { id: contractId, talentProfile: { workspaceId, deletedAt: null } },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    const updateData: Record<string, unknown> = {};
    for (const key of [
      'companyName',
      'clientName',
      'position',
      'paymentType',
      'rate',
      'currency',
      'status',
      'contractTerm',
      'notes',
    ] as const) {
      if (data[key] !== undefined) updateData[key] = data[key] === '' ? null : data[key];
    }
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    await sincronizarEmpresaCliente(
      this.prisma,
      data.companyName !== undefined ? data.companyName : contract.companyName,
      data.clientName !== undefined ? data.clientName : contract.clientName,
    );
    return this.prisma.talentContract.update({ where: { id: contractId }, data: updateData });
  }
  async removeContract(contractId: string, workspaceId: string) {
    const contract = await this.prisma.talentContract.findFirst({
      where: { id: contractId, talentProfile: { workspaceId, deletedAt: null } },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return this.prisma.talentContract.delete({ where: { id: contractId } });
  }
  async addDistribution(contractId: string, workspaceId: string, data: CreateTalentDistributionDto) {
    const contract = await this.prisma.talentContract.findFirst({
      where: { id: contractId, talentProfile: { workspaceId, deletedAt: null } },
    });
    if (!contract) throw new NotFoundException('Talent contract not found');
    const d = data.date ? new Date(data.date) : null;
    await sincronizarEmpresaCliente(this.prisma, data.companyName, data.clientName);
    return this.prisma.talentIncomeDistribution.create({
      data: {
        contractId,
        talentId: contract.talentProfileId,
        transactionId: data.transactionId ?? null,
        date: d,
        year: data.year != null ? data.year : (d?.getUTCFullYear() ?? null),
        month: data.month != null ? data.month : d ? d.getUTCMonth() + 1 : null,
        paymentType: data.paymentType ?? 'Mensual',
        companyName: data.companyName ?? null,
        clientName: data.clientName ?? null,
        salary: data.salary ?? null,
        amountWithDiscount: data.amountWithDiscount,
        amountReceived: data.amountReceived,
        amountRetained: data.amountRetained,
        notes: data.notes ?? null,
        status: data.status ?? 'PENDING',
      },
    });
  }

  async addLooseDistribution(talentId: string, workspaceId: string, data: CreateTalentDistributionDto) {
    const talent = await this.prisma.talentProfile.findFirst({
      where: { id: talentId, workspaceId, deletedAt: null },
    });
    if (!talent) throw new NotFoundException('Talent not found');
    const d = data.date ? new Date(data.date) : null;
    await sincronizarEmpresaCliente(this.prisma, data.companyName, data.clientName);
    return this.prisma.talentIncomeDistribution.create({
      data: {
        contractId: null,
        talentId,
        transactionId: data.transactionId ?? null,
        date: d,
        year: data.year != null ? data.year : (d?.getUTCFullYear() ?? null),
        month: data.month != null ? data.month : d ? d.getUTCMonth() + 1 : null,
        paymentType: data.paymentType ?? 'CTS',
        companyName: data.companyName ?? null,
        clientName: data.clientName ?? null,
        salary: data.salary ?? null,
        amountWithDiscount: data.amountWithDiscount,
        amountReceived: data.amountReceived,
        amountRetained: data.amountRetained,
        notes: data.notes ?? null,
        status: data.status ?? 'PAID',
      },
    });
  }

  async updateDistribution(distId: string, workspaceId: string, data: UpdateTalentDistributionDto) {
    const dist = await this.prisma.talentIncomeDistribution.findFirst({
      where: {
        id: distId,
        OR: [
          { contract: { talentProfile: { workspaceId, deletedAt: null } } },
          { talent: { workspaceId, deletedAt: null } },
        ],
      },
    });
    if (!dist) throw new NotFoundException('Distribution not found');
    const updateData: Record<string, unknown> = {};
    for (const key of [
      'paymentType',
      'companyName',
      'clientName',
      'salary',
      'amountWithDiscount',
      'amountReceived',
      'amountRetained',
      'status',
      'notes',
      'year',
      'month',
    ] as const) {
      if (data[key] !== undefined) updateData[key] = data[key] === '' ? null : data[key];
    }
    if (data.date !== undefined) updateData.date = data.date ? new Date(data.date) : null;
    await sincronizarEmpresaCliente(
      this.prisma,
      data.companyName !== undefined ? data.companyName : dist.companyName,
      data.clientName !== undefined ? data.clientName : dist.clientName,
    );
    return this.prisma.talentIncomeDistribution.update({ where: { id: distId }, data: updateData });
  }
  async removeDistribution(distId: string, workspaceId: string) {
    const dist = await this.prisma.talentIncomeDistribution.findFirst({
      where: {
        id: distId,
        OR: [
          { contract: { talentProfile: { workspaceId, deletedAt: null } } },
          { talent: { workspaceId, deletedAt: null } },
        ],
      },
    });
    if (!dist) throw new NotFoundException('Distribution not found');
    return this.prisma.talentIncomeDistribution.delete({ where: { id: distId } });
  }
}
