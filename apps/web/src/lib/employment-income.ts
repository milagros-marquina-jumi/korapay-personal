import type { Transaction } from '@/lib/api.types';

export const INCOME_STATUS_LABELS: Record<string, string> = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  OVERDUE: 'Vencido',
  PARTIAL: 'Parcial',
  CANCELLED: 'Cancelado',
  PENDING_REVIEW: 'Revisión',
};

export interface MonthSummary {
  key: string;
  net: number;
  gross: number;
  count: number;
  paid: number;
}

// Las notas traen el numero de cuenta con etiquetas del banco y a veces tambien el CCI.
export function accountNumber(notes?: string | null): string | null {
  if (!notes) return null;
  const labeled =
    /n[úu]mero de cuenta\s*:\s*([\d][\d\s-]*)/i.exec(notes) ?? /cuenta[^:]*:\s*([\d][\d\s-]*)/i.exec(notes);
  if (labeled?.[1]) return labeled[1].trim();
  const bare = /[\d][\d\s-]{6,}/.exec(notes);
  return bare?.[0]?.trim() ?? notes.trim() ?? null;
}

// amountGross solo se guarda cuando hubo descuento; si falta, el bruto es el propio neto.
export function grossOf(tx: Transaction): number {
  return Number(tx.amountGross ?? tx.amountBase);
}

export function monthKeyOf(date: string): string {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
