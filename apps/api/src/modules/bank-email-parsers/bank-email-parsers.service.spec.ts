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

  it('classifies Interbank transferencia as TRANSFER_SENT', () => {
    const r = svc.parse(
      email({
        sender: 'Interbank Servicio al Cliente <servicioalcliente@netinterbank.com.pe>',
        subject: 'Constancia de transferencia',
        textBody: `Hola MILAGROS, te enviamos tu Constancia de transferencia
Codigo de operacion 00487915
Fecha y hora 25 Jul 2026 1:51 PM
Cuenta cargo Cuenta Simple Soles 376 3205752880
Destinatario JIMENEZ HU*** JA*** AL*** 8983202581449
Moneda y monto S/ 500.00
En Interbank, nunca te pediremos: Tu clave, numero de tarjeta y/o cuenta, codigo CVV, codigo de seguridad para concretar transacciones ni la devolucion de tu tarjeta, mediante ningun correo`,
      }),
    );
    expect(r?.parserKey).toBe('interbank');
    expect(r?.parsed.amount).toBe('500.00');
    expect(r?.parsed.currency).toBe('PEN');
    expect(r?.parsed.transactionType).toBe('TRANSFER_SENT');
    expect(r?.parsed.recipient).toContain('JIMENEZ');
  });

  it('classifies Interbank USD transferencia as TRANSFER_SENT', () => {
    const r = svc.parse(
      email({
        sender: 'Interbank Servicio al Cliente <servicioalcliente@netinterbank.com.pe>',
        subject: 'Constancia de transferencia',
        textBody: `Hola MILAGROS, te enviamos tu Constancia de transferencia
Codigo de operacion 00459297
Tipo de cambio Venta 3.539
Cuenta cargo Cuenta Simple Soles 376 3205752880
Cuenta destino Cuenta Simple Dolares 8983406591086
Moneda y monto US$ 6,821.00`,
      }),
    );
    expect(r?.parserKey).toBe('interbank');
    expect(r?.parsed.amount).toBe('6821.00');
    expect(r?.parsed.currency).toBe('USD');
    expect(r?.parsed.transactionType).toBe('TRANSFER_SENT');
  });

  it('classifies BBVA comprobante electronico as SERVICE_PAYMENT', () => {
    const r = svc.parse(
      email({
        sender: 'Procesos BBVA <procesos@bbva.com.pe>',
        subject: 'BBVA - Envio de Comprobante de Documento Electronico BF29-29004876',
        textBody: `Hola MILAGROS JULISA MARQUINA MORA,
Este es tu comprobante electronico por el pago de intereses y/o comisiones que realizaste
Tipo de comprobante: BOLETA DE VENTA ELECTRONICA
Numero: BF29-29004876
Monto: PEN 5.80
Fecha de Emision: 2026-07-31`,
      }),
    );
    expect(r?.parserKey).toBe('bbva');
    expect(r?.parsed.amount).toBe('5.80');
    expect(r?.parsed.currency).toBe('PEN');
    expect(r?.parsed.transactionType).toBe('SERVICE_PAYMENT');
    expect(r?.parsed.merchant).toContain('intereses');
  });

  it('classifies BBVA card purchase as CARD_PURCHASE not CASH_WITHDRAWAL', () => {
    const r = svc.parse(
      email({
        sender: 'BBVA <procesos@bbva.com.pe>',
        subject: 'Has realizado un consumo con tu tarjeta BBVA',
        textBody: `Hola, MILAGROS
Has realizado el siguiente consumo:
Comercio: PedidosYa*Plus
Monto: 16.90
Moneda: PEN
Fecha: 10/08/2026
Hora: 08:25:22
Este se cargara a tu tarjeta terminada en *4239
Por tu seguridad, BBVA te informa: Nunca solicitaremos tus datos confidenciales por correo, tales como la clave SMS de Internet, clave de cajero, DNI o tu numero de celular.`,
      }),
    );
    expect(r?.parserKey).toBe('bbva');
    expect(r?.parsed.transactionType).toBe('CARD_PURCHASE');
    expect(r?.parsed.merchant).toBe('PedidosYa*Plus');
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
