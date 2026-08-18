interface Reparto {
  salary?: string;
  amountWithDiscount?: string;
  amountReceived?: string;
  amountRetained?: string;
}

const num = (v?: string) => {
  const n = Number((v ?? '').toString().replaceAll(',', ''));
  return Number.isFinite(n) ? n : 0;
};

/** Lo que factura el cliente se reparte entre MIMOTECH y el talento. */
export function calcularReparto(v: Reparto) {
  const base = num(v.amountWithDiscount) || num(v.salary);
  const recibi = num(v.amountReceived);
  const quedo = num(v.amountRetained);
  const repartido = recibi + quedo;
  return {
    base,
    recibi,
    quedo,
    repartido,
    porRepartir: base - repartido,
    descuento: num(v.salary) - num(v.amountWithDiscount),
    pctRecibi: base > 0 ? (recibi / base) * 100 : 0,
  };
}

/** Completa el lado que falta para que los dos montos sumen la base. */
export function completarDesde(v: Reparto, lado: 'received' | 'retained'): string {
  const { base, recibi, quedo } = calcularReparto(v);
  const faltante = lado === 'received' ? base - quedo : base - recibi;
  return faltante > 0 ? faltante.toFixed(2) : '0.00';
}

/** Reparte la base aplicando un porcentaje para MIMOTECH. */
export function repartirPorPorcentaje(v: Reparto, pct: number): { recibi: string; quedo: string } {
  const { base } = calcularReparto(v);
  const recibi = (base * pct) / 100;
  return { recibi: recibi.toFixed(2), quedo: (base - recibi).toFixed(2) };
}

export function avisoReparto(v: Reparto): string | null {
  const { base, repartido, porRepartir } = calcularReparto(v);
  if (base <= 0 || repartido <= 0) return null;
  if (Math.abs(porRepartir) < 0.01) return null;
  if (porRepartir > 0) return `Faltan S/ ${porRepartir.toFixed(2)} por repartir.`;
  return `Te pasaste S/ ${Math.abs(porRepartir).toFixed(2)} sobre lo que llega.`;
}

/**
 * El pago rutinario del mes no necesita destacarse; lo excepcional (CTS,
 * gratificacion, liquidacion) si, porque altera los totales del periodo.
 */
export function esPagoExcepcional(tipo?: string | null): boolean {
  const t = (tipo ?? '').trim().toLowerCase();
  if (!t) return false;
  return t !== 'mensual' && t !== 'sueldo';
}
