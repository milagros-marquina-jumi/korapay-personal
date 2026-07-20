import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface KPICardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  color?: string;
  trend?: { direction: 'up' | 'down'; value: string };
  className?: string;
}
export function KPICard({ label, value, icon: Icon, color, trend, className }: KPICardProps) {
  return (
    <div className={cn('rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md', className)}>
      {' '}
      <div className="flex items-center justify-between">
        {' '}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>{' '}
        {Icon && <Icon className={cn('h-5 w-5', color ?? 'text-muted-foreground')} />}{' '}
      </div>{' '}
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>{' '}
      {trend && (
        <p className={cn('mt-1 text-xs', trend.direction === 'up' ? 'text-success' : 'text-destructive')}>
          {' '}
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}{' '}
        </p>
      )}{' '}
    </div>
  );
}
