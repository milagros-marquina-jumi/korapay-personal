export type BankTransactionType =
  | 'CARD_PURCHASE'
  | 'ONLINE_PURCHASE'
  | 'CASH_WITHDRAWAL'
  | 'TRANSFER_SENT'
  | 'TRANSFER_RECEIVED'
  | 'SERVICE_PAYMENT'
  | 'SUBSCRIPTION'
  | 'REFUND'
  | 'REVERSAL'
  | 'DECLINED_TRANSACTION'
  | 'INSTALLMENT_PURCHASE';

export interface IncomingBankEmail {
  sender: string;
  subject: string;
  receivedAt: Date;
  textBody: string;
}

export interface ParsedBankTransaction {
  bankCode: string;
  bankName: string;
  cardLast4?: string;
  merchant?: string;
  amount: string;
  currency: 'PEN' | 'USD';
  occurredAt: Date;
  externalReference?: string;
  installments?: number;
  transactionType: BankTransactionType;
  confidence: number;
  recipient?: string;
  destinationMethod?: string;
}

export interface BankEmailParser {
  readonly key: string;
  readonly bankCode: string;
  supports(input: IncomingBankEmail): boolean;
  parse(input: IncomingBankEmail): ParsedBankTransaction | null;
}
