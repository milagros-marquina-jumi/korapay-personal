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
        'flex flex-col gap-3 rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon && <Icon className={cn('h-5 w-5 shrink-0', color ?? 'text-muted-foreground')} />}
      </div>
      <p className="font-display text-3xl font-bold leading-tight tracking-tight">{value}</p>
      {trend && (
        <p className={cn('text-xs font-medium', trend.direction === 'up' ? 'text-success' : 'text-destructive')}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
        </p>
      )}
    </div>
  );
}
