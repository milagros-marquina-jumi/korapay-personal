import type { DetectedTransaction } from '@/lib/api.types';

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  CARD_PURCHASE: 'Compra',
  ONLINE_PURCHASE: 'Compra online',
  CASH_WITHDRAWAL: 'Retiro',
  TRANSFER_SENT: 'Transferencia enviada',
  TRANSFER_RECEIVED: 'Transferencia recibida',
  SERVICE_PAYMENT: 'Pago servicio',
  SUBSCRIPTION: 'Suscripción',
  REFUND: 'Devolución',
  REVERSAL: 'Reverso',
  DECLINED_TRANSACTION: 'Rechazada',
  INSTALLMENT_PURCHASE: 'Compra en cuotas',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'Por revisar',
  CONFIRMED: 'Confirmado',
  IGNORED: 'Ignorado',
  DUPLICATE: 'Duplicado',
  FAILED: 'Error',
};

export const STATUS_VARIANTS: Record<string, 'warning' | 'success' | 'secondary' | 'info' | 'destructive'> = {
  PENDING_REVIEW: 'warning',
  CONFIRMED: 'success',
  IGNORED: 'secondary',
  DUPLICATE: 'info',
  FAILED: 'destructive',
};

export const NON_CONFIRMABLE_TYPES = new Set(['DECLINED_TRANSACTION']);

export function confirmBlockedReason(detected: DetectedTransaction): string | null {
  if (detected.status === 'CONFIRMED') return 'Ya confirmado';
  if (detected.status === 'DUPLICATE') return 'Duplicado';
  if (NON_CONFIRMABLE_TYPES.has(detected.transactionType)) return 'No se puede confirmar (rechazada)';
  return null;
}
