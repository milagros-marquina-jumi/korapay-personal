import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface KPIGridProps {
  children: ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
}
export function KPIGrid({ children, className, columns = 4 }: KPIGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
