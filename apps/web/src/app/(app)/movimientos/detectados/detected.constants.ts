import { NON_CONFIRMABLE_TYPES, STATUS_LABELS, STATUS_VARIANTS, TRANSACTION_TYPE_LABELS } from '@korapay/domain';
import type { DetectedTransaction } from '@/lib/api.types';

export { NON_CONFIRMABLE_TYPES, STATUS_LABELS, STATUS_VARIANTS, TRANSACTION_TYPE_LABELS };

export function confirmBlockedReason(detected: DetectedTransaction): string | null {
  if (detected.status === 'CONFIRMED') return 'Ya confirmado';
  if (detected.status === 'DUPLICATE') return 'Duplicado';
  if (NON_CONFIRMABLE_TYPES.has(detected.transactionType)) return 'No se puede confirmar (rechazada)';
  return null;
}
