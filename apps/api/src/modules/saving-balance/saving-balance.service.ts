import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { MONTH_NAMES } from '@/common/constants/months';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ExchangeRateService } from '@/modules/exchange-rate/exchange-rate.service';

interface AccountInput {
  bucket: string;
  bank?: string;
  currency?: string;
  amount: string;
}

@Injectable()
export class SavingBalanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeRate: ExchangeRateService,
  ) {}

  private async toBase(amount: string, currency: string, year: number, month: number) {
    if (currency !== 'USD') return new Decimal(amount).toFixed(2);
    const reference = new Date(Date.UTC(year, month - 1, 1));
    const rate = await this.exchangeRate.getRateForDate(reference);
    return new Decimal(amount).mul(new Decimal(rate)).toFixed(2);
  }

  async buckets(workspaceId: string) {
    const rows = await this.prisma.savingBalance.findMany({
      where: { workspaceId, deletedAt: null },
      select: { bucket: true, bank: true, currency: true, year: true, month: true },
      orderBy: [{ bucket: 'asc' }, { year: 'desc' }, { month: 'desc' }],
    });

    const grouped = new Map<string, { bucket: string; bank: string | null; currency: string; periods: number }>();
    for (const row of rows) {
      const key = `${row.bucket}|${row.currency}`;
      const entry = grouped.get(key);
      if (entry) {
        entry.periods += 1;
        if (!entry.bank && row.bank) entry.bank = row.bank;
      } else {
        grouped.set(key, { bucket: row.bucket, bank: row.bank, currency: row.currency, periods: 1 });
      }
    }

    return [...grouped.values()];
  }

  async lastPeriod(workspaceId: string) {
    const latest = await this.prisma.savingBalance.findFirst({
      where: { workspaceId, deletedAt: null },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      select: { year: true, month: true },
    });
    if (!latest) return null;
    const accounts = await this.prisma.savingBalance.findMany({
      where: { workspaceId, deletedAt: null, year: latest.year, month: latest.month },
      orderBy: { bucket: 'asc' },
    });
    return {
      year: latest.year,
      month: latest.month,
      label: `${MONTH_NAMES[latest.month - 1]} ${latest.year}`,
      accounts: accounts.map((a) => ({
        bucket: a.bucket,
        bank: a.bank,
        currency: a.currency,
        amount: a.amount.toString(),
      })),
    };
  }

  async createPeriod(data: { workspaceId: string; year: number; month: number; accounts: AccountInput[] }) {
    const existing = await this.prisma.savingBalance.findFirst({
      where: { workspaceId: data.workspaceId, deletedAt: null, year: data.year, month: data.month },
    });
    if (existing) throw new ConflictException('El periodo ya existe');

    const rows = await Promise.all(
      data.accounts.map(async (account) => {
        const currency = account.currency ?? 'PEN';
        return {
          workspaceId: data.workspaceId,
          year: data.year,
          month: data.month,
          bucket: account.bucket,
          bank: account.bank ?? null,
          currency,
          amount: account.amount,
          amountBase: await this.toBase(account.amount, currency, data.year, data.month),
        };
      }),
    );

    await this.prisma.savingBalance.createMany({ data: rows });
    return { year: data.year, month: data.month, created: rows.length };
  }

  async upsertAccount(data: {
    workspaceId: string;
    year: number;
    month: number;
    bucket: string;
    bank?: string;
    currency?: string;
    amount: string;
  }) {
    const currency = data.currency ?? 'PEN';
    const amountBase = await this.toBase(data.amount, currency, data.year, data.month);
    const existing = await this.prisma.savingBalance.findFirst({
      where: {
        workspaceId: data.workspaceId,
        deletedAt: null,
        year: data.year,
        month: data.month,
        bucket: data.bucket,
        currency,
      },
    });

    if (existing) {
      return this.prisma.savingBalance.update({
        where: { id: existing.id },
        data: { amount: data.amount, amountBase, bank: data.bank ?? null },
      });
    }

    return this.prisma.savingBalance.create({
      data: {
        workspaceId: data.workspaceId,
        year: data.year,
        month: data.month,
        bucket: data.bucket,
        bank: data.bank ?? null,
        currency,
        amount: data.amount,
        amountBase,
      },
    });
  }

  async remove(id: string, workspaceId: string) {
    const row = await this.prisma.savingBalance.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!row) throw new NotFoundException('Saldo no encontrado');
    return this.prisma.savingBalance.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async removePeriod(workspaceId: string, year: number, month: number) {
    const result = await this.prisma.savingBalance.updateMany({
      where: { workspaceId, deletedAt: null, year, month },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Periodo no encontrado');
    return { year, month, removed: result.count };
  }

  async createBucket(data: { workspaceId: string; bucket: string; bank?: string; currency?: string; amount?: string }) {
    const currency = data.currency ?? 'PEN';
    const duplicated = await this.prisma.savingBalance.findFirst({
      where: { workspaceId: data.workspaceId, deletedAt: null, bucket: data.bucket, currency },
    });
    if (duplicated) throw new ConflictException('Esa cuenta ya existe');

    const latest = await this.prisma.savingBalance.findFirst({
      where: { workspaceId: data.workspaceId, deletedAt: null },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      select: { year: true, month: true },
    });

    const now = new Date();
    const year = latest?.year ?? now.getUTCFullYear();
    const month = latest?.month ?? now.getUTCMonth() + 1;
    const amount = data.amount ?? '0';

    return this.prisma.savingBalance.create({
      data: {
        workspaceId: data.workspaceId,
        year,
        month,
        bucket: data.bucket,
        bank: data.bank ?? null,
        currency,
        amount,
        amountBase: await this.toBase(amount, currency, year, month),
      },
    });
  }

  async renameBucket(workspaceId: string, bucket: string, currency: string, data: { name: string; bank?: string }) {
    const rows = await this.prisma.savingBalance.updateMany({
      where: { workspaceId, deletedAt: null, bucket, currency },
      data: { bucket: data.name, bank: data.bank ?? null },
    });
    if (rows.count === 0) throw new NotFoundException('Cuenta no encontrada');
    return { bucket: data.name, updated: rows.count };
  }

  async removeBucket(workspaceId: string, bucket: string, currency: string) {
    const rows = await this.prisma.savingBalance.updateMany({
      where: { workspaceId, deletedAt: null, bucket, currency },
      data: { deletedAt: new Date() },
    });
    if (rows.count === 0) throw new NotFoundException('Cuenta no encontrada');
    return { bucket, removed: rows.count };
  }

  async yearlyPivot(workspaceId: string) {
    const balances = await this.prisma.savingBalance.findMany({
      where: { workspaceId, deletedAt: null },
      select: { year: true, month: true, amountBase: true },
    });

    const byYear = new Map<number, Decimal[]>();
    for (const b of balances) {
      if (!byYear.has(b.year))
        byYear.set(
          b.year,
          Array.from({ length: 12 }, () => new Decimal(0)),
        );
      const months = byYear.get(b.year);
      if (!months) continue;
      const index = b.month - 1;
      months[index] = (months[index] ?? new Decimal(0)).add(new Decimal(b.amountBase));
    }

    const rows = [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, months]) => ({
        year,
        months: months.map((m) => m.toFixed(2)),
        total: months.reduce((s, m) => s.add(m), new Decimal(0)).toFixed(2),
      }));

    const monthTotals = Array.from({ length: 12 }, (_, i) =>
      rows.reduce((s, r) => s.add(new Decimal(r.months[i] ?? '0')), new Decimal(0)).toFixed(2),
    );

    return {
      monthNames: MONTH_NAMES,
      rows,
      monthTotals,
      grandTotal: rows.reduce((s, r) => s.add(new Decimal(r.total)), new Decimal(0)).toFixed(2),
    };
  }
}
