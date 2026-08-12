import { EXPIRING_WINDOW_DAYS } from '@korapay/domain';

const DAY_MS = 86_400_000;

export type ContractState = 'ACTIVE' | 'EXPIRING' | 'FINISHED';

export interface ContractStateInfo {
  state: ContractState;
  daysRemaining: number | null;
}

function startOfDayUtc(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

// Las fechas de contrato se guardan a medianoche UTC, pero "hoy" hay que leerlo
// en hora local: en Peru (UTC-5) despues de las 19:00 el UTC ya avanzo de dia y
// un contrato que vence hoy se marcaria como vencido antes de tiempo.
function startOfLocalDay(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

interface SequenceRow {
  id: string;
  companyId: string | null;
  startDate: Date;
}

export function buildContractSequence(rows: SequenceRow[]): Map<string, { sequence: number; sequenceTotal: number }> {
  const byCompany = new Map<string, SequenceRow[]>();
  for (const row of rows) {
    const key = row.companyId ?? '';
    const bucket = byCompany.get(key) ?? [];
    bucket.push(row);
    byCompany.set(key, bucket);
  }

  const out = new Map<string, { sequence: number; sequenceTotal: number }>();
  for (const bucket of byCompany.values()) {
    const ordered = [...bucket].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    ordered.forEach((row, index) => {
      out.set(row.id, { sequence: index + 1, sequenceTotal: ordered.length });
    });
  }
  return out;
}

interface SalaryRow {
  companyId: string | null;
  date: Date;
  amountGross: unknown;
  amountBase: unknown;
}

export function buildGrossByCompany(rows: SalaryRow[]): Map<string, string> {
  const latest = new Map<string, { date: Date; gross: number }>();

  for (const row of rows) {
    if (!row.companyId) continue;
    const gross = Number(row.amountGross ?? row.amountBase);
    if (!gross) continue;
    const current = latest.get(row.companyId);
    if (!current || row.date > current.date) latest.set(row.companyId, { date: row.date, gross });
  }

  return new Map([...latest.entries()].map(([id, v]) => [id, v.gross.toFixed(2)]));
}

export function deriveContractState(endDate: Date | null, today = new Date()): ContractStateInfo {
  if (!endDate) return { state: 'ACTIVE', daysRemaining: null };

  const days = Math.round((startOfDayUtc(endDate) - startOfLocalDay(today)) / DAY_MS);
  if (days < 0) return { state: 'FINISHED', daysRemaining: days };
  if (days <= EXPIRING_WINDOW_DAYS) return { state: 'EXPIRING', daysRemaining: days };
  return { state: 'ACTIVE', daysRemaining: days };
}
