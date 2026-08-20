import { Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { UpdatePendingItemDto } from './pending-item.dto';
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
    issuedDate?: string;
    dueDate: string;
    personId?: string;
  }) {
    const { issuedDate, ...resto } = data;
    return this.prisma.pendingItem.create({
      data: {
        ...resto,
        dueDate: new Date(data.dueDate),
        issuedDate: issuedDate ? new Date(issuedDate) : null,
      },
    });
  }
  async update(id: string, workspaceId: string, data: UpdatePendingItemDto) {
    const item = await this.prisma.pendingItem.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Pending item not found');
    const { issuedDate, dueDate, workspaceId: _ws, ...resto } = data;
    return this.prisma.pendingItem.update({
      where: { id },
      data: {
        ...resto,
        ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
        ...(issuedDate !== undefined && { issuedDate: issuedDate ? new Date(issuedDate) : null }),
      },
    });
  }
  async pay(id: string, workspaceId: string, data?: { amount?: string }) {
    const item = await this.prisma.pendingItem.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Pending item not found');
    const paid = data?.amount ? new Decimal(data.amount) : new Decimal(item.amount);
    const status = paid.gte(new Decimal(item.amount)) ? 'PAID' : 'PARTIAL';
    return this.prisma.pendingItem.update({
      where: { id },
      data: { status },
    });
  }
  async unpay(id: string, workspaceId: string) {
    const item = await this.prisma.pendingItem.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Pending item not found');
    return this.prisma.pendingItem.update({ where: { id }, data: { status: 'PENDING' } });
  }
  async remove(id: string, workspaceId: string) {
    const item = await this.prisma.pendingItem.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('Pending item not found');
    return this.prisma.pendingItem.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
