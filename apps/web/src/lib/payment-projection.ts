import { MONTH_NAMES } from '@/lib/months';

interface Distribucion {
  paymentType: string;
  year?: number | null;
  month?: number | null;
  amountReceived: string;
  amountRetained: string;
  amountWithDiscount: string;
}

interface Contrato {
  id: string;
  companyName?: string | null;
  clientName?: string | null;
  status: string;
  endDate?: string | null;
  incomeDistributions?: Distribucion[];
}

export interface FilaProyectada {
  contractId: string;
  empresa: string;
  cliente: string;
  base: number;
  recibi: number;
  quedo: number;
  desdePeriodo: string;
}

export interface Proyeccion {
  year: number;
  month: number;
  etiqueta: string;
  filas: FilaProyectada[];
  totalRecibi: number;
  totalQuedo: number;
  totalBase: number;
}

function ultimoMensual(c: Contrato, year: number, month: number): Distribucion | null {
  const mensuales = (c.incomeDistributions ?? []).filter((d) => d.paymentType === 'Mensual' && d.year && d.month);
  if (!mensuales.length) return null;
  if (mensuales.some((d) => d.year === year && d.month === month)) return null;
  const previos = mensuales.filter((d) => (d.year ?? 0) < year || ((d.year ?? 0) === year && (d.month ?? 0) < month));
  if (!previos.length) return null;
  return previos.reduce((a, b) =>
    (b.year ?? 0) > (a.year ?? 0) || ((b.year ?? 0) === (a.year ?? 0) && (b.month ?? 0) > (a.month ?? 0)) ? b : a,
  );
}

export function proyectarMesActual(contracts: Contrato[], hoy: Date = new Date()): Proyeccion {
  const year = hoy.getUTCFullYear();
  const month = hoy.getUTCMonth() + 1;
  const finDelMes = `${year}-${String(month).padStart(2, '0')}-01`;

  const filas: FilaProyectada[] = [];
  for (const c of contracts) {
    if (c.status !== 'ACTIVE') continue;
    if (c.endDate && c.endDate.slice(0, 10) < finDelMes) continue;
    const ultimo = ultimoMensual(c, year, month);
    if (!ultimo) continue;
    filas.push({
      contractId: c.id,
      empresa: c.companyName || 'Sin empresa',
      cliente: c.clientName ?? '',
      base: Number(ultimo.amountWithDiscount),
      recibi: Number(ultimo.amountReceived),
      quedo: Number(ultimo.amountRetained),
      desdePeriodo: `${MONTH_NAMES[(ultimo.month ?? 1) - 1]} ${ultimo.year}`,
    });
  }
  filas.sort((a, b) => b.recibi - a.recibi);

  const suma = (f: (x: FilaProyectada) => number) => Math.round(filas.reduce((s, x) => s + f(x), 0) * 100) / 100;
  return {
    year,
    month,
    etiqueta: `${MONTH_NAMES[month - 1]} ${year}`,
    filas,
    totalRecibi: suma((x) => x.recibi),
    totalQuedo: suma((x) => x.quedo),
    totalBase: suma((x) => x.base),
  };
}
