const DAY_MS = 86_400_000;
const EXPIRING_WINDOW_DAYS = 45;

export type ContractState = 'ACTIVE' | 'EXPIRING' | 'FINISHED';

export interface ContractStateInfo {
  state: ContractState;
  daysRemaining: number | null;
}

function startOfDayUtc(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

interface SalaryRow {
  companyId: string | null;
  date: Date;
  amountGross: unknown;
  amountBase: unknown;
}

// El sueldo pactado se infiere del bruto mas reciente que pago esa empresa.
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

// El estado se calcula al leer: un contrato guardado como ACTIVE vence solo con el paso del tiempo.
export function deriveContractState(endDate: Date | null, today = new Date()): ContractStateInfo {
  if (!endDate) return { state: 'ACTIVE', daysRemaining: null };

  const days = Math.round((startOfDayUtc(endDate) - startOfDayUtc(today)) / DAY_MS);
  if (days < 0) return { state: 'FINISHED', daysRemaining: days };
  if (days <= EXPIRING_WINDOW_DAYS) return { state: 'EXPIRING', daysRemaining: days };
  return { state: 'ACTIVE', daysRemaining: days };
}
