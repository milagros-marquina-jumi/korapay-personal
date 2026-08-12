'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  allLabel?: string;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

const ALL = 'ALL';
const AUTO_SEARCH_THRESHOLD = 8;

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function FilterSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Filtrar',
  allLabel = 'Todos',
  className,
  searchable,
  searchPlaceholder = 'Buscar...',
}: Readonly<FilterSelectProps>) {
  const [query, setQuery] = useState('');
  const conBuscador = searchable ?? options.length > AUTO_SEARCH_THRESHOLD;

  const visibles = useMemo(() => {
    if (!conBuscador || !query.trim()) return options;
    const term = normalize(query.trim());
    return options.filter((o) => normalize(o.label).includes(term));
  }, [options, query, conBuscador]);

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      onOpenChange={(abierto) => {
        if (!abierto) setQuery('');
      }}
    >
      <SelectTrigger
        className={cn('h-10 w-[10.5rem] min-w-[10.5rem] max-w-[10.5rem] [&>span]:truncate', className)}
        aria-label={placeholder}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {conBuscador && (
          <div className="sticky top-0 z-10 -mx-1 -mt-1 mb-1 border-b bg-popover px-2 pt-2 pb-2">
            <div className="relative">
              <Search
                className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 pl-8 text-sm"
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {visibles.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
        {conBuscador && visibles.length === 0 && (
          <p className="px-2 py-4 text-center text-muted-foreground text-sm">Sin resultados</p>
        )}
      </SelectContent>
    </Select>
  );
}

export { ALL as FILTER_ALL };
