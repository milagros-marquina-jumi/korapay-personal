import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

type InputProps = ComponentPropsWithoutRef<'input'>;

const DEFAULT_MAX_LENGTH = 120;

function Input({ className, type, maxLength, ...props }: InputProps) {
  const appliesMaxLength = type !== 'date' && type !== 'number' && type !== 'month' && type !== 'time';
  return (
    <input
      type={type}
      maxLength={maxLength ?? (appliesMaxLength ? DEFAULT_MAX_LENGTH : undefined)}
      className={cn(
        'flex h-10 w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm shadow-soft transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/70 hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export type { InputProps };
export { Input };
