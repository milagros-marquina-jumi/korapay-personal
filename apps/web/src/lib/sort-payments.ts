interface PagoOrdenable {
  year?: number | null;
  month?: number | null;
  date?: string | null;
}

export function ordenarPagosRecientePrimero(a: PagoOrdenable, b: PagoOrdenable): number {
  const anio = (b.year ?? 0) - (a.year ?? 0);
  if (anio !== 0) return anio;
  const mes = (b.month ?? 0) - (a.month ?? 0);
  if (mes !== 0) return mes;
  return (b.date ?? '').localeCompare(a.date ?? '');
}
