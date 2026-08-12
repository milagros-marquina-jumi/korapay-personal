import { TransactionType } from '@korapay/domain';

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  [TransactionType.INCOME]: 'Ingreso',
  [TransactionType.EXPENSE]: 'Egreso',
  [TransactionType.SAVING]: 'Ahorro',
  [TransactionType.BUSINESS_COST]: 'Costo',
  [TransactionType.TEAM_PAYMENT]: 'Pago equipo',
  [TransactionType.TRANSFER]: 'Transferencia',
  [TransactionType.DEBT]: 'Deuda',
  [TransactionType.DEBT_PAYMENT]: 'Pago de deuda',
  [TransactionType.ADJUSTMENT]: 'Ajuste',
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
