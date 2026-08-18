import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ordenarDeudas } from '@/common/constants/debt-order';
import { PrismaService } from '@/common/prisma/prisma.service';

export interface LedgerFilters {
  talentId?: string;
  status?: string;
  type?: string;
  category?: string;
  year?: number;
  month?: number;
}

export interface LedgerActor {
  profileId: string;
  label: string;
}

interface LedgerCreateInput {
  date: string;
  type: string;
  debtOwner?: string;
  category?: string;
  paidAmount?: string;
  debtAmount?: string;
  pendingAmount?: string;
  status?: string;
  description?: string;
  currency?: string;
}

interface LedgerUpdateInput {
  debtOwner?: string;
  date?: string;
  type?: string;
  category?: string;
  paidAmount?: string;
  debtAmount?: string;
  pendingAmount?: string;
  status?: string;
  description?: string;
  currency?: string;
}

function dayStart(input: string): Date {
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

@Injectable()
export class TalentLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string, filters: LedgerFilters) {
    return this.prisma.talentLedgerEntry.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        ...(filters.talentId ? { talentId: filters.talentId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.year ? { year: filters.year } : {}),
        ...(filters.month ? { month: filters.month } : {}),
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async listByTalent(talentId: string, filters: Omit<LedgerFilters, 'talentId'>) {
    return this.prisma.talentLedgerEntry.findMany({
      where: {
        talentId,
        deletedAt: null,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.year ? { year: filters.year } : {}),
        ...(filters.month ? { month: filters.month } : {}),
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  private totals(entries: { paidAmount: unknown; debtAmount: unknown; pendingAmount: unknown }[]) {
    const totalPaid = entries.reduce((s, e) => s.plus(new Decimal(String(e.paidAmount))), new Decimal(0));
    const totalDebt = entries.reduce((s, e) => s.plus(new Decimal(String(e.debtAmount))), new Decimal(0));
    const totalPending = entries.reduce((s, e) => s.plus(new Decimal(String(e.pendingAmount))), new Decimal(0));
    return {
      totalPaid: totalPaid.toFixed(2),
      totalDebt: totalDebt.toFixed(2),
      totalPending: totalPending.toFixed(2),
      balance: totalPending.toFixed(2),
    };
  }

  async summaryByTalent(workspaceId: string) {
    const talents = await this.prisma.talentProfile.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
    const entries = await this.prisma.talentLedgerEntry.findMany({
      where: { workspaceId, deletedAt: null },
    });
    return talents.map((t) => {
      const own = entries.filter((e) => e.talentId === t.id);
      return { talentId: t.id, name: t.name, status: t.status, ...this.totals(own) };
    });
  }

  async talentSummary(talentId: string) {
    const entries = await this.prisma.talentLedgerEntry.findMany({ where: { talentId, deletedAt: null } });
    return this.totals(entries);
  }

  async debtDetail(talentId: string) {
    const entries = await this.prisma.talentLedgerEntry.findMany({
      where: { talentId, deletedAt: null },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return ordenarDeudas(
      entries
        .filter((e) => new Decimal(String(e.debtAmount)).gt(0) || new Decimal(String(e.pendingAmount)).gt(0))
        .map((e) => ({
          id: e.id,
          date: e.date.toISOString().slice(0, 10),
          description: e.description ?? '',
          debt: new Decimal(String(e.debtAmount)).toFixed(2),
          pending: new Decimal(String(e.pendingAmount)).toFixed(2),
          status: e.status,
          debtOwner: e.debtOwner,
        })),
    );
  }

  async create(workspaceId: string, talentId: string, data: LedgerCreateInput, source: string, actor: LedgerActor) {
    const talent = await this.prisma.talentProfile.findFirst({ where: { id: talentId, workspaceId, deletedAt: null } });
    if (!talent) throw new NotFoundException('Talento no encontrado');
    const day = dayStart(data.date);
    const entry = await this.prisma.talentLedgerEntry.create({
      data: {
        talentId,
        workspaceId,
        date: day,
        year: day.getUTCFullYear(),
        month: day.getUTCMonth() + 1,
        type: data.type,
        category: data.category ?? null,
        paidAmount: data.paidAmount ?? '0',
        debtAmount: data.debtAmount ?? '0',
        pendingAmount: data.pendingAmount ?? '0',
        currency: data.currency ?? 'PEN',
        status: data.status ?? 'PENDING',
        description: data.description ?? null,
        debtOwner: data.debtOwner ?? 'TALENT',
        source,
        createdBy: actor.profileId,
      },
    });
    await this.audit(workspaceId, actor, 'CREATE', entry.id, { after: entry });
    return entry;
  }

  async update(
    id: string,
    workspaceId: string,
    data: LedgerUpdateInput,
    actor: LedgerActor,
    restrictTalentId?: string,
  ) {
    const before = await this.prisma.talentLedgerEntry.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!before) throw new NotFoundException('Registro no encontrado');
    if (restrictTalentId && before.talentId !== restrictTalentId) {
      throw new ForbiddenException('No autorizado');
    }
    const patch: Record<string, unknown> = {};
    if (data.date) {
      const day = dayStart(data.date);
      patch.date = day;
      patch.year = day.getUTCFullYear();
      patch.month = day.getUTCMonth() + 1;
    }
    if (data.type !== undefined) patch.type = data.type;
    if (data.category !== undefined) patch.category = data.category || null;
    if (data.paidAmount !== undefined) patch.paidAmount = data.paidAmount;
    if (data.debtAmount !== undefined) patch.debtAmount = data.debtAmount;
    if (data.pendingAmount !== undefined) patch.pendingAmount = data.pendingAmount;
    if (data.status !== undefined) patch.status = data.status;
    if (data.description !== undefined) patch.description = data.description;
    if (data.debtOwner !== undefined) patch.debtOwner = data.debtOwner;
    if (data.currency !== undefined) patch.currency = data.currency;
    const entry = await this.prisma.talentLedgerEntry.update({ where: { id }, data: patch });
    await this.audit(workspaceId, actor, 'UPDATE', id, { before, after: entry });
    return entry;
  }

  async remove(id: string, workspaceId: string, actor: LedgerActor) {
    const before = await this.prisma.talentLedgerEntry.findFirst({ where: { id, workspaceId, deletedAt: null } });
    if (!before) throw new NotFoundException('Registro no encontrado');
    const entry = await this.prisma.talentLedgerEntry.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit(workspaceId, actor, 'DELETE', id, { before });
    return entry;
  }

  async auditHistory(workspaceId: string, talentId?: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { workspaceId, entity: 'TalentLedgerEntry' },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    if (!talentId) return logs;
    return logs.filter((l) => {
      const changes = l.changes as { after?: { talentId?: string }; before?: { talentId?: string } } | null;
      const tid = changes?.after?.talentId ?? changes?.before?.talentId;
      return tid === talentId;
    });
  }

  private async audit(
    workspaceId: string,
    actor: LedgerActor,
    action: string,
    entityId: string,
    changes: Record<string, unknown>,
  ) {
    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        profileId: actor.profileId,
        action,
        entity: 'TalentLedgerEntry',
        entityId,
        changes: { ...changes, actor: actor.label },
      },
    });
  }
}
