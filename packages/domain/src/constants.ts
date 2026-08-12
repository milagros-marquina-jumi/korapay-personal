export const SALARY_CONCEPT = 'Sueldo';
export const TALENT_TAG = 'TALENTO';
export const LEDGER_ACTOR_PREFIX = 'TALENT:';

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export const MONTH_SHORT = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

export const DEFAULT_PAY_DAY = 1;
export const TOP_CATEGORIES = 10;
export const EXPIRING_WINDOW_DAYS = 45;
export const EMAIL_INGESTION_MAX_BODY_LENGTH = 50000;

export const EmailProvider = {
  GMAIL_APPS_SCRIPT: 'GMAIL_APPS_SCRIPT',
} as const;
export type EmailProvider = (typeof EmailProvider)[keyof typeof EmailProvider];

export const NON_EXPENSE_TYPES: string[] = ['DECLINED_TRANSACTION', 'REVERSAL', 'REFUND'];

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

export const NON_CONFIRMABLE_TYPES: ReadonlySet<string> = new Set(['DECLINED_TRANSACTION']);

export const INCOME_STATUS_LABELS: Record<string, string> = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  OVERDUE: 'Vencido',
  PARTIAL: 'Parcial',
  CANCELLED: 'Cancelado',
  PENDING_REVIEW: 'Revisión',
};
