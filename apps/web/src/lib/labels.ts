export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Ingreso',
  EXPENSE: 'Egreso',
  SAVING: 'Ahorro',
  BUSINESS_COST: 'Costo',
  TEAM_PAYMENT: 'Pago equipo',
  TRANSFER: 'Transferencia',
};

export const RECURRENCE_LABELS: Record<string, string> = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
};

export const DIRECTION_LABELS: Record<string, string> = {
  DEBO: 'Debo',
  ME_DEBEN: 'Me deben',
};

export const PENDING_KIND_LABELS: Record<string, string> = {
  COBRAR: 'Por cobrar',
  PAGAR: 'Por pagar',
};

export function transactionTypeLabel(type: string): string {
  return TRANSACTION_TYPE_LABELS[type] ?? type;
}

export function recurrenceLabel(frequency: string): string {
  return RECURRENCE_LABELS[frequency] ?? frequency;
}
