const DIA = 24 * 60 * 60 * 1000;

export interface Vencimiento {
  dias: number;
  vencido: boolean;
  porVencer: boolean;
}

/**
 * Dias que faltan para que termine el contrato. Negativo si ya paso la fecha.
 * Compara en UTC a medianoche para que no dependa de la hora del navegador.
 */
export function diasParaVencer(endDate?: string | null, hoy: Date = new Date()): Vencimiento | null {
  if (!endDate) return null;
  const fin = new Date(`${endDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(fin.getTime())) return null;
  const ahora = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  const dias = Math.round((fin.getTime() - ahora) / DIA);
  return { dias, vencido: dias < 0, porVencer: dias >= 0 && dias <= 30 };
}
