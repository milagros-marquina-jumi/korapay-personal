import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(workspaceId: string, startDate?: string, endDate?: string) {
    const dateFilter = {
      date: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      },
    };
    const where = {
      workspaceId,
      deletedAt: null,
      ...(startDate || endDate ? dateFilter : {}),
    };
    const transactions = await this.prisma.transaction.findMany({
      where,
      select: { type: true, status: true, amountBase: true },
    });

    const sumByType = (type: string) =>
      transactions.filter((t) => t.type === type).reduce((s, t) => s.plus(new Decimal(t.amountBase)), new Decimal(0));

    const ingresos = sumByType('INCOME');
    const egresos = sumByType('EXPENSE');
    const savings = sumByType('SAVING');
    const businessCosts = sumByType('BUSINESS_COST');
    const teamPayments = sumByType('TEAM_PAYMENT');

    const overdue = transactions
      .filter((t) => t.status === 'OVERDUE')
      .reduce((s, t) => s.plus(new Decimal(t.amountBase)), new Decimal(0));

    const accounts = await this.prisma.account.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, initialBalance: true },
    });
    const paidTx = await this.prisma.transaction.findMany({
      where: { workspaceId, deletedAt: null, status: 'PAID' },
      select: { type: true, amountBase: true, accountId: true, destAccountId: true },
    });
    const disponible = accounts.reduce((total, account) => {
      let balance = new Decimal(account.initialBalance);
      for (const t of paidTx) {
        const amt = new Decimal(t.amountBase);
        if (t.accountId === account.id) {
          balance = t.type === 'INCOME' || t.type === 'TRANSFER' ? balance.plus(amt) : balance.minus(amt);
        }
        if (t.destAccountId === account.id) {
          balance = balance.plus(amt);
        }
      }
      return total.plus(balance);
    }, new Decimal(0));

    const pendingItems = await this.prisma.pendingItem.findMany({
      where: { workspaceId, deletedAt: null, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
      select: { kind: true, amount: true },
    });
    const porCobrar = pendingItems
      .filter((p) => p.kind === 'COBRAR')
      .reduce((s, p) => s.plus(new Decimal(p.amount)), new Decimal(0));
    const porPagar = pendingItems
      .filter((p) => p.kind === 'PAGAR')
      .reduce((s, p) => s.plus(new Decimal(p.amount)), new Decimal(0));

    const debts = await this.prisma.debt.findMany({
      where: { workspaceId, deletedAt: null, status: { in: ['PENDING', 'PARTIAL'] } },
      select: { originalAmount: true },
    });
    const debtTotal = debts.reduce((s, d) => s.plus(new Decimal(d.originalAmount)), new Decimal(0));
    const debtPayments = await this.prisma.debtPayment.findMany({
      where: { debt: { workspaceId } },
      select: { amount: true },
    });
    const paidDebts = debtPayments.reduce((s, p) => s.plus(new Decimal(p.amount)), new Decimal(0));

    const distributions = await this.prisma.talentIncomeDistribution.findMany({
      where: { contract: { talentProfile: { workspaceId } } },
      select: { amountRetained: true, amountReceived: true },
    });
    const saldoMimotalents = distributions.reduce((s, d) => s.plus(new Decimal(d.amountRetained)), new Decimal(0));
    // Los ingresos por talentos se registran con el sueldo que paga el cliente, pero
    // MIMOTECH solo recibe una parte: el resto se lo queda el talento.
    const recibidoTalentos = distributions.reduce((s, d) => s.plus(new Decimal(d.amountReceived)), new Decimal(0));
    const ingresoReal = recibidoTalentos.gt(0) ? recibidoTalentos : ingresos;

    const patrimonio = disponible.plus(savings).plus(porCobrar).minus(debtTotal.minus(paidDebts));

    return {
      patrimonio: patrimonio.toFixed(2),
      ingresos: ingresos.toFixed(2),
      egresos: egresos.toFixed(2),
      disponible: disponible.toFixed(2),
      ahorro: savings.toFixed(2),
      porCobrar: porCobrar.toFixed(2),
      porPagar: porPagar.toFixed(2),
      vencido: overdue.toFixed(2),
      costosMimotech: businessCosts.toFixed(2),
      pagosEquipo: teamPayments.toFixed(2),
      ingresoRealMimotech: ingresoReal.toFixed(2),
      utilidadMimotech: ingresoReal.minus(businessCosts).minus(teamPayments).toFixed(2),
      saldoMimotalents: saldoMimotalents.toFixed(2),
      debtTotal: debtTotal.toFixed(2),
      debtPaid: paidDebts.toFixed(2),
    };
  }
}
