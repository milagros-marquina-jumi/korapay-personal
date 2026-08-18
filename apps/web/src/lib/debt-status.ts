export const DEBT_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PARTIAL', label: 'Parcial' },
  { value: 'PAID', label: 'Pagado' },
  { value: 'OVERDUE', label: 'Vencida' },
  { value: 'NUNCA_PAGO', label: 'Nunca pagó (pérdida)' },
];

/** Estados en los que la deuda ya no se espera cobrar. */
export function esSaldada(status: string): boolean {
  return status === 'PAID' || status === 'NUNCA_PAGO';
}

interface Deuda {
  status: string;
  debtAmount?: string;
  pendingAmount?: string;
}

export function avisoDeuda({ status, debtAmount, pendingAmount }: Deuda): string | null {
  const deuda = Number(debtAmount ?? 0);
  const falta = Number(pendingAmount ?? 0);

  if (esSaldada(status) && falta > 0) {
    return status === 'PAID'
      ? 'Marcaste la deuda como pagada, pero aún figura un monto por pagar. Al guardar se pondrá en cero.'
      : 'Marcaste la deuda como perdida, pero aún figura un monto por pagar. Al guardar se pondrá en cero.';
  }

  if (!esSaldada(status) && falta <= 0 && deuda > 0) {
    return 'Dijiste que sigue pendiente pero no falta pagar nada. Si ya te la devolvió, marca "Pagado".';
  }

  if (falta > deuda && deuda > 0) {
    return 'Falta pagar no puede ser mayor que la deuda.';
  }

  return null;
}

/** Ajusta los montos para que concuerden con el estado elegido. */
export function normalizarDeuda({ status, debtAmount, pendingAmount }: Deuda): string {
  if (esSaldada(status)) return '0';
  const falta = Number(pendingAmount ?? 0);
  if (falta > 0) return pendingAmount ?? '0';
  return debtAmount ?? '0';
}
