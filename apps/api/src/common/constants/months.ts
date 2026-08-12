import { MONTH_NAMES } from '@korapay/domain';

export { MONTH_NAMES };

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? '';
}

export function monthLabel(year: number, month: number): string {
  return `${monthName(month)} ${year}`;
}
