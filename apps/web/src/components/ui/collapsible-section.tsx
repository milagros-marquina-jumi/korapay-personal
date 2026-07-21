'use client';

import { ChevronDown } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  label?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleSection({ label = 'Ver más', children, defaultOpen = false }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:text-brand/80"
      >
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
        {open ? 'Ver menos' : label}
      </button>
      {open && <div className="space-y-4">{children}</div>}
    </div>
  );
}
