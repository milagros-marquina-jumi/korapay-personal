import { Injectable, Logger } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '@/common/prisma/prisma.service';
import { distribucionEnSoles, ultimoTipoCambio } from '@/common/talent/distribucion-soles';

export const TALENT_SYNC_PREFIX = 'TALENT_SYNC';

function refDe(year: number, month: number) {
  return `${TALENT_SYNC_PREFIX}:${year}-${String(month).padStart(2, '0')}`;
}

@Injectable()
export class TalentIncomeSyncService {
  private readonly logger = new Logger(TalentIncomeSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sync(businessWorkspaceId: string): Promise<void> {
    try {
      await this.syncInterno(businessWorkspaceId);
    } catch (error) {
      this.logger.error(`Fallo la sincronizacion de ingresos de talentos: ${(error as Error).message}`);
    }
  }

  private async syncInterno(businessWorkspaceId: string): Promise<void> {
    const target = await this.prisma.company.findFirst({
      where: { syncTalentWorkspaceId: businessWorkspaceId, deletedAt: null },
    });
    if (!target) return;

    const distributions = await this.prisma.talentIncomeDistribution.findMany({
      where: {
        year: { not: null },
        month: { not: null },
        OR: [
          { contract: { talentProfile: { workspaceId: businessWorkspaceId, deletedAt: null } } },
          { talent: { workspaceId: businessWorkspaceId, deletedAt: null } },
        ],
      },
      select: {
        year: true,
        month: true,
        amountReceived: true,
        exchangeRate: true,
        contract: { select: { currency: true } },
      },
    });

    const tipoCambio = await ultimoTipoCambio(this.prisma);
    const porMes = new Map<string, { year: number; month: number; total: Decimal }>();
    for (const bruto of distributions) {
      if (!bruto.year || !bruto.month) continue;
      const d = distribucionEnSoles(bruto, bruto.contract?.currency, tipoCambio);
      const ref = refDe(d.year as number, d.month as number);
      const bucket = porMes.get(ref) ?? { year: d.year as number, month: d.month as number, total: new Decimal(0) };
      bucket.total = bucket.total.add(new Decimal(String(d.amountReceived)));
      porMes.set(ref, bucket);
    }

    const derivadas = await this.prisma.transaction.findMany({
      where: {
        workspaceId: target.workspaceId,
        companyId: target.id,
        deletedAt: null,
        sourceRef: { startsWith: `${TALENT_SYNC_PREFIX}:` },
      },
      select: { id: true, sourceRef: true, amountBase: true },
    });
    const derivadaPorRef = new Map(derivadas.map((t) => [t.sourceRef ?? '', t]));

    const plantilla = await this.prisma.transaction.findFirst({
      where: { workspaceId: target.workspaceId, companyId: target.id, deletedAt: null },
      orderBy: { date: 'desc' },
      select: { concept: true, categoryId: true },
    });

    for (const [ref, { year, month, total }] of porMes) {
      if (total.lte(0)) continue;
      const existente = derivadaPorRef.get(ref);
      const monto = total.toFixed(2);
      if (!existente) {
        await this.prisma.transaction.create({
          data: {
            workspaceId: target.workspaceId,
            companyId: target.id,
            type: 'INCOME',
            concept: plantilla?.concept ?? 'Empresas',
            categoryId: plantilla?.categoryId ?? null,
            date: new Date(Date.UTC(year, month - 1, 1)),
            amountOriginal: monto,
            amountBase: monto,
            currency: 'PEN',
            status: 'PAID',
            sourceRef: ref,
            notes: 'Generado automaticamente desde los pagos de contratos de Mimotalents.',
          },
        });
      } else if (!new Decimal(String(existente.amountBase)).eq(total)) {
        await this.prisma.transaction.update({
          where: { id: existente.id },
          data: { amountOriginal: monto, amountBase: monto },
        });
      }
    }

    for (const t of derivadas) {
      const ref = t.sourceRef ?? '';
      const bucket = porMes.get(ref);
      if (!bucket || bucket.total.lte(0)) {
        await this.prisma.transaction.update({ where: { id: t.id }, data: { deletedAt: new Date() } });
      }
    }
  }
}
