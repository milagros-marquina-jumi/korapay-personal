'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

type ProgressProps = ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>;

function Progress({ className, value, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export type { ProgressProps };
export { Progress };
