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

export const MONTH_OPTIONS = MONTH_NAMES.map((label, index) => ({
  value: String(index + 1),
  label,
}));

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? '';
}

export function monthLabel(year: number, month: number): string {
  return `${monthName(month)} ${year}`;
}
