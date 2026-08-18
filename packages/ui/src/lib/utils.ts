import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function esCero(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return value === 0;
  const limpio = value.replaceAll(/[^\d,.-]/g, '');
  if (!limpio) return false;
  return Number(limpio.replaceAll(',', '')) === 0;
}
