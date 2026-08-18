import { cn } from '@/lib/utils';

interface Props {
  name: string;
  role?: string | null;
  status?: string;
  className?: string;
}

export function TalentName({ name, role, status, className }: Readonly<Props>) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span className="truncate font-medium">{name}</span>
      {role && <span className="shrink-0 text-muted-foreground text-xs">({role})</span>}
      {status && status !== 'ACTIVE' && (
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">inactivo</span>
      )}
    </span>
  );
}
