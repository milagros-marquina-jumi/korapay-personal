import { Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '@/common/prisma/prisma.service';
@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(workspaceId: string) {
    return this.prisma.account.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }
  async findOne(id: string, workspaceId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: {
        transactions: {
          where: { deletedAt: null },
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });
    if (!account) throw new NotFoundException('Account not found');
    const transactions = await this.prisma.transaction.findMany({
      where: { accountId: id, deletedAt: null, status: 'PAID' },
    });
    const balance = transactions.reduce((sum, t) => {
      if (t.type === 'INCOME' || (t.type === 'TRANSFER' && t.destAccountId === id)) {
        return sum.plus(new Decimal(t.amountOriginal));
      }
      return sum.minus(new Decimal(t.amountOriginal));
    }, new Decimal(account.initialBalance));
    return { ...account, calculatedBalance: balance.toFixed(2) };
  }
  async create(data: {
    workspaceId: string;
    name: string;
    bank: string;
    kind?: string;
    currency?: string;
    initialBalance?: string;
    color?: string;
    emoji?: string;
  }) {
    return this.prisma.account.create({
      data: {
        workspaceId: data.workspaceId,
        name: data.name,
        bank: data.bank,
        kind: data.kind ?? 'SAVINGS',
        currency: data.currency ?? 'PEN',
        initialBalance: data.initialBalance ?? '0',
        color: data.color,
        emoji: data.emoji,
      },
    });
  }
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    await this.findOne(id, workspaceId);
    return this.prisma.account.update({ where: { id }, data: data as any });
  }
  async remove(id: string, workspaceId: string) {
    await this.findOne(id, workspaceId);
    return this.prisma.account.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }
}
