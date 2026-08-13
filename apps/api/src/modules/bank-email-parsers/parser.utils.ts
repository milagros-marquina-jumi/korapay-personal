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

export function isNonTransactional(text: string): boolean {
  const t = text.toLowerCase();
  if (/tu c[oó]digo de verificaci[oó]n es|c[oó]digo de verificaci[oó]n:?\s*\d|otp:?\s*\d/i.test(t)) return true;
  if (/revisa el estado de cuenta|estado de cuenta disponible|descarga tu estado de cuenta|tu estado de tarjeta|resumen mensual/i.test(t)) return true;
  if (/promoci[oó]n exclusiva|oferta exclusiva|beneficio exclusivo|aumento de l[ií]nea de cr[eé]dito/i.test(t))
    return true;
  if (/cambi(?:aste|o) tu contrase[añ]a|actualizaci[oó]n de datos de contacto/i.test(t)) return true;
  if (/tu tarjeta est[aá] por vencer|renovaci[oó]n autom[aá]tica de tarjeta/i.test(t)) return true;
  return false;
}

export function detectCurrency(text: string): 'PEN' | 'USD' | undefined {
  if (/US\$|USD|\bd[oó]lares?\b|\$\s?\d/i.test(text)) return 'USD';
  if (/S\/\.?|PEN|\bsol(?:es)?\b/i.test(text)) return 'PEN';
  return undefined;
}

export function extractCardLast4(text: string): string | undefined {
  const m = text.match(/(?:terminada en|final(?:izada)? en|termina en|\*+|x{2,})\s*(\d{4})/i);
  if (m) return m[1];
  const generic = text.match(/(?<!S\/\s*|US\$\s*|\$\s*|PEN\s*)\b\d{4}\b(?=\s*$|\s*[).,])/);
  return generic ? generic[0] : undefined;
}

export function classifyType(text: string): BankTransactionType {
  const t = text.toLowerCase();
  if (
    /rechaz|denegad|no procesad|declinad|no se pudo realizar|saldo insuficiente|fondos insuficientes|problemas para realizar el pago|error al realizar el pago/.test(
      t,
    )
  )
    return 'DECLINED_TRANSACTION';
  if (/revers|anulaci[oó]n|anulad/.test(t)) return 'REVERSAL';
  if (/devoluci[oó]n(?!\s+de\s+(tu|su)\s+tarjeta)|reembolso|refund/i.test(t)) return 'REFUND';
  if (/\byape\b|\bplin\b/i.test(t)) {
    if (/recarga|pago de servicio|yapeo de servicio/i.test(t)) return 'SERVICE_PAYMENT';
    if (/recibiste|recibido|te enviaron|te transfirieron|te hicieron|recibiste un|recibio|abono/i.test(t))
      return 'TRANSFER_RECEIVED';
    return 'TRANSFER_SENT';
  }
  if (/\bretiro\b|cajero\s*autom[aá]tico|\batm\b/i.test(t)) return 'CASH_WITHDRAWAL';
  if (/pago\s+(?:de|a)\s+tarjetas?\s+propia/i.test(t)) return 'TRANSFER_SENT';
  if (/transferencia (recibida|recibiste|abono)/.test(t) || /recibiste una transferencia/.test(t))
    return 'TRANSFER_RECEIVED';
  if (/transferencia|enviaste|transferiste/.test(t)) return 'TRANSFER_SENT';
  if (/suscripci[oó]n|recurrente/.test(t)) return 'SUBSCRIPTION';
  if (/pago de servicio|recibo|servicio|comisi[oó]n|intereses/.test(t)) return 'SERVICE_PAYMENT';
  if (/cuota|en \d+ cuotas/.test(t)) return 'INSTALLMENT_PURCHASE';
  if (/por internet|online|e-?commerce|\bweb\b/i.test(t)) return 'ONLINE_PURCHASE';
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
