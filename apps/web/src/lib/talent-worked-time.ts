const DAY_MS = 86_400_000;

interface Period {
  startDate: string;
  endDate?: string | null;
}

export interface WorkedTime {
  workedDays: number;
  totalDays: number;
  idleDays: number;
  neverPlaced: boolean;
  /** Dias que faltan para la fecha de fin, si esa fecha aun no llego. */
  remainingDays: number;
}

function startOfDay(value: string | Date) {
  const d = new Date(value);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function mergeRanges(ranges: { from: number; to: number }[]) {
  const sorted = [...ranges].sort((a, b) => a.from - b.from);
  const merged: { from: number; to: number }[] = [];
  for (const range of sorted) {
    const last = merged.at(-1);
    if (last && range.from <= last.to) last.to = Math.max(last.to, range.to);
    else merged.push({ ...range });
  }
  return merged;
}

export function computeWorkedTime(
  startedWithMeAt: string | null | undefined,
  endedWithMeAt: string | null | undefined,
  contracts: Period[] | undefined,
  today: Date = new Date(),
): WorkedTime {
  const hoy = startOfDay(today);
  const fin = endedWithMeAt ? startOfDay(endedWithMeAt) : null;
  // El tiempo transcurrido nunca pasa de hoy: una fecha de fin futura es un plan,
  // no tiempo ya cumplido. Un contrato abierto tampoco corre hacia el futuro.
  const limit = fin !== null ? Math.min(fin, hoy) : hoy;
  const start = startedWithMeAt ? startOfDay(startedWithMeAt) : null;
  const totalDays = start !== null ? Math.max(0, Math.round((limit - start) / DAY_MS)) : 0;

  const ranges = (contracts ?? [])
    .filter((c) => c.startDate)
    .map((c) => ({
      from: startOfDay(c.startDate),
      to: c.endDate ? Math.min(startOfDay(c.endDate), limit) : limit,
    }))
    .filter((r) => r.to > r.from);

  const workedDays = mergeRanges(ranges).reduce((sum, r) => sum + Math.round((r.to - r.from) / DAY_MS), 0);

  return {
    workedDays,
    totalDays,
    idleDays: Math.max(0, totalDays - workedDays),
    neverPlaced: ranges.length === 0,
    remainingDays: fin !== null ? Math.max(0, Math.round((fin - hoy) / DAY_MS)) : 0,
  };
}
