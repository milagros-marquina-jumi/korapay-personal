export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? '';
}

export function monthLabel(year: number, month: number): string {
  return `${monthName(month)} ${year}`;
}
