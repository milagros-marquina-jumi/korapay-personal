interface PagoOrdenable {
  year?: number | null;
  month?: number | null;
  date?: string | null;
}

/**
 * Pagos del mes mas reciente primero. Ordena por año y mes, que es lo que
 * representa la fila; la fecha solo desempata dentro del mismo mes.
 */
export function ordenarPagosRecientePrimero(a: PagoOrdenable, b: PagoOrdenable): number {
  const anio = (b.year ?? 0) - (a.year ?? 0);
  if (anio !== 0) return anio;
  const mes = (b.month ?? 0) - (a.month ?? 0);
  if (mes !== 0) return mes;
  return (b.date ?? '').localeCompare(a.date ?? '');
}
