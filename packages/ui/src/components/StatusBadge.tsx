import { cn } from '../lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  PAID: { label: 'Pagado', className: 'bg-success/10 text-success' },
  PENDING: { label: 'Pendiente', className: 'bg-warning/10 text-warning' },
  OVERDUE: {
    label: 'Vencido',
    className: 'bg-destructive/10 text-destructive',
  },
  PARTIAL: { label: 'Parcial', className: 'bg-info/10 text-info' },
  CANCELLED: {
    label: 'Cancelado',
    className: 'bg-muted text-muted-foreground',
  },
  PENDING_REVIEW: {
    label: 'Revisión',
    className: 'bg-warning/10 text-warning',
  },
  ACTIVE: { label: 'Activo', className: 'bg-success/10 text-success' },
  INACTIVE: { label: 'Inactivo', className: 'bg-muted text-muted-foreground' },
};
interface StatusBadgeProps {
  status: string;
  className?: string;
}
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
