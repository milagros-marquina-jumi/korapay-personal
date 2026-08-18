'use client';

import { Check, ChevronDown, Plus, Search } from 'lucide-react';
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

export interface SearchSelectOption {
  value: string;
  label: string;
  group?: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  clearable?: boolean;
  clearLabel?: string;
  onCreate?: (nombre: string) => Promise<void> | void;
  createLabel?: string;
}

export function SearchSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Selecciona',
  searchPlaceholder = 'Buscar...',
  clearable = false,
  clearLabel = 'Sin asignar',
  onCreate,
  createLabel = 'Crear',
}: Readonly<SearchSelectProps>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creando, setCreando] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, SearchSelectOption[]>();
    for (const o of filtered) {
      const clave = o.group ?? '';
      mapa.set(clave, [...(mapa.get(clave) ?? []), o]);
    }
    return [...mapa.entries()];
  }, [filtered]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const commit = (next: string) => {
    onValueChange(next);
    setOpen(false);
    setQuery('');
  };

  const termino = query.trim();
  const puedeCrear = !!onCreate && !!termino && !options.some((o) => o.label.toLowerCase() === termino.toLowerCase());

  const crear = async () => {
    if (!onCreate || !termino) return;
    setCreando(true);
    try {
      await onCreate(termino);
      setOpen(false);
      setQuery('');
    } finally {
      setCreando(false);
    }
  };

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
          <span className={cn('min-w-0 truncate', !selectedLabel && 'text-muted-foreground')}>
            {selectedLabel ?? placeholder}
          </span>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="max-h-80 w-(--radix-dropdown-menu-trigger-width) max-w-[calc(100vw-2rem)] overflow-hidden p-0"
        align="start"
      >
        <div className="sticky top-0 border-b bg-popover p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && puedeCrear) {
                  e.preventDefault();
                  void crear();
                }
              }}
              placeholder={searchPlaceholder}
              className="h-9 pl-8"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-x-hidden overflow-y-auto py-1">
          {puedeCrear && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                void crear();
              }}
              className="flex items-center gap-2 font-medium text-brand"
            >
              <Plus className="size-4 shrink-0" />
              <span className="min-w-0 truncate">{creando ? 'Creando…' : `${createLabel} "${termino}"`}</span>
            </DropdownMenuItem>
          )}
          {filtered.length === 0 && !puedeCrear && (
            <p className="px-3 py-6 text-center text-muted-foreground text-sm">Sin resultados</p>
          )}
          {clearable && value && !query && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                onValueChange('');
                setOpen(false);
              }}
              className="text-muted-foreground"
            >
              {clearLabel}
            </DropdownMenuItem>
          )}
          {grupos.map(([nombre, lista], gi) => (
            <div key={nombre || `g${gi}`}>
              {nombre && (
                <>
                  {gi > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-muted-foreground text-xs">{nombre}</DropdownMenuLabel>
                </>
              )}
              {lista.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={(e) => {
                    e.preventDefault();
                    commit(option.value);
                  }}
                  className="flex items-center justify-between"
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value && <Check className="ml-2 size-4 shrink-0 text-brand" />}
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
