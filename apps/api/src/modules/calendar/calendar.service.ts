import { Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { CalendarEventDto, CalendarResponseDto, CalendarSummaryDto } from './calendar.dto';

const DAY_MS = 86_400_000;
const PENDING_TX_STATUSES = ['PENDING', 'PENDING_REVIEW'];
const PENDING_LEDGER_STATUSES = ['PENDING', 'OVERDUE'];

function startOfLocalDay(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface Contexto {
  today: Date;
  workspaceIds: string[];
  workspaceName: Map<string, string>;
  workspaceType: Map<string, string>;
  includePaid: boolean;
}

const TX_ROUTE: Record<string, string> = {
  PERSONAL: '/movimientos',
  SHARED: '/movimientos',
  EMPLOYMENT: '/ingresos',
  BUSINESS: '/mimotech/costos',
};

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvents(profileId: string, from?: string, to?: string, includePaid = false): Promise<CalendarResponseDto> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { profileId },
      select: { workspace: { select: { id: true, name: true, type: true, status: true } } },
    });
    const workspaces = memberships.map((m) => m.workspace).filter((w) => w.status === 'ACTIVE');

    if (!workspaces.length) return { events: [], summary: this.emptySummary() };

    const ctx: Contexto = {
      today: startOfLocalDay(new Date()),
      workspaceIds: workspaces.map((w) => w.id),
      workspaceName: new Map(workspaces.map((w) => [w.id, w.name])),
      workspaceType: new Map(workspaces.map((w) => [w.id, w.type])),
      includePaid,
    };

    const grupos = await Promise.all([
      this.fromTransactions(ctx),
      this.fromTalentLedger(ctx),
      this.fromTaxes(ctx),
      this.fromTaxInstallments(ctx),
      this.fromEmploymentContracts(ctx),
      this.fromTalentContracts(ctx),
      this.fromSubscriptions(ctx),
    ]);

    const events = grupos
      .flat()
      .filter((event) => this.inRange(event.date, from, to))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { events, summary: this.buildSummary(events) };
  }

  private inRange(date: string, from?: string, to?: string): boolean {
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  }

  private daysUntil(date: Date, today: Date): number {
    const target = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return Math.round((target - today.getTime()) / DAY_MS);
  }

  private build(
    ctx: Contexto,
    base: Omit<CalendarEventDto, 'daysUntil' | 'workspaceName' | 'date' | 'status'> & { at: Date },
    status?: CalendarEventDto['status'],
  ): CalendarEventDto {
    const dias = this.daysUntil(base.at, ctx.today);
    const { at, ...resto } = base;
    const inicioDelMes = Date.UTC(ctx.today.getUTCFullYear(), ctx.today.getUTCMonth(), 1);
    const vencido = Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()) < inicioDelMes;
    return {
      ...resto,
      date: toIsoDate(at),
      workspaceName: ctx.workspaceName.get(base.workspaceId) ?? '',
      status: status ?? (vencido ? 'OVERDUE' : 'PENDING'),
      daysUntil: dias,
    };
  }

  private async fromTransactions(ctx: Contexto): Promise<CalendarEventDto[]> {
    const estados = ctx.includePaid ? [...PENDING_TX_STATUSES, 'PAID'] : PENDING_TX_STATUSES;
    const rows = await this.prisma.transaction.findMany({
      where: { workspaceId: { in: ctx.workspaceIds }, status: { in: estados }, deletedAt: null },
      select: {
        id: true,
        workspaceId: true,
        date: true,
        dueDate: true,
        type: true,
        status: true,
        description: true,
        concept: true,
        amountBase: true,
        currency: true,
      },
    });

    return rows.map((tx) => {
      const cobro = tx.type === 'INCOME';
      const titulo = tx.concept?.trim() || tx.description?.trim();
      const pagado = tx.status === 'PAID';
      let estado: CalendarEventDto['status'] | undefined;
      if (pagado) estado = 'PAID';
      else if (tx.status === 'PENDING_REVIEW') estado = 'REVIEW';

      return this.build(
        ctx,
        {
          id: `tx-${tx.id}`,
          source: 'TRANSACTION',
          kind: cobro ? 'COLLECTION' : 'PAYMENT',
          title: titulo || (cobro ? 'Ingreso' : 'Movimiento'),
          at: pagado ? tx.date : (tx.dueDate ?? tx.date),
          amount: tx.amountBase.toString(),
          currency: tx.currency,
          workspaceId: tx.workspaceId,
          href: TX_ROUTE[ctx.workspaceType.get(tx.workspaceId) ?? 'PERSONAL'] ?? '/movimientos',
        },
        estado,
      );
    });
  }

  private async fromTalentLedger(ctx: Contexto): Promise<CalendarEventDto[]> {
    const rows = await this.prisma.talentLedgerEntry.findMany({
      where: {
        workspaceId: { in: ctx.workspaceIds },
        status: { in: ctx.includePaid ? [...PENDING_LEDGER_STATUSES, 'PAID'] : PENDING_LEDGER_STATUSES },
      },
      select: {
        id: true,
        workspaceId: true,
        date: true,
        status: true,
        pendingAmount: true,
        debtAmount: true,
        description: true,
        talent: { select: { name: true } },
      },
    });

    const eventos: CalendarEventDto[] = [];
    for (const row of rows) {
      const pagado = row.status === 'PAID';
      let monto = row.debtAmount;
      if (!pagado && new Decimal(row.pendingAmount).gt(0)) monto = row.pendingAmount;
      if (new Decimal(monto).lte(0)) continue;

      let estado: CalendarEventDto['status'] | undefined;
      if (pagado) estado = 'PAID';
      else if (row.status === 'OVERDUE') estado = 'OVERDUE';

      eventos.push(
        this.build(
          ctx,
          {
            id: `tl-${row.id}`,
            source: 'TALENT_LEDGER',
            kind: 'COLLECTION',
            title: `${row.talent?.name ?? 'Talento'}: ${row.description?.trim() || (pagado ? 'saldado' : 'deuda pendiente')}`,
            at: row.date,
            amount: monto.toString(),
            currency: 'PEN',
            workspaceId: row.workspaceId,
            href: '/mimotech/talentos',
          },
          estado,
        ),
      );
    }
    return eventos;
  }

  private async fromTaxes(ctx: Contexto): Promise<CalendarEventDto[]> {
    const rows = await this.prisma.taxObligation.findMany({
      where: {
        workspaceId: { in: ctx.workspaceIds },
        ...(ctx.includePaid ? {} : { status: { not: 'PAID' } }),
      },
      select: { id: true, workspaceId: true, dueDate: true, amount: true, year: true, status: true },
    });

    return rows.map((tax) =>
      this.build(
        ctx,
        {
          id: `tax-${tax.id}`,
          source: 'TAX',
          kind: 'PAYMENT',
          title: tax.year ? `Renta anual ${tax.year}` : 'Renta anual',
          at: tax.dueDate,
          amount: tax.amount?.toString() ?? null,
          currency: 'PEN',
          workspaceId: tax.workspaceId,
          href: '/renta',
        },
        tax.status === 'PAID' ? 'PAID' : undefined,
      ),
    );
  }

  private async fromTaxInstallments(ctx: Contexto): Promise<CalendarEventDto[]> {
    const rows = await this.prisma.taxObligationInstallment.findMany({
      where: {
        ...(ctx.includePaid ? {} : { status: { not: 'PAID' } }),
        dueDate: { not: null },
        taxObligation: { workspaceId: { in: ctx.workspaceIds } },
      },
      select: {
        id: true,
        dueDate: true,
        amount: true,
        number: true,
        status: true,
        taxObligation: { select: { workspaceId: true, year: true } },
      },
    });

    const eventos: CalendarEventDto[] = [];
    for (const row of rows) {
      if (!row.dueDate) continue;
      const anio = row.taxObligation.year ? `${row.taxObligation.year} ` : '';
      eventos.push(
        this.build(
          ctx,
          {
            id: `taxi-${row.id}`,
            source: 'TAX',
            kind: 'PAYMENT',
            title: `Renta ${anio}— cuota ${row.number}`,
            at: row.dueDate,
            amount: row.amount.toString(),
            currency: 'PEN',
            workspaceId: row.taxObligation.workspaceId,
            href: '/renta',
          },
          row.status === 'PAID' ? 'PAID' : undefined,
        ),
      );
    }
    return eventos;
  }

  private async fromEmploymentContracts(ctx: Contexto): Promise<CalendarEventDto[]> {
    const rows = await this.prisma.employmentContract.findMany({
      where: { workspaceId: { in: ctx.workspaceIds }, endDate: { not: null }, status: 'ACTIVE' },
      select: { id: true, workspaceId: true, endDate: true, companyId: true },
    });
    if (!rows.length) return [];

    const ids = rows.map((r) => r.companyId).filter((id): id is string => Boolean(id));
    const empresas = ids.length
      ? await this.prisma.company.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
      : [];
    const nombre = new Map<string, string>(empresas.map((e) => [e.id, e.name]));

    const eventos: CalendarEventDto[] = [];
    for (const row of rows) {
      if (!row.endDate) continue;
      const empresa = (row.companyId ? nombre.get(row.companyId) : null) ?? 'empresa';
      eventos.push(
        this.build(ctx, {
          id: `ec-${row.id}`,
          source: 'CONTRACT',
          kind: 'CONTRACT_END',
          title: `Fin de contrato: ${empresa}`,
          at: row.endDate,
          amount: null,
          currency: 'PEN',
          workspaceId: row.workspaceId,
          href: '/contratos',
        }),
      );
    }
    return eventos;
  }

  private async fromTalentContracts(ctx: Contexto): Promise<CalendarEventDto[]> {
    const rows = await this.prisma.talentContract.findMany({
      where: {
        endDate: { not: null },
        status: 'ACTIVE',
        talentProfile: { workspaceId: { in: ctx.workspaceIds } },
      },
      select: {
        id: true,
        endDate: true,
        companyName: true,
        talentProfile: { select: { name: true, workspaceId: true } },
      },
    });

    const eventos: CalendarEventDto[] = [];
    for (const row of rows) {
      if (!row.endDate || !row.talentProfile) continue;
      eventos.push(
        this.build(ctx, {
          id: `tc-${row.id}`,
          source: 'CONTRACT',
          kind: 'CONTRACT_END',
          title: `Fin colocación: ${row.talentProfile.name} en ${row.companyName ?? 'cliente'}`,
          at: row.endDate,
          amount: null,
          currency: 'PEN',
          workspaceId: row.talentProfile.workspaceId,
          href: '/mimotech/talentos',
        }),
      );
    }
    return eventos;
  }

  private async fromSubscriptions(ctx: Contexto): Promise<CalendarEventDto[]> {
    const rows = await this.prisma.subscription.findMany({
      where: { workspaceId: { in: ctx.workspaceIds }, status: 'ACTIVE', nextRenewal: { not: null } },
      select: {
        id: true,
        workspaceId: true,
        nextRenewal: true,
        amount: true,
        currency: true,
        application: { select: { name: true } },
      },
    });

    const eventos: CalendarEventDto[] = [];
    for (const row of rows) {
      if (!row.nextRenewal) continue;
      eventos.push(
        this.build(ctx, {
          id: `sub-${row.id}`,
          source: 'SUBSCRIPTION',
          kind: 'PAYMENT',
          title: `Renovación: ${row.application?.name ?? 'suscripción'}`,
          at: row.nextRenewal,
          amount: row.amount.toString(),
          currency: row.currency,
          workspaceId: row.workspaceId,
          href: '/aplicaciones',
        }),
      );
    }
    return eventos;
  }

  private emptySummary(): CalendarSummaryDto {
    return {
      toPay: '0.00',
      toPayCount: 0,
      toCollect: '0.00',
      toCollectCount: 0,
      overdue: '0.00',
      overdueCount: 0,
      next30Count: 0,
    };
  }

  private buildSummary(events: CalendarEventDto[]): CalendarSummaryDto {
    const summary = this.emptySummary();
    let toPay = new Decimal(0);
    let toCollect = new Decimal(0);
    let overdue = new Decimal(0);

    for (const event of events) {
      if (event.status === 'PAID') continue;

      const monto = new Decimal(event.amount ?? 0);
      if (event.status === 'OVERDUE') {
        overdue = overdue.plus(monto);
        summary.overdueCount += 1;
      }
      if (event.kind === 'PAYMENT') {
        toPay = toPay.plus(monto);
        summary.toPayCount += 1;
      } else if (event.kind === 'COLLECTION') {
        toCollect = toCollect.plus(monto);
        summary.toCollectCount += 1;
      }
      if (event.daysUntil >= 0 && event.daysUntil <= 30) summary.next30Count += 1;
    }

    summary.toPay = toPay.toFixed(2);
    summary.toCollect = toCollect.toFixed(2);
    summary.overdue = overdue.toFixed(2);
    return summary;
  }
}
