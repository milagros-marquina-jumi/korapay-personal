import { BankEmailParsersService } from './bank-email-parsers.service';
import { buildFingerprint, normalizeMerchant } from './parser.utils';

const svc = new BankEmailParsersService();

function email(over: Partial<{ sender: string; subject: string; textBody: string }>) {
  return {
    sender: over.sender ?? 'BCP <notificaciones@notificacionesbcp.com.pe>',
    subject: over.subject ?? 'Compra',
    receivedAt: new Date('2026-07-20T14:31:00-05:00'),
    textBody: over.textBody ?? '',
  };
}

describe('BankEmailParsersService', () => {
  it('parses a BCP PEN purchase', () => {
    const r = svc.parse(email({ textBody: 'Compra en PLAZA VEA por S/ 89.90 con tu tarjeta terminada en 4589' }));
    expect(r?.parserKey).toBe('bcp');
    expect(r?.parsed.amount).toBe('89.90');
    expect(r?.parsed.currency).toBe('PEN');
    expect(r?.parsed.cardLast4).toBe('4589');
    expect(r?.parsed.transactionType).toBe('CARD_PURCHASE');
  });

  it('parses a USD purchase', () => {
    const r = svc.parse(email({ textBody: 'Compra en OPENAI por US$ 20.00 con tu tarjeta terminada en 4589' }));
    expect(r?.parsed.currency).toBe('USD');
    expect(r?.parsed.amount).toBe('20.00');
  });

  it('classifies a declined transaction', () => {
    const r = svc.parse(
      email({
        sender: 'Interbank',
        subject: 'Operacion rechazada',
        textBody: 'Tu operacion por S/ 500.00 fue rechazada',
      }),
    );
    expect(r?.parsed.transactionType).toBe('DECLINED_TRANSACTION');
  });

  it('classifies a refund', () => {
    const r = svc.parse(email({ subject: 'Devolucion', textBody: 'Se proceso una devolucion por S/ 89.90' }));
    expect(r?.parsed.transactionType).toBe('REFUND');
  });

  it('routes unknown sender to generic parser with lower confidence', () => {
    const r = svc.parse(email({ sender: 'Banco X <x@x.com>', textBody: 'Compra por S/ 10.00' }));
    expect(r?.parserKey).toBe('generic');
    expect(r?.parsed.confidence).toBeLessThan(0.85);
  });

  it('returns null when no amount is present', () => {
    const r = svc.parse(email({ textBody: 'Hola, este correo no tiene monto' }));
    expect(r).toBeNull();
  });
});

describe('parser utils', () => {
  it('normalizes merchant', () => {
    expect(normalizeMerchant('Plaza Vea  #123!')).toBe('PLAZA VEA 123');
  });

  it('fingerprint is stable for the same purchase and differs by amount', () => {
    const base = {
      bankCode: 'BCP',
      cardLast4: '4589',
      merchantNormalized: 'PLAZA VEA',
      amount: '89.90',
      currency: 'PEN',
      occurredAt: new Date('2026-07-20T14:31:20-05:00'),
      externalReference: 'ABC12345',
    };
    const a = buildFingerprint(base);
    const b = buildFingerprint({ ...base, occurredAt: new Date('2026-07-20T14:31:50-05:00') });
    const c = buildFingerprint({ ...base, amount: '90.00' });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
