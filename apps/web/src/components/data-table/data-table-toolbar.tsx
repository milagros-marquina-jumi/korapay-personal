'use client';

import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filters?: ReactNode;
  onClear?: () => void;
  showClear?: boolean;
  sticky?: boolean;
}

export function DataTableToolbar({
  search,
  onSearchChange,
  placeholder = 'Buscar...',
  filters,
  onClear,
  showClear,
  sticky = true,
}: Readonly<Props>) {
  return (
    <div
      className={cn(
        sticky && [
          'sticky top-(--toolbar-offset,9rem) z-10',
          '-mx-4 -mt-4 px-4 pb-4 pt-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8',
          'bg-background/85 backdrop-blur-xl',
        ],
      )}
    >
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-border/70 bg-card p-3 shadow-soft">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && search) {
                e.preventDefault();
                onSearchChange('');
              }
            }}
            placeholder={placeholder}
            className={cn('border-transparent bg-muted/50 pl-9 shadow-none focus-visible:bg-card', search && 'pr-9')}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpiar búsqueda"
              title="Limpiar búsqueda"
              className={cn(
                'absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md',
                'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60',
              )}
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        {filters}
        {showClear && onClear && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="mr-1 h-4 w-4" /> Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
