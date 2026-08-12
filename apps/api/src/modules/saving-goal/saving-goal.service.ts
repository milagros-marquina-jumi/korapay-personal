import { Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { UpdateSavingGoalDto } from './saving-goal.dto';
@Injectable()
export class SavingGoalService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(workspaceId: string) {
    const goals = await this.prisma.savingGoal.findMany({
      where: { workspaceId, deletedAt: null },
      include: { entries: true },
      orderBy: { createdAt: 'desc' },
    });
    return goals.map((g) => {
      const totalSaved = g.entries
        .filter((e) => e.type === 'CONTRIBUTION')
        .reduce((s, e) => s.plus(new Decimal(e.amount)), new Decimal(0));
      const totalWithdrawn = g.entries
        .filter((e) => e.type === 'WITHDRAWAL')
        .reduce((s, e) => s.plus(new Decimal(e.amount)), new Decimal(0));
      const current = totalSaved.minus(totalWithdrawn);
      const target = new Decimal(g.targetAmount);
      const progress = target.isZero() ? new Decimal(0) : current.div(target).mul(100);
      return {
        ...g,
        targetAmount: target.toString(),
        currentAmount: current.toFixed(2),
        progress: progress.toFixed(1),
      };
    });
  }
  async create(data: {
    workspaceId: string;
    name: string;
    targetAmount: string;
    currency?: string;
    targetDate?: string;
    monthlyRecommend?: string;
  }) {
    return this.prisma.savingGoal.create({
      data: {
        ...data,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      },
    });
  }
  async update(id: string, workspaceId: string, data: UpdateSavingGoalDto) {
    const goal = await this.prisma.savingGoal.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!goal) throw new NotFoundException('Saving goal not found');
    return this.prisma.savingGoal.update({ where: { id }, data });
  }
  async addEntry(
    id: string,
    workspaceId: string,
    data: { amount: string; type?: string; date: string; notes?: string },
  ) {
    const goal = await this.prisma.savingGoal.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!goal) throw new NotFoundException('Saving goal not found');
    return this.prisma.savingEntry.create({
      data: {
        goalId: id,
        amount: data.amount,
        type: data.type ?? 'CONTRIBUTION',
        date: new Date(data.date),
        notes: data.notes,
      },
    });
  }
  async remove(id: string, workspaceId: string) {
    const goal = await this.prisma.savingGoal.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!goal) throw new NotFoundException('Saving goal not found');
    return this.prisma.savingGoal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
