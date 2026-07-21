import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class TaxObligationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    const items = await this.prisma.taxObligation.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { dueDate: 'asc' },
    });
    return items.map((t) => ({ ...t, amount: t.amount?.toString() ?? null }));
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
    return { ...created, amount: created.amount?.toString() ?? null };
  }

  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const found = await this.prisma.taxObligation.findFirst({ where: { id, workspaceId, deletedAt: null } });
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
    const updated = await this.prisma.taxObligation.update({ where: { id }, data: updateData });
    return { ...updated, amount: updated.amount?.toString() ?? null };
  }

  async remove(id: string, workspaceId: string) {
    const found = await this.prisma.taxObligation.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!found) throw new NotFoundException('Obligación no encontrada');
    return this.prisma.taxObligation.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
