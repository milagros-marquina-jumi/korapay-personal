import { createHash } from 'node:crypto';
import type { BankTransactionType, ParsedBankTransaction } from './parser.types';

export function normalizeMerchant(raw: string | undefined): string {
  if (!raw) return '';
  return raw
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseAmount(raw: string): string {
  const cleaned = raw.replace(/[^0-9.,]/g, '');
  if (!cleaned) return '0';
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized = cleaned;
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = cleaned.replace(/,/g, '');
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value.toFixed(2) : '0';
}

export function detectCurrency(text: string): 'PEN' | 'USD' {
  if (/US\$|USD|\bd[oó]lares?\b|\$\s?\d/i.test(text) && !/S\/|soles/i.test(text)) return 'USD';
  if (/US\$|USD|\bd[oó]lares?\b/i.test(text)) return 'USD';
  return 'PEN';
}

export function extractCardLast4(text: string): string | undefined {
  const m = text.match(/(?:terminada en|final(?:izada)? en|termina en|\*{2,}|x{2,})\s*(\d{4})/i);
  if (m) return m[1];
  const generic = text.match(/\b\d{4}\b(?=\s*$|\s*[).,])/);
  return generic ? generic[0] : undefined;
}

export function classifyType(text: string): BankTransactionType {
  const t = text.toLowerCase();
  if (/rechaz|denegad|no procesad|declinad/.test(t)) return 'DECLINED_TRANSACTION';
  if (/revers|anulaci[oó]n|anulad/.test(t)) return 'REVERSAL';
  if (/devoluci[oó]n(?!\s+de\s+(tu|su)\s+tarjeta)|reembolso|refund/i.test(t)) return 'REFUND';
  if (/plin|yape/i.test(t)) return 'TRANSFER_SENT';
  if (/retiro|cajero|atm/.test(t)) return 'CASH_WITHDRAWAL';
  if (/transferencia (recibida|recibiste|abono)/.test(t) || /recibiste una transferencia/.test(t))
    return 'TRANSFER_RECEIVED';
  if (/transferencia|enviaste|transferiste/.test(t)) return 'TRANSFER_SENT';
  if (/suscripci[oó]n|recurrente/.test(t)) return 'SUBSCRIPTION';
  if (/pago de servicio|recibo|servicio/.test(t)) return 'SERVICE_PAYMENT';
  if (/cuota|en \d+ cuotas/.test(t)) return 'INSTALLMENT_PURCHASE';
  if (/internet|online|e-?commerce|por internet|web/.test(t)) return 'ONLINE_PURCHASE';
  return 'CARD_PURCHASE';
}

export function computeConfidence(parts: {
  bank: boolean;
  amount: boolean;
  currency: boolean;
  date: boolean;
  cardLast4: boolean;
  merchant: boolean;
  reference: boolean;
}): number {
  let score = 0;
  if (parts.bank) score += 0.2;
  if (parts.amount) score += 0.25;
  if (parts.currency) score += 0.1;
  if (parts.date) score += 0.1;
  if (parts.cardLast4) score += 0.15;
  if (parts.merchant) score += 0.1;
  if (parts.reference) score += 0.1;
  return Math.min(1, Number(score.toFixed(2)));
}

export function buildFingerprint(input: {
  bankCode: string;
  cardLast4?: string;
  merchantNormalized: string;
  amount: string;
  currency: string;
  occurredAt: Date;
  externalReference?: string;
}): string {
  const rounded = new Date(input.occurredAt);
  rounded.setUTCSeconds(0, 0);
  const parts = [
    input.bankCode,
    input.cardLast4 ?? '',
    input.merchantNormalized,
    input.amount,
    input.currency,
    rounded.toISOString(),
    input.externalReference ?? '',
  ].join('|');
  return createHash('sha256').update(parts).digest('hex');
}

export function sanitizeRaw(parsed: ParsedBankTransaction, subject: string): Record<string, unknown> {
  return {
    bankCode: parsed.bankCode,
    bankName: parsed.bankName,
    cardLast4: parsed.cardLast4 ? `****${parsed.cardLast4}` : null,
    merchant: parsed.merchant ?? null,
    amount: parsed.amount,
    currency: parsed.currency,
    transactionType: parsed.transactionType,
    externalReference: parsed.externalReference ?? null,
    installments: parsed.installments ?? null,
    subject: subject.slice(0, 160),
    recipient: parsed.recipient ?? null,
    destinationMethod: parsed.destinationMethod ?? null,
  };
}
