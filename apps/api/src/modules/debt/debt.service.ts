import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { UpdateDebtDto } from './debt.dto';
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
  async update(id: string, workspaceId: string, data: UpdateDebtDto) {
    const debt = await this.prisma.debt.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!debt) throw new NotFoundException('Debt not found');
    const { dueDate, ...rest } = data;
    const updateData: Prisma.DebtUpdateInput = { ...rest };
    if (dueDate) updateData.dueDate = new Date(dueDate);
    return this.prisma.debt.update({ where: { id }, data: updateData });
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
  async removePayment(paymentId: string, workspaceId: string) {
    const payment = await this.prisma.debtPayment.findUnique({
      where: { id: paymentId },
      include: { debt: { select: { workspaceId: true } } },
    });
    if (payment?.debt.workspaceId !== workspaceId) throw new NotFoundException('Pago no encontrado');
    await this.prisma.debtPayment.delete({ where: { id: paymentId } });
    const allPayments = await this.prisma.debtPayment.findMany({
      where: { debtId: payment.debtId },
    });
    const totalPaid = allPayments.reduce((s, p) => s.plus(new Decimal(p.amount)), new Decimal(0));
    const debt = await this.prisma.debt.findUnique({ where: { id: payment.debtId } });
    if (!debt) throw new NotFoundException('Debt not found');
    const balance = new Decimal(debt.originalAmount).minus(totalPaid);
    let newStatus = debt.status;
    if (balance.lte(0)) newStatus = 'PAID';
    else if (totalPaid.gt(0)) newStatus = 'PARTIAL';
    else newStatus = 'PENDING';
    await this.prisma.debt.update({
      where: { id: payment.debtId },
      data: { status: newStatus },
    });
    return { ok: true };
  }
  async remove(id: string, workspaceId: string) {
    const debt = await this.prisma.debt.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!debt) throw new NotFoundException('Debt not found');
    return this.prisma.debt.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
