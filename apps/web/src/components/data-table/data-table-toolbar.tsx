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
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
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
