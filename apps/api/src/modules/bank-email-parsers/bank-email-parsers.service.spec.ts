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

  it('extracts merchant with comma (GITHUB, INC.)', () => {
    const r = svc.parse(
      email({
        sender: 'BBVA <procesos@bbva.com.pe>',
        subject: 'Has realizado un consumo con tu tarjeta BBVA',
        textBody: `Hola, MILAGROS
Has realizado el siguiente consumo:
Comercio: GITHUB, INC.
Monto: 39.00
Moneda: USD
Fecha: 05/08/2026
Hora: 14:57:25
Este se cargara a tu tarjeta terminada en *3556`,
      }),
    );
    expect(r?.parserKey).toBe('bbva');
    expect(r?.parsed.transactionType).toBe('CARD_PURCHASE');
    expect(r?.parsed.merchant).toBe('GITHUB, INC.');
  });

  it('parses Interbank Constancia de Pago (debit card purchase)', () => {
    const r = svc.parse(
      email({
        sender: 'Interbank Servicio al Cliente <servicioalcliente@netinterbank.com.pe>',
        subject: 'Constancia de Pago',
        textBody: `Hola MILAGROS, te enviamos tu Constancia de Pago
Codigo de operacion 9101093481
Fecha y hora 17 Jun 2026 10:50 PM
Medio de pago Debito Clasica 421355******0334
Comercio CULQI QR*TERRAZA 360
Moneda y monto S/ 113.80
En Interbank, nunca te pediremos: Tu clave, numero de tarjeta y/o cuenta, codigo CVV, codigo de seguridad para concretar transacciones ni la devolucion de tu tarjeta`,
      }),
    );
    expect(r?.parserKey).toBe('interbank');
    expect(r?.parsed.amount).toBe('113.80');
    expect(r?.parsed.currency).toBe('PEN');
    expect(r?.parsed.cardLast4).toBe('0334');
    expect(r?.parsed.transactionType).toBe('CARD_PURCHASE');
    expect(r?.parsed.merchant).toBe('CULQI QR*TERRAZA 360');
  });

  it('extracts BCP refund with merchant and classifies as REFUND', () => {
    const r = svc.parse(
      email({
        sender: 'BCP Notificaciones <notificaciones@notificacionesbcp.com.pe>',
        subject: 'Realizamos una devolucion de una operacion a tu Tarjeta de Debito BCP',
        textBody: `Hola Milagros Julisa,
Se ha devuelto el monto de S/ 30.00 a tu cuenta BCP.
Monto Total devuelto S/ 30.00
Numero de Tarjeta ************7387
Nombre del Comercio PLIN-RENE RIVAS
Numero de operacion 844719
El BCP nunca te solicitara datos confidenciales por correo, tales como tu clave secreta de cajero de 4 digitos, clave de internet de 6 digitos`,
      }),
    );
    expect(r?.parserKey).toBe('bcp');
    expect(r?.parsed.amount).toBe('30.00');
    expect(r?.parsed.cardLast4).toBe('7387');
    expect(r?.parsed.transactionType).toBe('REFUND');
    expect(r?.parsed.merchant).toBe('PLIN-RENE RIVAS');
  });

  it('extracts BCP transfer recipient via "Enviado a"', () => {
    const r = svc.parse(
      email({
        sender: 'BCP Notificaciones <notificaciones@notificacionesbcp.com.pe>',
        subject: 'Constancia de Transferencia a Terceros BCP',
        textBody: `Hola Milagros Julisa,
Realizaste una transferencia de S/ 30.00 desde tu Clasica.
Monto transferido S/ 30.00
Enviado a Rivas Valenzuela Rene O. **** 4063
Desde Clasica **** 8010
El BCP nunca te solicitara datos confidenciales por correo, tales como tu clave secreta de cajero`,
      }),
    );
    expect(r?.parserKey).toBe('bcp');
    expect(r?.parsed.amount).toBe('30.00');
    expect(r?.parsed.cardLast4).toBe('4063');
    expect(r?.parsed.transactionType).toBe('TRANSFER_SENT');
    expect(r?.parsed.recipient).toContain('Rivas Valenzuela');
  });

  it('extracts BBVA transfer recipient via "Nombre del beneficiario"', () => {
    const r = svc.parse(
      email({
        sender: 'BBVA <procesos@bbva.com.pe>',
        subject: 'BBVA - Constancia Transf. Interbancaria',
        textBody: `Hola, Milagros
Has realizado con exito la operacion: Transferencia interbancaria
Importe transferido S/ 4000.00
Cuenta de origen Contiahorro
Cuenta de destino * 4943
Banco de destino INTERBANK
Nombre del beneficiario Jack Alexander Jimenez Huerta
Recuerda que, por ningun medio de comunicacion ni por ningun motivo, te pediremos tus datos confidenciales, tales como clave de cajero`,
      }),
    );
    expect(r?.parserKey).toBe('bbva');
    expect(r?.parsed.amount).toBe('4000.00');
    expect(r?.parsed.cardLast4).toBe('4943');
    expect(r?.parsed.transactionType).toBe('TRANSFER_SENT');
    expect(r?.parsed.recipient).toContain('Jack Alexander');
  });

  it('classifies BBVA Pago de Tarjetas propias as TRANSFER_SENT', () => {
    const r = svc.parse(
      email({
        sender: 'BBVA <procesos@bbva.com.pe>',
        subject: 'BBVA - Constancia Pago de Tarjetas propias',
        textBody: `Hola MILAGROS,
Pago de Tarjetas propias
Importe pagado S/ 500.00
Cuenta de origen Cuenta Simple Soles
Cuenta de destino Tarjeta de Credito *4239`,
      }),
    );
    expect(r?.parserKey).toBe('bbva');
    expect(r?.parsed.amount).toBe('500.00');
    expect(r?.parsed.transactionType).toBe('TRANSFER_SENT');
    expect(r?.parsed.merchant).toBe('Tarjetas propias');
  });

  it('classifies failed automatic payment as DECLINED_TRANSACTION', () => {
    const r = svc.parse(
      email({
        sender: 'BCP Notificaciones <notificaciones@notificacionesbcp.com.pe>',
        subject: 'Hay problemas para realizar el pago automatico de tu servicio MOVISTAR-INTEGRATEL PERU',
        textBody: `Hola Milagros Julisa,
Ocurrio un error al realizar el Pago Automatico de tu servicio favorito.
No se pudo realizar el pago por S/ 24.00, debido a que no cuentas con saldo suficiente.
Servicio 3 MOVISTAR MOVIL
Empresa MOVISTAR-INTEGRATEL PERU
N* de cuenta o tarjeta **** 8010
El BCP nunca te solicitara datos confidenciales, tales como tu clave secreta de cajero`,
      }),
    );
    expect(r?.parserKey).toBe('bcp');
    expect(r?.parsed.amount).toBe('24.00');
    expect(r?.parsed.transactionType).toBe('DECLINED_TRANSACTION');
  });

  it('classifies Yape received as TRANSFER_RECEIVED', () => {
    const r = svc.parse(
      email({
        sender: 'BCP <notificaciones@bcp.com.pe>',
        subject: 'Recibiste un Yape',
        textBody: `Hola Milagros,
Recibiste un Yape de S/ 50.00 de Juan Perez
Numero de operacion 123456`,
      }),
    );
    expect(r?.parserKey).toBe('bcp');
    expect(r?.parsed.amount).toBe('50.00');
    expect(r?.parsed.transactionType).toBe('TRANSFER_RECEIVED');
  });

  it('returns null for non-transactional email (OTP)', () => {
    const r = svc.parse(
      email({
        sender: 'BCP <notificaciones@bcp.com.pe>',
        subject: 'Tu codigo de verificacion es 123456',
        textBody: 'Usa este codigo para confirmar tu identidad: 123456',
      }),
    );
    expect(r).toBeNull();
  });

  it('returns null for non-transactional email (estado de cuenta)', () => {
    const r = svc.parse(
      email({
        sender: 'BBVA <procesos@bbva.com.pe>',
        subject: 'Tu estado de cuenta esta disponible',
        textBody: 'MILAGROS JULISA, tu estado de cuenta disponible para consulta.',
      }),
    );
    expect(r).toBeNull();
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
