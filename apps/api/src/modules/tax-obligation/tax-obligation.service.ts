import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { ScheduleRowDto, UpdateTaxObligationDto } from './tax-obligation.dto';

@Injectable()
export class TaxObligationService {
  constructor(private readonly prisma: PrismaService) {}

  private serialize(t: {
    amount: Decimal | null;
    installmentRows?: {
      amount: Decimal;
      principalAmount?: Decimal | null;
      interestAmount?: Decimal | null;
      [k: string]: unknown;
    }[];
    [k: string]: unknown;
  }) {
    const filas = t.installmentRows ?? [];
    const principal = filas.reduce((s, r) => s.plus(r.principalAmount ?? r.amount), new Decimal(0));
    const interes = filas.reduce((s, r) => s.plus(r.interestAmount ?? 0), new Decimal(0));
    const totalConInteres = principal.plus(interes);
    const base = principal.gt(0) ? principal : new Decimal(t.amount ?? 0);

    return {
      ...t,
      amount: t.amount?.toString() ?? null,
      installmentRows: filas.map((r) => ({
        ...r,
        amount: r.amount.toString(),
        principalAmount: r.principalAmount?.toString() ?? null,
        interestAmount: r.interestAmount?.toString() ?? null,
      })),
      totals: filas.length
        ? {
            principal: principal.toFixed(2),
            interest: interes.toFixed(2),
            total: totalConInteres.toFixed(2),
            surchargePct: base.gt(0) ? interes.div(base).mul(100).toFixed(2) : '0.00',
          }
        : null,
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
    const amortizacion = count > 0 ? total.div(count) : total;

    const rows = [];
    let saldo = total;

    for (let i = 1; i <= count; i++) {
      const due = new Date(dueDate);
      due.setUTCMonth(due.getUTCMonth() - (count - i));

      const principal = i === count ? saldo : new Decimal(amortizacion.toFixed(2));

      rows.push({
        taxObligationId,
        number: i,
        amount: principal.toFixed(2),
        principalAmount: principal.toFixed(2),
        interestAmount: '0.00',
        dueDate: due,
        status: 'PENDING',
      });

      saldo = saldo.minus(principal);
    }
    return rows;
  }

  private mapSchedule(taxObligationId: string, schedule: ScheduleRowDto[], fallbackDueDate: Date) {
    return schedule.map((r) => {
      const principal = new Decimal(r.principalAmount || '0');
      const interes = new Decimal(r.interestAmount || '0');
      return {
        taxObligationId,
        number: r.number,
        amount: principal.plus(interes).toFixed(2),
        principalAmount: principal.toFixed(2),
        interestAmount: interes.toFixed(2),
        dueDate: r.dueDate ? new Date(r.dueDate) : fallbackDueDate,
        status: 'PENDING',
      };
    });
  }

  private totalDelCronograma(schedule: ScheduleRowDto[]): string {
    return schedule
      .reduce((s, r) => s.plus(r.principalAmount || '0').plus(r.interestAmount || '0'), new Decimal(0))
      .toFixed(2);
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
    schedule?: ScheduleRowDto[];
    notes?: string;
  }) {
    const estado = data.status ?? 'PENDING';
    const cuotas = data.schedule?.length ?? data.installments;
    this.validarPagadas(data.paidInstallments, cuotas);

    const created = await this.prisma.taxObligation.create({
      data: {
        workspaceId: data.workspaceId,
        name: data.name,
        year: data.year ?? null,
        dueDate: new Date(data.dueDate),
        amount: data.amount ?? null,
        status: estado,
        installments: cuotas ?? null,
        paidInstallments: data.paidInstallments ?? 0,
        notes: data.notes ?? null,
      },
    });

    const vence = new Date(data.dueDate);
    if (data.schedule?.length) {
      await this.prisma.taxObligationInstallment.createMany({
        data: this.mapSchedule(created.id, data.schedule, vence),
      });
    } else if (this.debeGenerarCuotas(estado, data.installments)) {
      await this.prisma.taxObligationInstallment.createMany({
        data: this.buildInstallments(created.id, data.installments as number, data.amount ?? '0', vence),
      });
    }
    return this.findOne(created.id, data.workspaceId);
  }

  private debeGenerarCuotas(status: string, installments?: number | null): boolean {
    if (!installments || installments <= 0) return false;
    return status !== 'PAID';
  }

  private validarPagadas(pagadas?: number | null, totales?: number | null): void {
    if (pagadas == null) return;
    if (!totales || totales <= 0) {
      if (pagadas > 0) {
        throw new BadRequestException('No puedes registrar cuotas pagadas si la obligación no tiene cuotas.');
      }
      return;
    }
    if (pagadas > totales) {
      throw new BadRequestException(
        `Las cuotas pagadas (${pagadas}) no pueden superar el total de cuotas (${totales}).`,
      );
    }
  }

  private async regenerarCuotas(
    id: string,
    found: {
      status: string;
      amount: Decimal | null;
      dueDate: Date;
      installmentRows: { status: string }[];
    },
    data: UpdateTaxObligationDto,
  ): Promise<void> {
    if (found.installmentRows.some((r) => r.status === 'PAID')) return;

    const vence = data.dueDate ? new Date(data.dueDate as string) : found.dueDate;

    if (data.schedule?.length) {
      await this.prisma.taxObligationInstallment.deleteMany({ where: { taxObligationId: id } });
      await this.prisma.taxObligationInstallment.createMany({
        data: this.mapSchedule(id, data.schedule, vence),
      });
      return;
    }

    const nuevas = data.installments as number | undefined;
    const cantidad = nuevas ?? found.installmentRows.length;
    const cambioCantidad = nuevas !== undefined && nuevas !== found.installmentRows.length;
    const cambioMonto = data.amount !== undefined && data.amount !== found.amount?.toString();

    if (!cambioCantidad && !cambioMonto) return;
    if (!cambioCantidad && cantidad === 0) return;

    await this.prisma.taxObligationInstallment.deleteMany({ where: { taxObligationId: id } });

    const estado = (data.status as string) ?? found.status;
    if (!this.debeGenerarCuotas(estado, cantidad)) return;

    await this.prisma.taxObligationInstallment.createMany({
      data: this.buildInstallments(id, cantidad, (data.amount as string) ?? found.amount?.toString() ?? '0', vence),
    });
  }

  async update(id: string, workspaceId: string, data: UpdateTaxObligationDto) {
    const found = await this.prisma.taxObligation.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: { installmentRows: true },
    });
    if (!found) throw new NotFoundException('Obligación no encontrada');

    const cuotasFinales =
      data.schedule?.length ?? data.installments ?? found.installments ?? found.installmentRows.length;
    const pagadasFinales = data.paidInstallments ?? found.paidInstallments;
    this.validarPagadas(pagadasFinales, cuotasFinales);

    const updateData: Prisma.TaxObligationUncheckedUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.year !== undefined) updateData.year = data.year;
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.installments !== undefined) updateData.installments = data.installments;
    if (data.schedule?.length) {
      updateData.installments = data.schedule.length;
      updateData.amount = this.totalDelCronograma(data.schedule);
    }
    if (data.paidInstallments !== undefined) updateData.paidInstallments = data.paidInstallments;
    if (data.notes !== undefined) updateData.notes = data.notes;
    await this.prisma.taxObligation.update({ where: { id }, data: updateData });

    await this.regenerarCuotas(id, found, data);
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
