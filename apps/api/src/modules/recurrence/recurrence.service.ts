import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { CreateRecurrenceDto, UpdateRecurrenceDto } from './recurrence.dto';

const FIXED_TAG = 'Fijo';

export function siguienteFecha(desde: Date, frequency: string, interval = 1): Date {
  const d = new Date(desde);
  const pasos = Math.max(interval, 1);
  switch (frequency) {
    case 'WEEKLY':
      d.setUTCDate(d.getUTCDate() + 7 * pasos);
      break;
    case 'QUARTERLY':
      d.setUTCMonth(d.getUTCMonth() + 3 * pasos);
      break;
    case 'YEARLY':
      d.setUTCFullYear(d.getUTCFullYear() + pasos);
      break;
    default:
      d.setUTCMonth(d.getUTCMonth() + pasos);
      break;
  }
  return d;
}

@Injectable()
export class RecurrenceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(workspaceId: string, status?: string) {
    return this.prisma.recurrenceRule.findMany({
      where: { workspaceId, ...(status && { status }) },
      include: { category: { select: { id: true, name: true } }, _count: { select: { transactions: true } } },
      orderBy: [{ status: 'asc' }, { nextRunAt: 'asc' }],
    });
  }

  async findOne(id: string, workspaceId: string) {
    const rule = await this.prisma.recurrenceRule.findFirst({
      where: { id, workspaceId },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!rule) throw new NotFoundException('Recurrencia no encontrada');
    return rule;
  }

  async create(data: CreateRecurrenceDto) {
    const inicio = new Date(data.startDate);
    return this.prisma.recurrenceRule.create({
      data: {
        workspaceId: data.workspaceId,
        frequency: data.frequency,
        interval: data.interval ?? 1,
        type: data.type,
        concept: data.concept,
        amount: data.amount,
        currency: data.currency ?? 'PEN',
        categoryId: data.categoryId || null,
        paymentMethod: data.paymentMethod || null,
        bank: data.bank || null,
        notes: data.notes || null,
        isFixedExpense: data.isFixedExpense ?? true,
        endDate: data.endDate ? new Date(data.endDate) : null,
        endAfterCount: data.endAfterCount ?? null,
        nextRunAt: inicio,
        status: 'ACTIVE',
      },
    });
  }

  async update(id: string, workspaceId: string, data: UpdateRecurrenceDto) {
    await this.findOne(id, workspaceId);
    const { workspaceId: _ws, startDate, endDate, ...resto } = data;
    return this.prisma.recurrenceRule.update({
      where: { id },
      data: {
        ...resto,
        ...(startDate !== undefined && { nextRunAt: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    });
  }

  async cancel(id: string, workspaceId: string) {
    const rule = await this.findOne(id, workspaceId);
    if (rule.status === 'CANCELLED') throw new BadRequestException('Esta recurrencia ya está cancelada');
    return this.prisma.recurrenceRule.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date(), nextRunAt: null },
    });
  }

  async reactivate(id: string, workspaceId: string) {
    const rule = await this.findOne(id, workspaceId);
    if (rule.status === 'ACTIVE') throw new BadRequestException('Esta recurrencia ya está activa');
    return this.prisma.recurrenceRule.update({
      where: { id },
      data: { status: 'ACTIVE', cancelledAt: null, nextRunAt: this.proximaDesdeHoy(rule.frequency, rule.interval) },
    });
  }

  async remove(id: string, workspaceId: string) {
    await this.findOne(id, workspaceId);
    await this.prisma.transaction.updateMany({ where: { recurrenceRuleId: id }, data: { recurrenceRuleId: null } });
    return this.prisma.recurrenceRule.delete({ where: { id } });
  }

  private proximaDesdeHoy(frequency: string, interval: number): Date {
    const hoy = new Date();
    return siguienteFecha(
      new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate())),
      frequency,
      interval,
    );
  }

  async generarPendientes(hasta = new Date()): Promise<{ generadas: number; finalizadas: number }> {
    const limite = new Date(Date.UTC(hasta.getUTCFullYear(), hasta.getUTCMonth(), hasta.getUTCDate()));
    const reglas = await this.prisma.recurrenceRule.findMany({
      where: { status: 'ACTIVE', nextRunAt: { not: null, lte: limite }, workspaceId: { not: null } },
    });

    let generadas = 0;
    let finalizadas = 0;

    for (const regla of reglas) {
      if (!regla.nextRunAt || !regla.workspaceId || !regla.concept || !regla.amount) continue;

      const fecha = regla.nextRunAt;
      if (regla.endDate && fecha > regla.endDate) {
        await this.finalizar(regla.id);
        finalizadas += 1;
        continue;
      }
      if (regla.endAfterCount && regla.generatedCount >= regla.endAfterCount) {
        await this.finalizar(regla.id);
        finalizadas += 1;
        continue;
      }

      const yaExiste = await this.prisma.transaction.findFirst({
        where: { recurrenceRuleId: regla.id, date: fecha, deletedAt: null },
        select: { id: true },
      });

      if (!yaExiste) {
        const tags: string[] = [];
        if (regla.isFixedExpense) tags.push(FIXED_TAG);
        if (regla.paymentMethod) tags.push(regla.paymentMethod);
        if (regla.bank) tags.push(regla.bank);

        await this.prisma.transaction.create({
          data: {
            workspaceId: regla.workspaceId,
            type: regla.type ?? 'EXPENSE',
            concept: regla.concept,
            date: fecha,
            amountOriginal: regla.amount,
            currency: regla.currency ?? 'PEN',
            amountBase: regla.amount,
            categoryId: regla.categoryId,
            notes: regla.notes,
            status: 'PENDING',
            isRecurring: true,
            recurrenceRuleId: regla.id,
            tags,
          },
        });
        generadas += 1;
      }

      const siguiente = siguienteFecha(fecha, regla.frequency, regla.interval);
      const alcanzoFin = regla.endDate && siguiente > regla.endDate;
      const alcanzoConteo = regla.endAfterCount && regla.generatedCount + 1 >= regla.endAfterCount;

      await this.prisma.recurrenceRule.update({
        where: { id: regla.id },
        data: {
          lastRunAt: fecha,
          generatedCount: { increment: yaExiste ? 0 : 1 },
          ...(alcanzoFin || alcanzoConteo ? { status: 'FINISHED', nextRunAt: null } : { nextRunAt: siguiente }),
        },
      });
      if (alcanzoFin || alcanzoConteo) finalizadas += 1;
    }

    return { generadas, finalizadas };
  }

  private async finalizar(id: string) {
    await this.prisma.recurrenceRule.update({ where: { id }, data: { status: 'FINISHED', nextRunAt: null } });
  }
}
