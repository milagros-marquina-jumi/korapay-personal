import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import type { PrismaService } from '@/common/prisma/prisma.service';
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
    const pending = transactions
      .filter((t) => t.status === 'PENDING')
      .reduce((s, t) => s.plus(new Decimal(t.amountBase)), new Decimal(0));
    const overdue = transactions
      .filter((t) => t.status === 'OVERDUE')
      .reduce((s, t) => s.plus(new Decimal(t.amountBase)), new Decimal(0));
    const accounts = await this.prisma.account.findMany({
      where: { workspaceId, deletedAt: null },
    });
    const available = accounts.reduce((s, a) => s.plus(new Decimal(a.initialBalance)), new Decimal(0));
    const debts = await this.prisma.debt.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        status: { in: ['PENDING', 'PARTIAL'] },
      },
    });
    const debtTotal = debts.reduce((s, d) => s.plus(new Decimal(d.originalAmount)), new Decimal(0));
    const debtPayments = await this.prisma.debtPayment.findMany({
      where: { debt: { workspaceId } },
    });
    const paidDebts = debtPayments.reduce((s, p) => s.plus(new Decimal(p.amount)), new Decimal(0));
    const patrimonio = ingresos.minus(egresos).plus(savings);
    return {
      patrimonio: patrimonio.toFixed(2),
      ingresos: ingresos.toFixed(2),
      egresos: egresos.toFixed(2),
      disponible: available.toFixed(2),
      ahorro: savings.toFixed(2),
      porCobrar: pending.toFixed(2),
      porPagar: egresos.minus(egresos).toFixed(2),
      vencido: overdue.toFixed(2),
      costosMimotech: businessCosts.toFixed(2),
      pagosEquipo: teamPayments.toFixed(2),
      utilidadMimotech: ingresos.minus(businessCosts).minus(teamPayments).toFixed(2),
      saldoMimotalents: '0.00',
      debtTotal: debtTotal.toFixed(2),
      debtPaid: paidDebts.toFixed(2),
    };
  }
}
