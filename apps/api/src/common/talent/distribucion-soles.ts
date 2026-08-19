import Decimal from 'decimal.js';
import type { PrismaService } from '@/common/prisma/prisma.service';

export interface DistribucionConvertible {
  salary?: unknown;
  amountWithDiscount?: unknown;
  amountReceived?: unknown;
  amountRetained?: unknown;
  exchangeRate?: unknown;
}

export async function ultimoTipoCambio(prisma: PrismaService): Promise<Decimal> {
  const latest = await prisma.exchangeRate.findFirst({ orderBy: { date: 'desc' }, select: { rate: true } });
  return latest ? new Decimal(String(latest.rate)) : new Decimal(1);
}

export async function tipoCambioPara(prisma: PrismaService, date: Date | null): Promise<Decimal> {
  if (date) {
    const previo = await prisma.exchangeRate.findFirst({
      where: { date: { lte: date } },
      orderBy: { date: 'desc' },
      select: { rate: true },
    });
    if (previo) return new Decimal(String(previo.rate));
  }
  return ultimoTipoCambio(prisma);
}

// Los pagos de contratos en dolares se guardan en su moneda original con el tipo de
// cambio del dia del pago; toda agregacion debe sumar en soles usando esta conversion.
export function distribucionEnSoles<T extends DistribucionConvertible>(
  d: T,
  currency: string | null | undefined,
  fallback: Decimal,
): T {
  if (currency !== 'USD') return d;
  const rate = d.exchangeRate ? new Decimal(String(d.exchangeRate)) : fallback;
  const conv = (v: unknown) => (v == null ? v : new Decimal(String(v)).mul(rate).toFixed(2));
  return {
    ...d,
    salary: conv(d.salary),
    amountWithDiscount: conv(d.amountWithDiscount),
    amountReceived: conv(d.amountReceived),
    amountRetained: conv(d.amountRetained),
  } as T;
}
