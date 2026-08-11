const DEFAULT_PAY_DAY = 1;

export interface ScheduledIncome {
  date: Date;
  concept: string;
  amountBase: string;
  amountGross: string | null;
}

interface BuildInput {
  startDate: Date;
  endDate: Date | null;
  grossSalary: string | null;
  netSalary: string | null;
  payDay?: number;
  horizonMonths?: number;
}

function payDateFor(year: number, month: number, payDay: number) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(payDay, lastDay)));
}

// El primer sueldo se cobra el mes siguiente al inicio; el ultimo, el mes en que termina.
export function buildContractSchedule({
  startDate,
  endDate,
  grossSalary,
  netSalary,
  payDay = DEFAULT_PAY_DAY,
  horizonMonths = 12,
}: BuildInput): ScheduledIncome[] {
  const gross = grossSalary ? Number(grossSalary) : null;
  const net = netSalary ? Number(netSalary) : gross;
  if (!net) return [];

  const limit = endDate ?? new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() + horizonMonths, 1));

  const out: ScheduledIncome[] = [];
  let year = startDate.getUTCFullYear();
  let month = startDate.getUTCMonth() + 1;

  while (out.length < horizonMonths * 2) {
    const date = payDateFor(year, month, payDay);
    if (date > limit) break;
    out.push({
      date,
      concept: 'Sueldo',
      amountBase: net.toFixed(2),
      amountGross: gross && gross !== net ? gross.toFixed(2) : null,
    });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return out;
}
