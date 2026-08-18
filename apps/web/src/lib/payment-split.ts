interface Reparto {
  salary?: string;
  amountWithDiscount?: string;
  amountReceived?: string;
  amountRetained?: string;
}

const redondear = (n: number) => Math.round(n * 100) / 100;

const num = (v?: string) => {
  const n = Number((v ?? '').toString().replaceAll(',', ''));
  return Number.isFinite(n) ? n : 0;
};

export function calcularReparto(v: Reparto) {
  const base = num(v.amountWithDiscount) || num(v.salary);
  const recibi = num(v.amountReceived);
  const quedo = num(v.amountRetained);
  const repartido = redondear(recibi + quedo);
  return {
    base,
    recibi,
    quedo,
    repartido,
    porRepartir: redondear(base - repartido),
    descuento: num(v.salary) - num(v.amountWithDiscount),
    pctRecibi: base > 0 ? (recibi / base) * 100 : 0,
  };
}

export function completarDesde(v: Reparto, lado: 'received' | 'retained'): string {
  const { base, recibi, quedo } = calcularReparto(v);
  const faltante = lado === 'received' ? base - quedo : base - recibi;
  return faltante > 0 ? faltante.toFixed(2) : '0.00';
}

export function repartirPorPorcentaje(v: Reparto, pct: number): { recibi: string; quedo: string } {
  const { base } = calcularReparto(v);
  const recibi = redondear((base * pct) / 100);
  return { recibi: recibi.toFixed(2), quedo: redondear(base - recibi).toFixed(2) };
}

const TOLERANCIA = 0.011;

export function cuadraReparto(v: Reparto): boolean {
  const { porRepartir } = calcularReparto(v);
  return Math.abs(porRepartir) <= TOLERANCIA;
}

export function avisoReparto(v: Reparto): string | null {
  const { base, repartido, porRepartir } = calcularReparto(v);
  if (base <= 0 || repartido <= 0) return null;
  if (Math.abs(porRepartir) <= TOLERANCIA) return null;
  if (porRepartir > 0) return `Faltan S/ ${porRepartir.toFixed(2)} por repartir.`;
  return `Te pasaste S/ ${Math.abs(porRepartir).toFixed(2)} sobre lo que llega.`;
}

export function esPagoExcepcional(tipo?: string | null): boolean {
  const t = (tipo ?? '').trim().toLowerCase();
  if (!t) return false;
  return t !== 'mensual' && t !== 'sueldo';
}
