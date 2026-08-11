export const CHART_CATEGORICAL = [
  '#2a78d6',
  '#008300',
  '#e87ba4',
  '#eda100',
  '#1baf7a',
  '#eb6834',
  '#4a3aa7',
  '#e34948',
] as const;

export const CHART_CATEGORICAL_DARK = [
  '#3987e5',
  '#008300',
  '#d55181',
  '#c98500',
  '#199e70',
  '#d95926',
  '#9085e9',
  '#e66767',
] as const;

export const INCOME_COLOR = '#008300';
export const EXPENSE_COLOR = '#e34948';

export function categoricalColor(index: number, isDark = false): string {
  const palette = isDark ? CHART_CATEGORICAL_DARK : CHART_CATEGORICAL;
  return palette[index % palette.length] ?? palette[0];
}

export function compactAmount(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return String(value);
}
