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
    <div
      className={cn(
        'group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
    >
      <div
        aria-hidden
        className={cn('absolute inset-x-0 top-0 h-1 opacity-80', color ? 'bg-current' : 'bg-primary', color)}
      />
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-current/10', color)}>
            <Icon className={cn('h-5 w-5', color ?? 'text-primary')} />
          </span>
        )}
      </div>
      <p className="font-display text-3xl font-bold leading-none tracking-tight tabular-nums">{value}</p>
      {trend && (
        <p
          className={cn(
            'inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
            trend.direction === 'up' ? 'bg-success/12 text-success' : 'bg-destructive/12 text-destructive',
          )}
        >
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </div>
  );
}
