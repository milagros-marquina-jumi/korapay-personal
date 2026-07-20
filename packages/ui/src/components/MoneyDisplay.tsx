'use client';
import { formatMoney } from '@korapay/domain';
import { cn } from '../lib/utils';

interface MoneyDisplayProps {
  amount: string;
  currency: 'PEN' | 'USD';
  className?: string;
  showSign?: boolean;
}
export function MoneyDisplay({ amount, currency, className, showSign }: MoneyDisplayProps) {
  const num = Number(amount);
  const isPositive = num > 0;
  const isNegative = num < 0;
  return (
    <span
      className={cn(
        'font-semibold tabular-nums',
        isPositive && 'text-success',
        isNegative && 'text-destructive',
        className,
      )}
    >
      {' '}
      {showSign && isPositive ? '+' : ''} {formatMoney(amount, currency)}{' '}
    </span>
  );
}
