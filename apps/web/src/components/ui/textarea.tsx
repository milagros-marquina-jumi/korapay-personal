import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

type TextareaProps = ComponentPropsWithoutRef<'textarea'>;

const DEFAULT_MAX_LENGTH = 500;

function Textarea({ className, maxLength, ...props }: TextareaProps) {
  return (
    <textarea
      maxLength={maxLength ?? DEFAULT_MAX_LENGTH}
      className={cn(
        'flex min-h-20 w-full rounded-lg border border-border bg-card px-3.5 py-2 text-sm shadow-soft transition-all placeholder:text-muted-foreground/70 hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export type { TextareaProps };
export { Textarea };
