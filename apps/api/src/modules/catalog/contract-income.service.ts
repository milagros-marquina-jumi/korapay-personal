import { SALARY_CONCEPT } from '@korapay/domain';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { buildContractSchedule } from './contract-schedule';

@Injectable()
export class ContractIncomeService {
  private readonly logger = new Logger(ContractIncomeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncContractIncomes(contractId: string, workspaceId: string) {
    const contract = await this.prisma.employmentContract.findFirst({
      where: { id: contractId, workspaceId, deletedAt: null },
    });
    if (!contract?.companyId) return { created: 0, removed: 0 };

    const netSalary = contract.salary?.toString() ?? (await this.latestNetSalary(workspaceId, contract.companyId));
    const grossSalary = await this.latestGrossSalary(workspaceId, contract.companyId);

    const schedule = buildContractSchedule({
      startDate: contract.startDate,
      endDate: contract.endDate,
      grossSalary,
      netSalary,
    });

    const today = new Date();
    const removed = await this.prisma.transaction.deleteMany({
      where: {
        workspaceId,
        contractId,
        status: 'PENDING',
        date: { gt: today },
      },
    });

    const existing = await this.prisma.transaction.findMany({
      where: { workspaceId, contractId },
      select: { date: true },
    });
    const taken = new Set(existing.map((t) => t.date.toISOString().slice(0, 10)));

    const pending = schedule.filter((s) => s.date > today && !taken.has(s.date.toISOString().slice(0, 10)));

    for (const item of pending) {
      await this.prisma.transaction.create({
        data: {
          workspaceId,
          contractId,
          companyId: contract.companyId,
          type: 'INCOME',
          concept: item.concept,
          date: item.date,
          amountOriginal: item.amountBase,
          amountBase: item.amountBase,
          amountGross: item.amountGross,
          currency: contract.currency,
          status: 'PENDING',
          dueDate: item.date,
          tags: contract.type ? [contract.type] : [],
        },
      });
    }

    this.logger.log(`Contrato ${contractId}: ${pending.length} sueldos proyectados, ${removed.count} reemplazados`);
    return { created: pending.length, removed: removed.count };
  }

  // Al terminar un contrato antes de tiempo se descartan las cuotas que ya no ocurriran.
  async removeFutureIncomes(contractId: string, workspaceId: string) {
    const result = await this.prisma.transaction.deleteMany({
      where: { workspaceId, contractId, status: 'PENDING', date: { gt: new Date() } },
    });
    return { removed: result.count };
  }

  private async latestNetSalary(workspaceId: string, companyId: string) {
    const last = await this.prisma.transaction.findFirst({
      where: { workspaceId, companyId, deletedAt: null, type: 'INCOME', concept: SALARY_CONCEPT },
      orderBy: { date: 'desc' },
      select: { amountBase: true },
    });
    return last?.amountBase.toString() ?? null;
  }

  private async latestGrossSalary(workspaceId: string, companyId: string) {
    const last = await this.prisma.transaction.findFirst({
      where: {
        workspaceId,
        companyId,
        deletedAt: null,
        type: 'INCOME',
        concept: SALARY_CONCEPT,
        amountGross: { not: null },
      },
      orderBy: { date: 'desc' },
      select: { amountGross: true },
    });
    return last?.amountGross?.toString() ?? null;
  }
}
