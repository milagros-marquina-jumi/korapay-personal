import { INCOME_STATUS_LABELS as DOMAIN_STATUS_LABELS } from '@korapay/domain';
import type { Transaction } from '@/lib/api.types';

export const INCOME_STATUS_LABELS: Record<string, string> = DOMAIN_STATUS_LABELS;

export interface MonthSummary {
  key: string;
  net: number;
  gross: number;
  count: number;
  paid: number;
}

export function looksLikeAccount(notes?: string | null): boolean {
  if (!notes) return false;
  return /\d[\d\s-]{5,}/.test(notes);
}

export function accountNumber(notes?: string | null): string | null {
  if (!looksLikeAccount(notes) || !notes) return null;
  const labeled =
    /n[úu]mero de cuenta\s*:\s*([\d][\d\s-]*)/i.exec(notes) ?? /cuenta[^:]*:\s*([\d][\d\s-]*)/i.exec(notes);
  if (labeled?.[1]) return labeled[1].trim();
  const bare = /[\d][\d\s-]{6,}/.exec(notes);
  return bare?.[0]?.trim() ?? null;
}

export function grossOf(tx: Transaction): number {
  if (tx.currency === 'USD') return Number(tx.amountBase);
  return Number(tx.amountGross ?? tx.amountBase);
}

export function monthKeyOf(date: string): string {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export interface ConceptOrdinal {
  position: number;
  total: number;
}

export function conceptOrdinals(transactions: Transaction[]): Map<string, ConceptOrdinal> {
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = `${tx.companyId ?? tx.categoryId ?? 'sin-empresa'}::${tx.concept.trim().toLowerCase()}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(tx);
    groups.set(key, bucket);
  }

  const result = new Map<string, ConceptOrdinal>();
  for (const bucket of groups.values()) {
    if (bucket.length < 2) continue;
    const ordenados = bucket.toSorted((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    for (const [i, tx] of ordenados.entries()) {
      result.set(tx.id, { position: i + 1, total: ordenados.length });
    }
  }
  return result;
}

export function contractOf<T extends { companyId?: string | null; startDate: string; endDate?: string | null }>(
  tx: Pick<Transaction, 'companyId' | 'date'> & { contractId?: string | null },
  contracts: (T & { id: string })[],
): T | null {
  if (tx.contractId) {
    const directo = contracts.find((c) => c.id === tx.contractId);
    if (directo) return directo;
  }
  if (!tx.companyId) return null;

  const mes = tx.date.slice(0, 7);
  const suyos = contracts.filter((c) => c.companyId === tx.companyId);
  const vigente = suyos.find((c) => {
    const [desde, hasta] = rangoMeses(c);
    return desde <= mes && (!hasta || hasta >= mes);
  });
  if (vigente) return vigente;

  const previos = suyos
    .filter((c) => rangoMeses(c)[0] <= mes)
    .toSorted((a, b) => b.startDate.localeCompare(a.startDate));
  return previos[0] ?? null;
}

function rangoMeses(c: { startDate: string; endDate?: string | null }): [string, string | null] {
  const inicio = c.startDate.slice(0, 7);
  const fin = c.endDate ? c.endDate.slice(0, 7) : null;
  if (fin && fin < inicio) return [fin, inicio];
  return [inicio, fin];
}

export function contractDatesInverted(c?: { startDate: string; endDate?: string | null } | null): boolean {
  if (!c?.endDate) return false;
  return c.endDate.slice(0, 10) < c.startDate.slice(0, 10);
}
