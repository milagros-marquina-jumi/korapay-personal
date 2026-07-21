import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '@/common/prisma/prisma.service';
@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(params: {
    workspaceId: string;
    page?: number;
    pageSize?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    type?: string;
    status?: string;
    categoryId?: string;
    accountId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const orderBy: Prisma.TransactionOrderByWithRelationInput = {
      [params.sortBy ?? 'date']: params.sortOrder ?? 'desc',
    };
    const where: Prisma.TransactionWhereInput = {
      workspaceId: params.workspaceId,
      deletedAt: null,
      ...(params.type && { type: params.type }),
      ...(params.status && { status: params.status }),
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.accountId && { accountId: params.accountId }),
      ...(params.search && {
        concept: { contains: params.search, mode: 'insensitive' },
      }),
      ...(params.startDate || params.endDate
        ? {
            date: {
              ...(params.startDate && { gte: new Date(params.startDate) }),
              ...(params.endDate && { lte: new Date(params.endDate) }),
            },
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          account: true,
          category: true,
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return {
      data: data.map((t) => ({
        ...t,
        amountOriginal: t.amountOriginal.toString(),
        amountBase: t.amountBase.toString(),
        exchangeRate: t.exchangeRate?.toString() ?? null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
  async findOne(id: string, workspaceId: string) {
    const tx = await this.prisma.transaction.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: { account: true, category: true, splits: true },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return {
      ...tx,
      amountOriginal: tx.amountOriginal.toString(),
      amountBase: tx.amountBase.toString(),
      exchangeRate: tx.exchangeRate?.toString() ?? null,
    };
  }
  async create(data: {
    workspaceId: string;
    type: string;
    concept: string;
    description?: string;
    date: string;
    amount: string;
    currency?: string;
    exchangeRate?: string;
    categoryId?: string;
    accountId?: string;
    status?: string;
    personId?: string;
    companyId?: string;
    clientId?: string;
    projectId?: string;
    applicationId?: string;
    notes?: string;
  }) {
    const currency = data.currency ?? 'PEN';
    const exchangeRate = data.exchangeRate ?? '1';
    const amountBase =
      currency === 'PEN' ? data.amount : new Decimal(data.amount).mul(new Decimal(exchangeRate)).toFixed(2);
    return this.prisma.transaction.create({
      data: {
        workspaceId: data.workspaceId,
        type: data.type,
        concept: data.concept,
        description: data.description,
        date: new Date(data.date),
        amountOriginal: data.amount,
        currency,
        exchangeRate: currency !== 'PEN' ? exchangeRate : null,
        amountBase,
        categoryId: data.categoryId,
        accountId: data.accountId,
        status: data.status ?? 'PAID',
        personId: data.personId,
        companyId: data.companyId,
        clientId: data.clientId,
        projectId: data.projectId,
        applicationId: data.applicationId,
        notes: data.notes,
      },
    });
  }
  async update(id: string, workspaceId: string, data: Record<string, unknown>) {
    await this.findOne(id, workspaceId);
    const updateData: Prisma.TransactionUncheckedUpdateInput = {};
    if (data.concept) updateData.concept = data.concept as string;
    if (data.description !== undefined) updateData.description = data.description as string;
    if (data.date) updateData.date = new Date(data.date as string);
    if (data.amount) {
      updateData.amountOriginal = data.amount as string;
      const currency = (data.currency as string) ?? 'PEN';
      const rate = (data.exchangeRate as string) ?? '1';
      updateData.amountBase =
        currency === 'PEN'
          ? (data.amount as string)
          : new Decimal(data.amount as string).mul(new Decimal(rate)).toFixed(2);
    }
    if (data.status) updateData.status = data.status as string;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId as string;
    if (data.accountId !== undefined) updateData.accountId = data.accountId as string;
    if (data.notes !== undefined) updateData.notes = data.notes as string;
    return this.prisma.transaction.update({ where: { id }, data: updateData });
  }
  async remove(id: string, workspaceId: string) {
    await this.findOne(id, workspaceId);
    return this.prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  async duplicate(id: string, workspaceId: string) {
    const original = await this.findOne(id, workspaceId);
    const {
      id: _,
      createdAt: _c,
      updatedAt: _u,
      deletedAt: _d,
      account: _a,
      category: _cat,
      splits: _s,
      ...rest
    } = original as any;
    return this.prisma.transaction.create({
      data: {
        ...rest,
        concept: `${rest.concept} (copia)`,
        status: 'PENDING',
        date: new Date(),
      },
    });
  }
  async changeStatus(id: string, workspaceId: string, status: string) {
    await this.findOne(id, workspaceId);
    return this.prisma.transaction.update({
      where: { id },
      data: { status },
    });
  }
  async transfer(data: {
    workspaceId: string;
    fromAccountId: string;
    toAccountId: string;
    amount: string;
    currency?: string;
    date?: string;
    description?: string;
    fee?: string;
  }) {
    if (data.fromAccountId === data.toAccountId) {
      throw new BadRequestException('Source and destination accounts must be different');
    }
    const currency = data.currency ?? 'PEN';
    const date = data.date ? new Date(data.date) : new Date();
    return this.prisma.$transaction(async (tx) => {
      const outTx = await tx.transaction.create({
        data: {
          workspaceId: data.workspaceId,
          type: 'TRANSFER',
          concept: data.description ?? 'Transferencia',
          date,
          amountOriginal: data.amount,
          currency,
          amountBase: data.amount,
          accountId: data.fromAccountId,
          destAccountId: data.toAccountId,
          status: 'PAID',
          notes: data.description,
        },
      });
      const inTx = await tx.transaction.create({
        data: {
          workspaceId: data.workspaceId,
          type: 'TRANSFER',
          concept: data.description ?? 'Transferencia recibida',
          date,
          amountOriginal: data.amount,
          currency,
          amountBase: data.amount,
          accountId: data.toAccountId,
          destAccountId: data.fromAccountId,
          status: 'PAID',
          notes: data.description,
        },
      });
      await tx.transaction.update({
        where: { id: outTx.id },
        data: { linkedTransactionId: inTx.id },
      });
      await tx.transaction.update({
        where: { id: inTx.id },
        data: { linkedTransactionId: outTx.id },
      });
      return { outgoing: outTx, incoming: inTx };
    });
  }
}
