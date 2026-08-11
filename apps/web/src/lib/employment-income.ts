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

// La migracion dejo numeros de cuenta dentro de notes; el resto son notas escritas por el usuario.
export function looksLikeAccount(notes?: string | null): boolean {
  if (!notes) return false;
  return /\d[\d\s-]{5,}/.test(notes);
}

// Las notas de cuenta traen etiquetas del banco y a veces tambien el CCI.
export function accountNumber(notes?: string | null): string | null {
  if (!looksLikeAccount(notes) || !notes) return null;
  const labeled =
    /n[úu]mero de cuenta\s*:\s*([\d][\d\s-]*)/i.exec(notes) ?? /cuenta[^:]*:\s*([\d][\d\s-]*)/i.exec(notes);
  if (labeled?.[1]) return labeled[1].trim();
  const bare = /[\d][\d\s-]{6,}/.exec(notes);
  return bare?.[0]?.trim() ?? null;
}

// amountGross solo se guarda cuando hubo descuento y siempre en soles; si falta, el bruto es el neto.
export function grossOf(tx: Transaction): number {
  if (tx.currency === 'USD') return Number(tx.amountBase);
  return Number(tx.amountGross ?? tx.amountBase);
}

export function monthKeyOf(date: string): string {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
