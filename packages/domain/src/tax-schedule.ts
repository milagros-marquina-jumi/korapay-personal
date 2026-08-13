export interface ParsedScheduleRow {
  number: number;
  dueDate: string | null;
  principalAmount: string;
  interestAmount: string;
  total: string;
}

export interface ParsedSchedule {
  rows: ParsedScheduleRow[];
  warnings: string[];
}

const FECHA = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
const MONTO = /^-?[\d.,]+$/;

function esMonto(token: string): boolean {
  return MONTO.test(token) && /\d/.test(token);
}

function aNumero(token: string): string {
  let t = token.trim();
  const ultimaComa = t.lastIndexOf(',');
  const ultimoPunto = t.lastIndexOf('.');
  if (ultimaComa > ultimoPunto) {
    t = t.replaceAll('.', '').replace(',', '.');
  } else {
    t = t.replaceAll(',', '');
  }
  const n = Number(t);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

function aIso(token: string): string | null {
  const m = FECHA.exec(token.trim());
  if (!m) return null;
  const d = m[1] ?? '';
  const mes = m[2] ?? '';
  const anio = m[3] ?? '';
  if (!d || !mes || !anio) return null;
  return `${anio}-${mes.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function esInicioDeCuota(tokens: string[], i: number): boolean {
  const numero = Number(tokens[i]);
  if (!Number.isInteger(numero) || numero < 1 || numero > 999) return false;
  const siguiente = tokens[i + 1];
  return !!siguiente && !!aIso(siguiente);
}

function montosDeLaCuota(tokens: string[], desde: number): { montos: string[]; fin: number } {
  const montos: string[] = [];
  let j = desde;
  while (j < tokens.length && montos.length < 4 && esMonto(tokens[j] as string)) {
    if (esInicioDeCuota(tokens, j)) break;
    montos.push(tokens[j] as string);
    j += 1;
  }
  return { montos, fin: j };
}

function elegirMontos(montos: string[]): { principal: string; interes: string; total: string } {
  const n = montos.map((m) => aNumero(m));
  const principal = n[0] as string;
  const interes = n[1] as string;
  const esperado = (Number(principal) + Number(interes)).toFixed(2);

  const total = n.slice(2).find((m) => m === esperado) ?? n[2] ?? esperado;
  return { principal, interes, total };
}

export function parseTaxSchedule(texto: string): ParsedSchedule {
  const warnings: string[] = [];
  const tokens = texto
    .split(/[\s|]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const rows: ParsedScheduleRow[] = [];
  let i = 0;

  while (i < tokens.length) {
    if (!esInicioDeCuota(tokens, i)) {
      i += 1;
      continue;
    }

    const numero = Number(tokens[i]);
    const fecha = aIso(tokens[i + 1] as string) as string;
    const { montos, fin } = montosDeLaCuota(tokens, i + 2);

    if (montos.length < 2) {
      warnings.push(`Cuota ${numero}: le faltan montos, quedó incompleta al copiar.`);
      i = fin > i ? fin : i + 1;
      continue;
    }

    const { principal, interes, total } = elegirMontos(montos);
    rows.push({ number: numero, dueDate: fecha, principalAmount: principal, interestAmount: interes, total });
    i = fin;
  }

  if (!rows.length) {
    warnings.push('No se reconoció ninguna cuota. Copia las filas del cuadro de tu resolución de SUNAT.');
    return { rows, warnings };
  }

  rows.sort((a, b) => a.number - b.number);

  const duplicadas = rows.filter((r, idx) => idx > 0 && r.number === rows[idx - 1]?.number);
  if (duplicadas.length) warnings.push(`Hay cuotas repetidas: ${duplicadas.map((d) => d.number).join(', ')}.`);

  for (const r of rows) {
    const suma = (Number(r.principalAmount) + Number(r.interestAmount)).toFixed(2);
    if (r.total !== '0.00' && suma !== r.total) {
      warnings.push(`Cuota ${r.number}: deuda + interés (${suma}) no cuadra con el total (${r.total}).`);
    }
  }

  return { rows, warnings };
}

export function scheduleTotals(rows: ParsedScheduleRow[]): {
  principal: string;
  interest: string;
  total: string;
  surchargePct: string;
} {
  const principal = rows.reduce((s, r) => s + Number(r.principalAmount), 0);
  const interest = rows.reduce((s, r) => s + Number(r.interestAmount), 0);
  return {
    principal: principal.toFixed(2),
    interest: interest.toFixed(2),
    total: (principal + interest).toFixed(2),
    surchargePct: principal > 0 ? ((interest / principal) * 100).toFixed(2) : '0.00',
  };
}
