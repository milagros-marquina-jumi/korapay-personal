import { esCero } from '@korapay/ui';
import { cn } from '@/lib/utils';

interface MoneyProps {
  value: string;
  className?: string;
}

export function Money({ value, className }: Readonly<MoneyProps>) {
  return <span className={cn(esCero(value) && 'text-muted-foreground/60', className)}>{value}</span>;
}
