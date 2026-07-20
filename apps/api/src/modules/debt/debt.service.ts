import { Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import type { PrismaService } from '@/common/prisma/prisma.service';
@Injectable()
export class DebtService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(workspaceId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { workspaceId, deletedAt: null },
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    });
    return debts.map((d) => {
      const totalPaid = d.payments.reduce((s, p) => s.plus(new Decimal(p.amount)), new Decimal(0));
      return {
        ...d,
        originalAmount: d.originalAmount.toString(),
        totalPaid: totalPaid.toFixed(2),
        balance: new Decimal(d.originalAmount).minus(totalPaid).toFixed(2),
      };
    });
  }
  async findOne(id: string, workspaceId: string) {
    const debt = await this.prisma.debt.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: { payments: { orderBy: { date: 'desc' } } },
    });
    if (!debt) throw new NotFoundException('Debt not found');
    const totalPaid = debt.payments.reduce((s, p) => s.plus(new Decimal(p.amount)), new Decimal(0));
    return {
      ...debt,
      originalAmount: debt.originalAmount.toString(),
      totalPaid: totalPaid.toFixed(2),
      balance: new Decimal(debt.originalAmount).minus(totalPaid).toFixed(2),
    };
  }
  async create(data: {
    workspaceId: string;
    direction: string;
    concept: string;
    originalAmount: string;
    currency?: string;
    interestRate?: string;
    dueDate?: string;
    personId?: string;
  }) {
    return this.prisma.debt.create({
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        originalAmount: data.originalAmount,
        interestRate: data.interestRate,
      },
    });
  }
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const debt = await this.prisma.debt.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!debt) throw new NotFoundException('Debt not found');
    return this.prisma.debt.update({ where: { id }, data: data as any });
  }
  async addPayment(id: string, workspaceId: string, data: { amount: string; date: string; method?: string }) {
    const debt = await this.prisma.debt.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!debt) throw new NotFoundException('Debt not found');
    const payment = await this.prisma.debtPayment.create({
      data: {
        debtId: id,
        amount: data.amount,
        date: new Date(data.date),
        method: data.method,
      },
    });
    const allPayments = await this.prisma.debtPayment.findMany({
      where: { debtId: id },
    });
    const totalPaid = allPayments.reduce((s, p) => s.plus(new Decimal(p.amount)), new Decimal(0));
    const balance = new Decimal(debt.originalAmount).minus(totalPaid);
    let newStatus = debt.status;
    if (balance.lte(0)) newStatus = 'PAID';
    else if (totalPaid.gt(0)) newStatus = 'PARTIAL';
    await this.prisma.debt.update({
      where: { id },
      data: { status: newStatus },
    });
    return payment;
  }
}
