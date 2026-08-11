'use client';

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const FLAT_THRESHOLD = 0.5;

interface Props {
  current: number;
  previous?: number;
  className?: string;
}

export function TrendDelta({ current, previous, className }: Readonly<Props>) {
  if (previous === undefined || previous === 0) {
    return <span className={cn('w-20 shrink-0', className)} aria-hidden />;
  }

  const percent = ((current - previous) / Math.abs(previous)) * 100;
  const flat = Math.abs(percent) < FLAT_THRESHOLD;
  const up = percent > 0;
  const Icon = flat ? Minus : (up && ArrowUpRight) || ArrowDownRight;
  const tone = flat ? 'text-muted-foreground' : (up && 'text-success') || 'text-destructive';
  const sign = flat ? '' : (up && '+') || '';

  return (
    <span
      className={cn(
        'inline-flex w-20 shrink-0 items-center justify-end gap-0.5 text-xs font-medium tabular-nums',
        tone,
        className,
      )}
      title={`vs periodo anterior: ${sign}${percent.toFixed(1)}%`}
    >
      <Icon className="size-3.5" aria-hidden />
      {sign}
      {percent.toFixed(1)}%
    </span>
  );
}
