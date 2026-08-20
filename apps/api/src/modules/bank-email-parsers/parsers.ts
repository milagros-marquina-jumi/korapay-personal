import type { BankEmailParser, IncomingBankEmail, ParsedBankTransaction } from './parser.types';
import {
  classifyType,
  computeConfidence,
  detectCurrency,
  extractCardLast4,
  isNonTransactional,
  parseAmount,
} from './parser.utils';

function extractAmount(text: string): string | undefined {
  const m = text.match(/(?:S\/\.?|US\$|\$|USD|PEN)\s*([\d.,]+\d)/i);
  if (m?.[1]) return parseAmount(m[1]);
  const alt = text.match(/(?:por|importe|monto)[:\s]+(?:S\/\.?|US\$|\$)?\s*([\d.,]+\d)/i);
  return alt?.[1] ? parseAmount(alt[1]) : undefined;
}

function extractMerchant(text: string): string | undefined {
  const patterns = [
    /Empresa:\s*\d+\s*-\s*([A-Za-z0-9ÁÉÍÓÚÑáéíóúñ .&'-]{2,40})/i,
    /(?:pago autom[aá]tico exitoso de tu servicio|pago de tu servicio)\s+(?!afiliado)([A-Z0-9][A-Za-z0-9 ,.&*'-]{2,60})/i,
    /(?:constancia pago de|constancia de pago de)\s+(tarjetas propias|tarjeta de cr[eé]dito)/i,
    /(?:nombre del comercio|comercio)\s*[:]?\s*([A-Z0-9][A-Za-z0-9 ,.&*'-]{2,60})/i,
    /(?:consumo|compra)\s+(?:de|con tu|en).+?(?:en)\s+([A-Z0-9][A-Za-z0-9 ,.&*'-]{2,60})/i,
    /(?:en el comercio|en)\s+([A-Z0-9][A-Za-z0-9 ,.&*'-]{2,40})/,
    /(?:realizaste una compra en|compra en)\s+([A-Z0-9][A-Za-z0-9 ,.&*'-]{2,40})/i,
    /(?:enviaste|envio|envió)\s+(?:un pago de\s+)?(?:\$|USD|S\/)\s*[\d.,]+\s*(?:USD\s*)?(?:a|por)\s+([A-Z0-9][A-Za-z0-9 .&*'-]{3,60})/i,
    /(?:pago de|por el pago de)\s+(intereses(?:\s+y\/o\s+comisiones)?|comisiones)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1])
      return m[1]
        .trim()
        .replace(/\s+(por|de|el)\s*$/i, '')
        .trim();
  }
  return undefined;
}

function extractReference(text: string): string | undefined {
  const m = text.match(/(?:operaci[oó]n|referencia|n[uú]mero de operaci[oó]n|cod(?:igo)?)[:\s#]+([A-Z0-9-]{4,})/i);
  return m?.[1] ?? undefined;
}

function extractRecipient(text: string): string | undefined {
  const patterns = [
    /(?:destinatario|beneficiario|enviado a|nombre del beneficiario)\s*:?\s*([A-Za-z0-9ÁÉÍÓÚÑáéíóúñ*\s.-]{3,60})(?:\n|\*\*\*\*|\d{4}|$)/i,
    /a favor de\s+([A-Za-z0-9ÁÉÍÓÚÑáéíóúñ*\s.-]{3,60})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1])
      return m[1]
        .trim()
        .replace(/\s*\*+\s*$/, '')
        .trim();
  }
  return undefined;
}

function extractDestinationMethod(text: string): string | undefined {
  const m = text.match(/(?:destino|m[eé]todo)\s*:?\s*(Yape|Plin|Pliq|Transferencia)/i);
  if (m?.[1]) {
    const raw = m[1].toLowerCase();
    if (raw === 'yape') return 'Yape';
    if (raw === 'plin' || raw === 'pliq') return 'Plin';
    return m[1];
  }
  return undefined;
}

function baseParse(input: IncomingBankEmail, bankCode: string, bankName: string): ParsedBankTransaction | null {
  const text = `${input.subject}\n${input.textBody}`;
  if (isNonTransactional(text)) return null;
  const amount = extractAmount(text);
  if (!amount || amount === '0') return null;
  const currency = detectCurrency(text) ?? 'PEN';
  const currencyKnown = detectCurrency(text) !== undefined;
  const cardLast4 = extractCardLast4(text);
  const merchant = extractMerchant(text) ?? extractRecipient(text);
  const recipient = extractRecipient(text);
  const destinationMethod = extractDestinationMethod(text);
  const externalReference = extractReference(text);
  const transactionType = classifyType(text);
  const installmentsMatch = text.match(/en\s+(\d+)\s+cuotas/i);
  const installments = installmentsMatch ? Number(installmentsMatch[1]) : undefined;

  const confidence = computeConfidence({
    bank: true,
    amount: true,
    currency: currencyKnown,
    date: true,
    cardLast4: !!cardLast4,
    merchant: !!merchant,
    reference: !!externalReference,
  });

  return {
    bankCode,
    bankName,
    cardLast4,
    merchant,
    amount,
    currency,
    occurredAt: input.receivedAt,
    externalReference,
    installments,
    transactionType,
    confidence,
    recipient,
    destinationMethod,
  };
}

function senderMatches(input: IncomingBankEmail, needles: string[]): boolean {
  const hay = `${input.sender} ${input.subject}`.toLowerCase();
  return needles.some((n) => hay.includes(n));
}

export class BcpEmailParser implements BankEmailParser {
  readonly key = 'bcp';
  readonly bankCode = 'BCP';
  supports(input: IncomingBankEmail): boolean {
    return senderMatches(input, ['bcp', 'viabcp', 'bcpzonasegura', 'credito del peru']);
  }
  parse(input: IncomingBankEmail): ParsedBankTransaction | null {
    return baseParse(input, this.bankCode, 'BCP');
  }
}

export class InterbankEmailParser implements BankEmailParser {
  readonly key = 'interbank';
  readonly bankCode = 'IBK';
  supports(input: IncomingBankEmail): boolean {
    return senderMatches(input, ['interbank', 'ibk', 'interbank.pe']);
  }
  parse(input: IncomingBankEmail): ParsedBankTransaction | null {
    return baseParse(input, this.bankCode, 'Interbank');
  }
}

export class BbvaEmailParser implements BankEmailParser {
  readonly key = 'bbva';
  readonly bankCode = 'BBVA';
  supports(input: IncomingBankEmail): boolean {
    return senderMatches(input, ['bbva', 'continental']);
  }
  parse(input: IncomingBankEmail): ParsedBankTransaction | null {
    return baseParse(input, this.bankCode, 'BBVA');
  }
}

export class GenericBankEmailParser implements BankEmailParser {
  readonly key = 'generic';
  readonly bankCode = 'GENERIC';
  supports(): boolean {
    return true;
  }
  parse(input: IncomingBankEmail): ParsedBankTransaction | null {
    const parsed = baseParse(input, this.bankCode, 'Banco');
    if (!parsed) return null;
    return { ...parsed, confidence: Math.max(0, parsed.confidence - 0.2) };
  }
}

export class AgoraEmailParser implements BankEmailParser {
  readonly key = 'agora';
  readonly bankCode = 'AGORA';
  supports(input: IncomingBankEmail): boolean {
    return senderMatches(input, ['agora', 'operaciones.agora.pe']);
  }
  parse(input: IncomingBankEmail): ParsedBankTransaction | null {
    const text = `${input.subject}\n${input.textBody}`;
    if (isNonTransactional(text)) return null;

    const amount = this.extractAmount(text);
    if (!amount || amount === '0') return null;

    const currency = detectCurrency(text) ?? 'PEN';
    const currencyKnown = detectCurrency(text) !== undefined;
    const recipient = this.extractRecipient(text);
    const externalReference = this.extractReference(text);
    const isInternal = /a mis cuentas/i.test(text);
    const transactionType = isInternal ? 'TRANSFER_SENT' : 'TRANSFER_SENT';
    const destinationMethod = isInternal ? 'Cuentas propias' : 'Terceros';

    const confidence = computeConfidence({
      bank: true,
      amount: true,
      currency: currencyKnown,
      date: true,
      cardLast4: false,
      merchant: !!recipient,
      reference: !!externalReference,
    });

    return {
      bankCode: this.bankCode,
      bankName: 'Agora',
      cardLast4: undefined,
      merchant: recipient,
      amount,
      currency,
      occurredAt: input.receivedAt,
      externalReference,
      installments: undefined,
      transactionType,
      confidence,
      recipient,
      destinationMethod,
    };
  }

  private extractAmount(text: string): string | undefined {
    const m = text.match(/Monto\s*(?:S\/|US\$|\$|USD|PEN)\s*([\d.,]+\d)/i);
    if (m?.[1]) return parseAmount(m[1]);
    return undefined;
  }

  private extractRecipient(text: string): string | undefined {
    const m = text.match(/Destino\s*([A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s.-]{3,80})(?:\n|Interbank|Banco|\d{3}-)/i);
    if (m?.[1]) return m[1].trim();
    return undefined;
  }

  private extractReference(text: string): string | undefined {
    const m = text.match(/(?:Nro\.?\s*de\s*Operaci[oó]n|Operaci[oó]n)\s*(\d+)/i);
    return m?.[1] ?? undefined;
  }
}

export class PaypalEmailParser implements BankEmailParser {
  readonly key = 'paypal';
  readonly bankCode = 'PAYPAL';
  supports(input: IncomingBankEmail): boolean {
    return senderMatches(input, ['paypal', 'service@intl.paypal.com']);
  }
  parse(input: IncomingBankEmail): ParsedBankTransaction | null {
    const text = `${input.subject}\n${input.textBody}`;
    if (isNonTransactional(text)) return null;

    const amount = extractAmount(text);
    if (!amount || amount === '0') return null;

    const currency = detectCurrency(text) ?? 'USD';
    const currencyKnown = detectCurrency(text) !== undefined;
    const merchant = extractMerchant(text) ?? extractRecipient(text);
    const externalReference = extractReference(text) ?? this.extractPaypalReference(text);
    const cardLast4 = extractCardLast4(text);

    const confidence = computeConfidence({
      bank: true,
      amount: true,
      currency: currencyKnown,
      date: true,
      cardLast4: !!cardLast4,
      merchant: !!merchant,
      reference: !!externalReference,
    });

    return {
      bankCode: this.bankCode,
      bankName: 'PayPal',
      cardLast4,
      merchant,
      amount,
      currency,
      occurredAt: input.receivedAt,
      externalReference,
      installments: undefined,
      transactionType: 'TRANSFER_SENT',
      confidence,
      recipient: merchant,
      destinationMethod: 'PayPal',
    };
  }

  private extractPaypalReference(text: string): string | undefined {
    const m = text.match(/Id\.?\s*de\s*transacci[oó]n\s*([A-Z0-9]+)/i);
    return m?.[1] ?? undefined;
  }
}
