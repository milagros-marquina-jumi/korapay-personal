import { cn } from '../lib/utils';

const NEUTRAL = 'border border-border bg-muted/60 text-muted-foreground';

const statusConfig: Record<string, { label: string; className: string }> = {
  PAID: { label: 'Pagado', className: 'border border-success/25 bg-success/10 text-success' },
  PENDING: { label: 'Pendiente', className: 'border border-warning/25 bg-warning/10 text-warning' },
  OVERDUE: {
    label: 'Vencido',
    className: 'border border-destructive/25 bg-destructive/10 text-destructive',
  },
  PARTIAL: { label: 'Parcial', className: 'border border-info/25 bg-info/10 text-info' },
  CANCELLED: {
    label: 'Cancelado',
    className: NEUTRAL,
  },
  PENDING_REVIEW: {
    label: 'Revisión',
    className: 'border border-warning/25 bg-warning/10 text-warning',
  },
  ACTIVE: { label: 'Activo', className: 'border border-success/25 bg-success/10 text-success' },
  INACTIVE: { label: 'Inactivo', className: NEUTRAL },
  FINISHED: { label: 'Finalizado', className: NEUTRAL },
  EXPIRING: { label: 'Por vencer', className: 'border border-warning/25 bg-warning/10 text-warning' },
  NUNCA_PAGO: { label: 'Nunca pagó', className: 'border border-destructive/25 bg-destructive/10 text-destructive' },
};
export function statusLabel(status: string): string {
  return statusConfig[status]?.label ?? status;
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}
export function StatusBadge({ status, className }: Readonly<StatusBadgeProps>) {
  const config = statusConfig[status] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground',
  };
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center self-start whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
