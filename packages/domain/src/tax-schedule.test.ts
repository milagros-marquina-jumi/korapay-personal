import { describe, expect, it } from 'vitest';
import { parseTaxSchedule, scheduleTotals } from './tax-schedule';

// Cronograma real de la Resolucion 0230174078150 (Anexo N.º 2).
const PDF = `Cuota
Saldo
N°
Vencimiento
Amortización
Interés
Total
1
31/07/2025
1,419.00
144.00
1,563.00
16,289.00
2
29/08/2025
1,429.00
117.00
1,546.00
14,860.00
3
30/09/2025
1,439.00
107.00
1,546.00
13,421.00 `;

const TABS = `1\t31/07/2025\t1,419.00\t144.00\t1,563.00\t16,289.00
2\t29/08/2025\t1,429.00\t117.00\t1,546.00\t14,860.00
3\t30/09/2025\t1,439.00\t107.00\t1,546.00\t13,421.00`;

const MARKDOWN = `| 1 | 31/07/2025 | 1,419.00 | 144.00 | 1,563.00 | 16,289.00 |
| 2 | 29/08/2025 | 1,429.00 | 117.00 | 1,546.00 | 14,860.00 |
| 3 | 30/09/2025 | 1,439.00 | 107.00 | 1,546.00 | 13,421.00 |`;

const ESPACIOS = `1   31/07/2025   1,419.00   144.00   1,563.00   16,289.00
2   29/08/2025   1,429.00   117.00   1,546.00   14,860.00
3   30/09/2025   1,439.00   107.00   1,546.00   13,421.00`;

// Copiado del visor de PDF: una cuota por linea, columnas con UN solo espacio
// y la cabecera/notas del anexo delante.
const UN_ESPACIO = `ANEXO N.° 2: CRONOGRAMA
Página: 4/4
Nota: El pago de las cuotas mensuales podrá efectuarse con NPS o mediante Formulario1662, en cuyo caso, deberá indicarse el
número de la resolución aprobatoria N° 0230174078150 y el código de tributo 8021.
Cuota Saldo N° Vencimiento Amortización Interés Total
1 31/07/2025 1,419.00 144.00 1,563.00 16,289.00
2 29/08/2025 1,429.00 117.00 1,546.00 14,860.00
3 30/09/2025 1,439.00 107.00 1,546.00 13,421.00 `;

describe('parseTaxSchedule', () => {
  it('lee el cronograma con columnas separadas por un solo espacio', () => {
    const { rows, warnings } = parseTaxSchedule(UN_ESPACIO);
    expect(rows).toHaveLength(3);
    expect(warnings).toHaveLength(0);
    expect(rows[0]).toEqual({
      number: 1,
      dueDate: '2025-07-31',
      principalAmount: '1419.00',
      interestAmount: '144.00',
      total: '1563.00',
    });
  });

  it('no confunde el saldo con el total', () => {
    const { rows } = parseTaxSchedule(UN_ESPACIO);
    expect(rows.map((r) => r.total)).toEqual(['1563.00', '1546.00', '1546.00']);
  });

  it('ignora la cabecera y las notas del anexo', () => {
    const { rows } = parseTaxSchedule(UN_ESPACIO);
    expect(rows.map((r) => r.number)).toEqual([1, 2, 3]);
  });

  it.each([
    ['PDF', PDF],
    ['tabs', TABS],
    ['markdown', MARKDOWN],
    ['espacios', ESPACIOS],
  ])('lee el cronograma pegado desde %s', (_nombre, texto) => {
    const { rows } = parseTaxSchedule(texto);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      number: 1,
      dueDate: '2025-07-31',
      principalAmount: '1419.00',
      interestAmount: '144.00',
      total: '1563.00',
    });
    expect(rows[2]?.dueDate).toBe('2025-09-30');
    expect(rows[2]?.principalAmount).toBe('1439.00');
  });

  it('ignora la columna de saldo y no la confunde con otra cuota', () => {
    const { rows, warnings } = parseTaxSchedule(TABS);
    expect(rows.map((r) => r.number)).toEqual([1, 2, 3]);
    expect(warnings).toHaveLength(0);
  });

  it('acepta el formato europeo 1.419,00', () => {
    const { rows } = parseTaxSchedule('1\t31/07/2025\t1.419,00\t144,00\t1.563,00');
    expect(rows[0]?.principalAmount).toBe('1419.00');
    expect(rows[0]?.interestAmount).toBe('144.00');
  });

  it('avisa cuando amortizacion + interes no cuadra con el total', () => {
    const { warnings } = parseTaxSchedule('1\t31/07/2025\t1,419.00\t144.00\t9,999.00');
    expect(warnings.some((w) => w.includes('no cuadra'))).toBe(true);
  });

  it('avisa cuando no reconoce nada', () => {
    const { rows, warnings } = parseTaxSchedule('esto no es un cronograma');
    expect(rows).toHaveLength(0);
    expect(warnings[0]).toContain('No se reconoció');
  });

  it('calcula los totales del fraccionamiento', () => {
    const { rows } = parseTaxSchedule(TABS);
    const t = scheduleTotals(rows);
    expect(t.principal).toBe('4287.00');
    expect(t.interest).toBe('368.00');
    expect(t.total).toBe('4655.00');
  });
});
