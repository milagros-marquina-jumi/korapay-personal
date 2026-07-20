import { Injectable, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '@/common/prisma/prisma.service';
@Injectable()
export class PendingItemService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(workspaceId: string, status?: string) {
    return this.prisma.pendingItem.findMany({
      where: { workspaceId, deletedAt: null, ...(status && { status }) },
      orderBy: { dueDate: 'asc' },
    });
  }
  async create(data: {
    workspaceId: string;
    kind: string;
    concept: string;
    amount: string;
    currency?: string;
    dueDate: string;
    personId?: string;
  }) {
    return this.prisma.pendingItem.create({
      data: { ...data, dueDate: new Date(data.dueDate) },
    });
  }
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    const item = await this.prisma.pendingItem.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Pending item not found');
    return this.prisma.pendingItem.update({ where: { id }, data: data as any });
  }
  async pay(id: string, workspaceId: string) {
    const item = await this.prisma.pendingItem.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Pending item not found');
    return this.prisma.pendingItem.update({
      where: { id },
      data: { status: 'PAID' },
    });
  }
}
