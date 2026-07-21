'use client';

import { Check, ChevronDown, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface MultiSelectGroup {
  label: string;
  options: string[];
}

interface MultiSelectProps {
  groups: MultiSelectGroup[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}

export function MultiSelect({
  groups,
  selected,
  onChange,
  placeholder = 'Selecciona',
  searchPlaceholder = 'Buscar...',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .map((g) => ({ ...g, options: q ? g.options.filter((o) => o.toLowerCase().includes(q)) : g.options }))
      .filter((g) => g.options.length > 0);
  }, [groups, query]);

  const label =
    selected.length === 0 ? placeholder : selected.length === 1 ? selected[0] : `${selected.length} seleccionados`;

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full min-w-0 justify-between font-normal"
          aria-label={placeholder}
        >
          <span className={cn('min-w-0 truncate', selected.length === 0 && 'text-muted-foreground')}>{label}</span>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="max-h-80 w-[--radix-dropdown-menu-trigger-width] overflow-hidden p-0"
        align="start"
      >
        <div className="sticky top-0 border-b bg-popover p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={searchPlaceholder}
              className="h-9 pl-8"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {filteredGroups.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Sin resultados</p>
          )}
          {filteredGroups.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-muted-foreground">{group.label}</DropdownMenuLabel>
              {group.options.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onSelect={(e) => {
                    e.preventDefault();
                    toggle(option);
                  }}
                  className="flex items-center justify-between"
                >
                  <span className="truncate">{option}</span>
                  {selected.includes(option) && <Check className="ml-2 size-4 shrink-0 text-brand" />}
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
