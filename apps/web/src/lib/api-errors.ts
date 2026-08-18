const CAMPOS: Record<string, string> = {
  rate: 'el sueldo',
  salary: 'el sueldo',
  startDate: 'la fecha de inicio',
  endDate: 'la fecha de fin',
  date: 'la fecha',
  dueDate: 'la fecha de vencimiento',
  amount: 'el monto',
  amountGross: 'el monto bruto',
  amountReceived: 'el monto recibido',
  amountRetained: 'el monto del talento',
  amountWithDiscount: 'el monto con descuento',
  paidAmount: 'el monto pagado',
  debtAmount: 'el monto de la deuda',
  pendingAmount: 'el monto pendiente',
  exchangeRate: 'el tipo de cambio',
  email: 'el correo',
  name: 'el nombre',
  companyName: 'la empresa',
  clientName: 'el cliente',
  position: 'el cargo',
  status: 'el estado',
  paymentType: 'el tipo de pago',
  currency: 'la moneda',
};

const REGLAS: { patron: RegExp; mensaje: (campo: string, extra?: string) => string }[] = [
  { patron: /must be a number string$/, mensaje: (c) => `Indica ${c} con un número válido.` },
  { patron: /must be a valid ISO 8601 date string$/, mensaje: (c) => `Indica ${c} con un formato válido.` },
  { patron: /should not be empty$/, mensaje: (c) => `Falta ${c}.` },
  { patron: /must be a string$/, mensaje: (c) => `Revisa ${c}.` },
  { patron: /must be an email$/, mensaje: (c) => `Indica ${c} con un formato válido.` },
  {
    patron: /must be one of the following values: (.+)$/,
    mensaje: (c, extra) => `Elige un valor válido para ${c}${extra ? ` (${extra})` : ''}.`,
  },
];

export function traducirErrorApi(raw: string): string {
  const campos = Object.keys(CAMPOS).join('|');
  const partes = raw
    .split(new RegExp(String.raw`,\s+(?=(?:${campos})\s)`))
    .map((p) => traducirUno(p.trim()))
    .filter(Boolean);
  return partes.length ? [...new Set(partes)].join(' ') : raw;
}

function traducirUno(mensaje: string): string {
  const campoRaw = mensaje.split(' ')[0] ?? '';
  const campo = CAMPOS[campoRaw];
  if (!campo) return mensaje;
  for (const regla of REGLAS) {
    const m = regla.patron.exec(mensaje);
    if (m) return regla.mensaje(campo, m[1]);
  }
  return mensaje;
}
