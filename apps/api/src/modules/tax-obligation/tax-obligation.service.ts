import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class TaxObligationService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(t: {
    amount: Decimal | null;
    installmentRows?: { amount: Decimal; [k: string]: unknown }[];
    [k: string]: unknown;
  }) {
    return {
      ...t,
      amount: t.amount?.toString() ?? null,
      installmentRows: t.installmentRows?.map((r) => ({ ...r, amount: r.amount.toString() })),
    };
  }

  async findAll(workspaceId: string) {
    const items = await this.prisma.taxObligation.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { dueDate: 'asc' },
      include: { installmentRows: { orderBy: { number: 'asc' } } },
    });
    return items.map((t) => this.serialize(t));
  }

  async findOne(id: string, workspaceId: string) {
    const found = await this.prisma.taxObligation.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: { installmentRows: { orderBy: { number: 'asc' } } },
    });
    if (!found) throw new NotFoundException('Obligación no encontrada');
    return this.serialize(found);
  }

  private buildInstallments(taxObligationId: string, count: number, totalAmount: string, dueDate: Date) {
    const total = new Decimal(totalAmount || '0');
    const per = count > 0 ? total.div(count) : total;
    const rows = [];
    for (let i = 1; i <= count; i++) {
      const due = new Date(dueDate);
      due.setUTCMonth(due.getUTCMonth() - (count - i));
      rows.push({
        taxObligationId,
        number: i,
        amount: per.toFixed(2),
        dueDate: due,
        status: 'PENDING',
      });
    }
    return rows;
  }

  async create(data: {
    workspaceId: string;
    name: string;
    year?: number;
    dueDate: string;
    amount?: string;
    status?: string;
    installments?: number;
    paidInstallments?: number;
    notes?: string;
  }) {
    const created = await this.prisma.taxObligation.create({
      data: {
        workspaceId: data.workspaceId,
        name: data.name,
        year: data.year ?? null,
        dueDate: new Date(data.dueDate),
        amount: data.amount ?? null,
        status: data.status ?? 'PENDING',
        installments: data.installments ?? null,
        paidInstallments: data.paidInstallments ?? 0,
        notes: data.notes ?? null,
      },
    });
    if (data.installments && data.installments > 0) {
      await this.prisma.taxObligationInstallment.createMany({
        data: this.buildInstallments(created.id, data.installments, data.amount ?? '0', new Date(data.dueDate)),
      });
    }
    return this.findOne(created.id, data.workspaceId);
  }

  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const found = await this.prisma.taxObligation.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: { installmentRows: true },
    });
    if (!found) throw new NotFoundException('Obligación no encontrada');
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.year !== undefined) updateData.year = data.year;
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate as string);
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.installments !== undefined) updateData.installments = data.installments;
    if (data.paidInstallments !== undefined) updateData.paidInstallments = data.paidInstallments;
    if (data.notes !== undefined) updateData.notes = data.notes;
    await this.prisma.taxObligation.update({ where: { id }, data: updateData });

    const newCount = data.installments as number | undefined;
    if (
      newCount !== undefined &&
      newCount !== found.installmentRows.length &&
      found.installmentRows.every((r) => r.status !== 'PAID')
    ) {
      await this.prisma.taxObligationInstallment.deleteMany({ where: { taxObligationId: id } });
      if (newCount > 0) {
        const amount = (data.amount as string) ?? found.amount?.toString() ?? '0';
        const dueDate = data.dueDate ? new Date(data.dueDate as string) : found.dueDate;
        await this.prisma.taxObligationInstallment.createMany({
          data: this.buildInstallments(id, newCount, amount, dueDate),
        });
      }
    }
    return this.findOne(id, workspaceId);
  }

  async remove(id: string, workspaceId: string) {
    const found = await this.prisma.taxObligation.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!found) throw new NotFoundException('Obligación no encontrada');
    return this.prisma.taxObligation.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async personalWorkspaceId(profileWorkspaceId: string): Promise<string> {
    const source = await this.prisma.workspace.findUnique({
      where: { id: profileWorkspaceId },
      include: { members: true },
    });
    const ownerId = source?.members.find((m) => m.role === 'OWNER')?.profileId ?? source?.members[0]?.profileId;
    if (!ownerId) return profileWorkspaceId;
    const personal = await this.prisma.workspace.findFirst({
      where: { type: 'PERSONAL', members: { some: { profileId: ownerId } } },
    });
    return personal?.id ?? profileWorkspaceId;
  }

  async payInstallment(id: string, workspaceId: string, installmentId: string) {
    const obligation = await this.prisma.taxObligation.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: { installmentRows: true },
    });
    if (!obligation) throw new NotFoundException('Obligación no encontrada');
    const installment = obligation.installmentRows.find((r) => r.id === installmentId);
    if (!installment) throw new NotFoundException('Cuota no encontrada');
    if (installment.status === 'PAID') throw new BadRequestException('La cuota ya está pagada');

    const personalId = await this.personalWorkspaceId(workspaceId);
    const paidDate = new Date();

    await this.prisma.$transaction(async (tx) => {
      const expense = await tx.transaction.create({
        data: {
          workspaceId: personalId,
          type: 'EXPENSE',
          concept: `${obligation.name} - Cuota ${installment.number}/${obligation.installments ?? ''}`.trim(),
          date: paidDate,
          amountOriginal: installment.amount,
          currency: 'PEN',
          amountBase: installment.amount,
          status: 'PAID',
          tags: ['Renta', 'Cuota'],
        },
      });
      await tx.taxObligationInstallment.update({
        where: { id: installmentId },
        data: { status: 'PAID', paidDate, transactionId: expense.id },
      });
      const paidCount = obligation.installmentRows.filter((r) => r.status === 'PAID').length + 1;
      await tx.taxObligation.update({
        where: { id },
        data: {
          paidInstallments: paidCount,
          status: paidCount >= (obligation.installments ?? paidCount) ? 'PAID' : 'PARTIAL',
        },
      });
    });
    return this.findOne(id, workspaceId);
  }

  async unpayInstallment(id: string, workspaceId: string, installmentId: string) {
    const obligation = await this.prisma.taxObligation.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: { installmentRows: true },
    });
    if (!obligation) throw new NotFoundException('Obligación no encontrada');
    const installment = obligation.installmentRows.find((r) => r.id === installmentId);
    if (!installment) throw new NotFoundException('Cuota no encontrada');
    if (installment.status !== 'PAID') throw new BadRequestException('La cuota no está pagada');

    await this.prisma.$transaction(async (tx) => {
      if (installment.transactionId) {
        await tx.transaction.update({
          where: { id: installment.transactionId },
          data: { deletedAt: new Date() },
        });
      }
      await tx.taxObligationInstallment.update({
        where: { id: installmentId },
        data: { status: 'PENDING', paidDate: null, transactionId: null },
      });
      const paidCount = Math.max(0, obligation.installmentRows.filter((r) => r.status === 'PAID').length - 1);
      await tx.taxObligation.update({
        where: { id },
        data: { paidInstallments: paidCount, status: paidCount > 0 ? 'PARTIAL' : 'PENDING' },
      });
    });
    return this.findOne(id, workspaceId);
  }
}
