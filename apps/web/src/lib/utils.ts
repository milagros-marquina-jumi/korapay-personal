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

export function formatDateTime(value: string | Date): string {
  const d = new Date(value);
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
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

function formatYmd(years: number, months: number, days: number): string {
  const parts = [
    `${years} ${years === 1 ? 'año' : 'años'}`,
    `${months} ${months === 1 ? 'mes' : 'meses'}`,
    `${days} ${days === 1 ? 'día' : 'días'}`,
  ];
  return `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}`;
}

export function formatYmdCompact(years: number, months: number, days: number): string {
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'año' : 'años'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
  if (days > 0) parts.push(`${days} ${days === 1 ? 'día' : 'días'}`);
  if (!parts.length) return '1 día';
  if (parts.length === 1) return parts[0] as string;
  return `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}`;
}

export function durationParts(from: string | Date, to?: string | Date | null): [number, number, number] {
  const start = new Date(from);
  const end = to ? new Date(to) : new Date();
  if (end < start) return [0, 0, 0];

  let years = end.getUTCFullYear() - start.getUTCFullYear();
  let months = end.getUTCMonth() - start.getUTCMonth();
  let days = end.getUTCDate() - start.getUTCDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0));
    days += prevMonth.getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return [years, months, days];
}

export function formatDurationExact(from?: string | Date | null, to?: string | Date | null): string {
  if (!from) return '—';
  const [y, m, d] = durationParts(from, to);
  return formatYmdCompact(y, m, d);
}

export function formatDurationRange(from: string | Date, to?: string | Date | null): string {
  const [years, months, days] = durationParts(from, to);
  return formatYmd(years, months, days);
}

export function formatDurationDays(days: number): string {
  if (days <= 0) return formatYmd(0, 0, 0);
  const years = Math.floor(days / 365);
  const afterYears = days - years * 365;
  const months = Math.floor(afterYears / 30);
  const rest = afterYears - months * 30;
  return formatYmd(years, months, rest);
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

const DAY_MS = 86_400_000;

export function daysUntilDue(dueDate: string | Date): number {
  const today = new Date();
  const startOfToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const due = new Date(dueDate);
  const startOfDue = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  return Math.round((startOfDue - startOfToday) / DAY_MS);
}
