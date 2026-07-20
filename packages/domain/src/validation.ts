import { z } from 'zod';
import { TransactionStatus } from './enums';
export function maskBankAccount(input: string): {
  masked: string;
  lastFour: string;
} {
  const cleaned = input.replace(/\s/g, '');
  const lastFour = cleaned.slice(-4);
  const masked = `****${lastFour}`;
  return { masked, lastFour };
}
export function detectBankAccount(text: string): boolean {
  const patterns = [/\b\d{3}-\d{6,10}-\d{2}\b/, /\b\d{13,20}\b/, /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/];
  return patterns.some((p) => p.test(text));
}
export function redactSensitiveData(text: string): string {
  let result = text;
  result = result.replace(/\b\d{3}-\d{6,10}-\d{2}\b/g, '[CCI-REDACTED]');
  result = result.replace(/\b(\d{13,20})\b/g, (_, num) => `***${num.slice(-4)}`);
  return result;
}
export const moneyStringSchema = z
  .string()
  .regex(/^-?\d+(\.\d{1,2})?$/, 'Must be a valid decimal with up to 2 decimals');
export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');
export function mapExcelStatus(
  raw: string | null | undefined,
): (typeof TransactionStatus)[keyof typeof TransactionStatus] {
  const normalized = (raw ?? '').trim().toLowerCase();
  const mapping: Record<string, (typeof TransactionStatus)[keyof typeof TransactionStatus]> = {
    pagado: TransactionStatus.PAID,
    pendiente: TransactionStatus.PENDING,
    'falta pagar': TransactionStatus.PENDING,
    'nunca pago': TransactionStatus.OVERDUE,
    'nunca pagó': TransactionStatus.OVERDUE,
    parcial: TransactionStatus.PARTIAL,
    cancelado: TransactionStatus.CANCELLED,
    '': TransactionStatus.PENDING_REVIEW,
  };
  return mapping[normalized] ?? TransactionStatus.PENDING_REVIEW;
}
