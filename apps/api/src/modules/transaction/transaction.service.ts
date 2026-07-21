import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ExchangeRateService } from '@/modules/exchange-rate/exchange-rate.service';

const MAX_OCCURRENCES = 120;

function addPeriod(base: Date, frequency: string, steps: number): Date {
  const d = new Date(base);
  switch (frequency) {
    case 'DAILY':
      d.setUTCDate(d.getUTCDate() + steps);
      break;
    case 'WEEKLY':
      d.setUTCDate(d.getUTCDate() + steps * 7);
      break;
    case 'QUARTERLY':
      d.setUTCMonth(d.getUTCMonth() + steps * 3);
      break;
    case 'YEARLY':
      d.setUTCFullYear(d.getUTCFullYear() + steps);
      break;
    default:
      d.setUTCMonth(d.getUTCMonth() + steps);
      break;
  }
  return d;
}

function buildOccurrenceDates(params: {
  start: Date;
  frequency: string;
  interval: number;
  endDate?: Date | null;
  count?: number | null;
}): Date[] {
  const { start, frequency, interval, endDate, count } = params;
  const limit = count && count > 0 ? Math.min(count, MAX_OCCURRENCES) : MAX_OCCURRENCES;
  const dates: Date[] = [];
  for (let i = 0; i < limit; i++) {
    const occurrence = addPeriod(start, frequency, i * Math.max(interval, 1));
    if (endDate && occurrence > endDate) break;
    dates.push(occurrence);
  }
  return dates.length ? dates : [start];
}

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}
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
          recurrenceRule: true,
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
  async monthlySummary(params: { workspaceId: string; type?: string; year?: number }) {
    const where: Prisma.TransactionWhereInput = {
      workspaceId: params.workspaceId,
      deletedAt: null,
      type: params.type ?? 'INCOME',
      ...(params.year
        ? {
            date: {
              gte: new Date(Date.UTC(params.year, 0, 1)),
              lt: new Date(Date.UTC(params.year + 1, 0, 1)),
            },
          }
        : {}),
    };
    const rows = await this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { company: true, category: true },
    });

    const periods = new Map<
      string,
      {
        year: number;
        month: number;
        totalNet: string;
        companies: Map<string, { name: string; net: Decimal; concept: string; status: string }>;
      }
    >();
    const years = new Set<number>();

    for (const t of rows) {
      const year = t.date.getUTCFullYear();
      const month = t.date.getUTCMonth() + 1;
      years.add(year);
      const key = `${year}-${month}`;
      if (!periods.has(key)) {
        periods.set(key, { year, month, totalNet: '0', companies: new Map() });
      }
      const period = periods.get(key);
      if (!period) continue;
      const companyName = t.company?.name ?? 'Sin empresa';
      const net = new Decimal(t.amountBase);
      const existing = period.companies.get(companyName);
      if (existing) {
        existing.net = existing.net.add(net);
      } else {
        period.companies.set(companyName, {
          name: companyName,
          net,
          concept: t.category?.name ?? t.concept,
          status: t.status,
        });
      }
    }

    const data = [...periods.values()]
      .sort((a, b) => b.year - a.year || b.month - a.month)
      .map((p) => {
        const companies = [...p.companies.values()].map((c) => ({
          name: c.name,
          net: c.net.toFixed(2),
          concept: c.concept,
          status: c.status,
        }));
        const totalNet = companies.reduce((sum, c) => sum.add(new Decimal(c.net)), new Decimal(0)).toFixed(2);
        return { year: p.year, month: p.month, totalNet, companies };
      });

    return { data, years: [...years].sort((a, b) => b - a) };
  }

  async findOne(id: string, workspaceId: string) {
    const tx = await this.prisma.transaction.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: { account: true, category: true, splits: true, recurrenceRule: true },
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
    dueDate?: string;
    isRecurring?: boolean;
    recurrenceFrequency?: string;
    recurrenceInterval?: number;
    recurrenceEndDate?: string;
    recurrenceCount?: number;
  }) {
    const currency = data.currency ?? 'PEN';
    let exchangeRate = data.exchangeRate ?? '1';
    if (currency !== 'PEN' && !data.exchangeRate) {
      exchangeRate = await this.exchangeRateService.getRateForDate(data.date);
    }
    const amountBase =
      currency === 'PEN' ? data.amount : new Decimal(data.amount).mul(new Decimal(exchangeRate)).toFixed(2);

    const baseData = {
      workspaceId: data.workspaceId,
      type: data.type,
      concept: data.concept,
      description: data.description,
      amountOriginal: data.amount,
      currency,
      exchangeRate: currency !== 'PEN' ? exchangeRate : null,
      amountBase,
      categoryId: data.categoryId,
      accountId: data.accountId,
      personId: data.personId,
      companyId: data.companyId,
      clientId: data.clientId,
      projectId: data.projectId,
      applicationId: data.applicationId,
      notes: data.notes,
    };

    const isRecurring = !!(data.isRecurring && data.recurrenceFrequency);
    if (!isRecurring) {
      return this.prisma.transaction.create({
        data: {
          ...baseData,
          date: new Date(data.date),
          status: data.status ?? 'PAID',
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          isRecurring: false,
        },
      });
    }

    const frequency = data.recurrenceFrequency as string;
    const interval = data.recurrenceInterval ?? 1;
    const start = new Date(data.date);
    const occurrences = buildOccurrenceDates({
      start,
      frequency,
      interval,
      endDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
      count: data.recurrenceCount ?? null,
    });

    return this.prisma.$transaction(async (tx) => {
      const rule = await tx.recurrenceRule.create({
        data: {
          frequency,
          interval,
          endDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
          endAfterCount: data.recurrenceCount ?? null,
        },
      });
      let first: Awaited<ReturnType<typeof tx.transaction.create>> | null = null;
      let index = 0;
      for (const occurrence of occurrences) {
        const created = await tx.transaction.create({
          data: {
            ...baseData,
            date: occurrence,
            dueDate: occurrence,
            status: index === 0 ? (data.status ?? 'PENDING') : 'PENDING',
            isRecurring: true,
            recurrenceRuleId: rule.id,
          },
        });
        if (index === 0) first = created;
        index++;
      }
      return first;
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
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate as string) : null;
    if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring as boolean;
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
      recurrenceRule: _r,
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
