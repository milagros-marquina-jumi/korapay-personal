import type { PersonalReports } from '@/lib/api.types';
import { MONTH_NAMES } from '@/lib/months';

export const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

export const TOP_CATEGORIES = 10;

export const DURATION_LIMITS = [
  { value: '5', label: 'Top 5' },
  { value: '10', label: 'Top 10' },
  { value: '25', label: 'Top 25' },
];

export function buildCategoryHeatmap(yearly: PersonalReports['yearlyByCategory'] | undefined) {
  if (!yearly?.length) return null;

  const totals = new Map<string, number>();
  for (const y of yearly) {
    for (const c of y.categories) totals.set(c.name, (totals.get(c.name) ?? 0) + Number(c.total));
  }
  const columns = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_CATEGORIES)
    .map(([name]) => name);

  if (!columns.length) return null;

  const rows = yearly.map((y) => {
    const byName = new Map(y.categories.map((c) => [c.name, Number(c.total)]));
    const values = columns.map((name) => byName.get(name) ?? 0);
    return {
      key: String(y.year),
      label: y.year,
      values,
      total: y.categories.reduce((sum, c) => sum + Number(c.total), 0),
    };
  });

  return { columns, rows };
}
