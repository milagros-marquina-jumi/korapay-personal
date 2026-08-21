import { NON_CONFIRMABLE_TYPES } from '@korapay/domain';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ExchangeRateService } from '@/modules/exchange-rate/exchange-rate.service';
import type { UpdateDetectedDto } from './detected-transactions.dto';

const INCOME_LIKE_TYPES = ['REFUND', 'REVERSAL'];

const BANK_ALIASES: Record<string, string> = {
  interbank: 'IBK',
  ibk: 'Interbank',
  'banco de credito': 'BCP',
  'banco de crédito': 'BCP',
  continental: 'BBVA',
  mibanco: 'Mi Banco',
  scotia: 'Scotiabank',
};

interface ConfirmData {
  workspaceId: string;
  accountId?: string;
  categoryId?: string;
  bank?: string;
  paymentMethod?: string;
  projectId?: string;
  applicationId?: string;
  description?: string;
  occurredAt?: string;
  amount?: string;
  currency?: string;
  exchangeRate?: string;
}

@Injectable()
export class DetectedTransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  async findAll(
    profileId: string,
    filters: { status?: string; emailSourceId?: string; bankCode?: string; currency?: string; search?: string },
  ) {
    const rows = await this.prisma.detectedBankTransaction.findMany({
      where: {
        profileId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.emailSourceId ? { emailSourceId: filters.emailSourceId } : {}),
        ...(filters.bankCode ? { bankCode: filters.bankCode } : {}),
        ...(filters.currency ? { currency: filters.currency } : {}),
        ...(filters.search
          ? { merchantNormalized: { contains: filters.search.toUpperCase(), mode: 'insensitive' } }
          : {}),
      },
      include: { emailSource: { select: { id: true, name: true, email: true } } },
      orderBy: { occurredAt: 'desc' },
      take: 500,
    });
    return rows.map((r) => ({ ...r, amount: r.amount.toString(), confidence: Number(r.confidence) }));
  }

  async summary(profileId: string) {
    const rows = await this.prisma.detectedBankTransaction.findMany({ where: { profileId } });
    return {
      pendingReview: rows.filter((r) => r.status === 'PENDING_REVIEW').length,
      highConfidence: rows.filter((r) => r.status === 'PENDING_REVIEW' && Number(r.confidence) >= 0.8).length,
      withoutAccount: rows.filter((r) => r.status === 'PENDING_REVIEW' && !r.accountId).length,
      duplicates: rows.filter((r) => r.status === 'DUPLICATE').length,
      failed: rows.filter((r) => r.status === 'FAILED').length,
    };
  }

  async findOne(id: string, profileId: string) {
    const row = await this.prisma.detectedBankTransaction.findFirst({ where: { id, profileId } });
    if (!row) throw new NotFoundException('Movimiento detectado no encontrado');
    return { ...row, amount: row.amount.toString(), confidence: Number(row.confidence) };
  }

  async update(id: string, profileId: string, data: UpdateDetectedDto) {
    await this.findOne(id, profileId);
    const row = await this.prisma.detectedBankTransaction.update({ where: { id }, data });
    return { ...row, amount: row.amount.toString(), confidence: Number(row.confidence) };
  }

  async ignore(id: string, profileId: string) {
    await this.findOne(id, profileId);
    const row = await this.prisma.detectedBankTransaction.update({
      where: { id },
      data: { status: 'IGNORED', ignoredAt: new Date() },
    });
    return { ...row, amount: row.amount.toString(), confidence: Number(row.confidence) };
  }

  async unignore(id: string, profileId: string) {
    await this.findOne(id, profileId);
    const row = await this.prisma.detectedBankTransaction.update({
      where: { id },
      data: { status: 'PENDING_REVIEW', ignoredAt: null },
    });
    return { ...row, amount: row.amount.toString(), confidence: Number(row.confidence) };
  }

  async markDuplicate(id: string, profileId: string) {
    await this.findOne(id, profileId);
    const row = await this.prisma.detectedBankTransaction.update({ where: { id }, data: { status: 'DUPLICATE' } });
    return { ...row, amount: row.amount.toString(), confidence: Number(row.confidence) };
  }

  private notaImportacion(
    detected: {
      bankName: string | null;
      bankCode: string | null;
      cardLast4: string | null;
      merchantOriginal: string | null;
      externalReference: string | null;
      occurredAt: Date;
    },
    medioDePago?: string,
    bancoResuelto?: string | null,
  ) {
    const banco = bancoResuelto ?? detected.bankName ?? detected.bankCode;
    const partes = ['Importado desde correo bancario'];
    const linea = [banco, detected.cardLast4 ? `***${detected.cardLast4}` : null, medioDePago]
      .filter(Boolean)
      .join(' · ');
    if (linea) partes.push(linea);
    if (detected.merchantOriginal) partes.push(`Comercio: ${detected.merchantOriginal}`);
    if (detected.externalReference) partes.push(`Referencia: ${detected.externalReference}`);
    partes.push(`Fecha del consumo: ${detected.occurredAt.toISOString().slice(0, 10)}`);
    return partes.join('\n');
  }

  private async bancoDelCatalogo(bankName: string | null, bankCode: string | null): Promise<string | null> {
    const candidatos = [bankName, bankCode]
      .filter((v): v is string => !!v)
      .flatMap((v) => [v, BANK_ALIASES[v.toLowerCase()]])
      .filter((v): v is string => !!v);
    if (!candidatos.length) return null;
    const bancos = await this.prisma.bank.findMany({ select: { name: true } });
    for (const candidato of candidatos) {
      const exacto = bancos.find((b) => b.name.toLowerCase() === candidato.toLowerCase());
      if (exacto) return exacto.name;
    }
    for (const candidato of candidatos) {
      const parcial = bancos.find(
        (b) =>
          b.name.toLowerCase().startsWith(candidato.toLowerCase()) ||
          candidato.toLowerCase().startsWith(b.name.toLowerCase()),
      );
      if (parcial) return parcial.name;
    }
    return null;
  }

  async confirm(id: string, profileId: string, data: ConfirmData) {
    const detected = await this.prisma.detectedBankTransaction.findFirst({ where: { id, profileId } });
    if (!detected) throw new NotFoundException('Movimiento detectado no encontrado');
    if (detected.status === 'CONFIRMED') throw new ConflictException('Este movimiento ya fue confirmado');
    if (detected.status === 'DUPLICATE') throw new BadRequestException('No se puede confirmar un duplicado');
    if (NON_CONFIRMABLE_TYPES.has(detected.transactionType)) {
      throw new BadRequestException('No se puede confirmar una operación rechazada');
    }

    const membership = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId: data.workspaceId, profileId },
    });
    if (!membership) throw new BadRequestException('Workspace inválido');

    const type = INCOME_LIKE_TYPES.includes(detected.transactionType)
      ? 'INCOME'
      : detected.transactionType === 'TRANSFER_RECEIVED'
        ? 'INCOME'
        : 'EXPENSE';
    const amount = data.amount ?? detected.amount.toString();
    const currency = data.currency ?? detected.currency;
    const occurredAt = data.occurredAt ? new Date(data.occurredAt) : detected.occurredAt;
    // En soles la tasa es 1. En dolares se toma la del correo y, si no vino, la
    // real del dia: nunca 1, que registraria el monto sin convertir.
    let exchangeRate = data.exchangeRate ?? detected.exchangeRate?.toString() ?? '1';
    if (currency !== 'PEN' && !data.exchangeRate && !detected.exchangeRate) {
      exchangeRate = await this.exchangeRateService.getRateForDate(occurredAt.toISOString().slice(0, 10));
    }
    const amountBase =
      currency === 'PEN'
        ? new Decimal(amount).toFixed(2)
        : new Decimal(amount).times(new Decimal(exchangeRate)).toFixed(2);

    const banco = data.bank ?? (await this.bancoDelCatalogo(detected.bankName, detected.bankCode));
    const tags = ['EMAIL_IMPORT'];
    if (banco) tags.push(banco);
    if (data.paymentMethod) tags.push(data.paymentMethod);

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          workspaceId: data.workspaceId,
          type,
          concept: data.description ?? detected.description,
          description: detected.merchantOriginal ?? null,
          date: occurredAt,
          amountOriginal: amount,
          currency,
          exchangeRate,
          amountBase,
          categoryId: data.categoryId ?? detected.categoryId ?? undefined,
          accountId: data.accountId ?? detected.accountId ?? undefined,
          projectId: data.projectId ?? detected.projectId ?? undefined,
          applicationId: data.applicationId ?? detected.applicationId ?? undefined,
          status: 'PAID',
          notes: this.notaImportacion(detected, data.paymentMethod, banco),
          tags,
        },
      });
      const updated = await tx.detectedBankTransaction.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          transactionId: transaction.id,
          workspaceId: data.workspaceId,
          accountId: data.accountId ?? detected.accountId,
          categoryId: data.categoryId ?? detected.categoryId,
          confirmedAt: new Date(),
          confirmedBy: profileId,
        },
      });
      await tx.auditLog.create({
        data: {
          workspaceId: data.workspaceId,
          profileId,
          action: 'CONFIRM',
          entity: 'DetectedBankTransaction',
          entityId: id,
          changes: { transactionId: transaction.id, amount, currency },
        },
      });
      return { transaction, updated };
    });

    return {
      status: 'confirmed',
      transactionId: result.transaction.id,
      detectedTransactionId: id,
    };
  }

  async remove(id: string, profileId: string) {
    await this.findOne(id, profileId);
    await this.prisma.detectedBankTransaction.delete({ where: { id } });
    return { ok: true };
  }

  async bulkIgnore(ids: string[], profileId: string) {
    const result = await this.prisma.detectedBankTransaction.updateMany({
      where: { id: { in: ids }, profileId, status: 'PENDING_REVIEW' },
      data: { status: 'IGNORED', ignoredAt: new Date() },
    });
    return { ignored: result.count };
  }
}
