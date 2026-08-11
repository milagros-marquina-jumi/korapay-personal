import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function todayLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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

export function monthsBetween(from: string | Date, to?: string | Date | null): number {
  const start = new Date(from);
  const end = to ? new Date(to) : new Date();
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  if (end.getUTCDate() < start.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

export function formatDuration(from?: string | Date | null, to?: string | Date | null): string {
  if (!from) return '—';
  const total = monthsBetween(from, to);
  const years = Math.floor(total / 12);
  const months = total % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
  parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
  return parts.join(' ');
}
