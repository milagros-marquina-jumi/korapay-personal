import { HelpCircle, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface KPICardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  color?: string;
  trend?: { direction: 'up' | 'down'; value: string };
  className?: string;
  tooltip?: string;
}

export function KPICard({ label, value, icon: Icon, color, trend, className, tooltip }: Readonly<KPICardProps>) {
  return (
    <div
      className={cn(
        'group relative flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          'absolute inset-x-0 top-0 h-1 rounded-t-2xl opacity-80',
          color ? 'bg-current' : 'bg-primary',
          color,
        )}
      />
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <span className="truncate">{label}</span>
          {tooltip && (
            <span className="relative flex shrink-0 items-center">
              <button
                type="button"
                aria-label={`Qué significa ${label}`}
                className="peer flex size-4 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                <HelpCircle className="size-3.5" aria-hidden />
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-xs font-normal leading-snug text-popover-foreground opacity-0 shadow-lg transition-opacity duration-150 peer-hover:opacity-100 peer-focus:opacity-100"
              >
                {tooltip}
              </span>
            </span>
          )}
        </span>
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
