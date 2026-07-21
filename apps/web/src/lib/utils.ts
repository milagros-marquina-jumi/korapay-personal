import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date): string {
  const d = new Date(value);
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatMonthYear(value: string | Date): string {
  const d = new Date(value);
  const month = new Intl.DateTimeFormat('es-PE', { timeZone: 'UTC', month: 'long' }).format(d);
  const year = new Intl.DateTimeFormat('es-PE', { timeZone: 'UTC', year: 'numeric' }).format(d);
  return `${month}/${year}`;
}

export function formatDateLong(value: string | Date): string {
  const d = new Date(value);
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}
