'use client';

import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  content: ReactNode;
  className?: string;
}

export function InfoTooltip({ content, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className={cn('relative inline-flex', className)}>
      <button
        type="button"
        className="inline-flex cursor-help items-center text-muted-foreground/60 transition-colors hover:text-muted-foreground"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        aria-label="Más información"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md whitespace-nowrap">
          {content}
        </span>
      )}
    </span>
  );
}
