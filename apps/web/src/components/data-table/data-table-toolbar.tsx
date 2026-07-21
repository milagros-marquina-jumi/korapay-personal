'use client';

import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filters?: ReactNode;
  onClear?: () => void;
  showClear?: boolean;
}

export function DataTableToolbar({
  search,
  onSearchChange,
  placeholder = 'Buscar...',
  filters,
  onClear,
  showClear,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-border/70 bg-card p-3 shadow-soft">
      <div className="relative min-w-[12rem] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="border-transparent bg-muted/50 pl-9 shadow-none focus-visible:bg-card"
        />
      </div>
      {filters}
      {showClear && onClear && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-1 h-4 w-4" /> Limpiar
        </Button>
      )}
    </div>
  );
}
