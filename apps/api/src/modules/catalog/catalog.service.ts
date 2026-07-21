import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  applications(workspaceId: string) {
    return this.prisma.application.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  projects(workspaceId: string) {
    return this.prisma.project.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async employmentContracts(workspaceId: string) {
    const contracts = await this.prisma.employmentContract.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { startDate: 'desc' },
    });
    return contracts.map((c) => ({ ...c, salary: c.salary?.toString() ?? null }));
  }

  async taxObligations(workspaceId: string) {
    const items = await this.prisma.taxObligation.findMany({
      where: { workspaceId },
      orderBy: { dueDate: 'asc' },
    });
    return items.map((t) => ({ ...t, amount: t.amount?.toString() ?? null }));
  }

  paymentMethods() {
    return this.prisma.paymentMethod.findMany({ orderBy: { name: 'asc' } });
  }

  currencies() {
    return this.prisma.currency.findMany({ orderBy: { code: 'asc' } });
  }

  banks() {
    return this.prisma.bank.findMany({ orderBy: { name: 'asc' } });
  }

  async exchangeRate() {
    const rate = await this.prisma.exchangeRate.findFirst({
      orderBy: { date: 'desc' },
      include: { fromCurrency: true, toCurrency: true },
    });
    if (!rate) return null;
    return {
      from: rate.fromCurrency.code,
      to: rate.toCurrency.code,
      rate: rate.rate.toString(),
      date: rate.date,
    };
  }
}
