'use client';

import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';
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

export interface Opcion {
  value: string;
  label: string;
  group?: string;
}

interface Props {
  options: Opcion[];
  selected: string[];
  onChange: (selected: string[]) => void;
  nuevos?: string[];
  onNuevosChange?: (nuevos: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  showChips?: boolean;
}

export function MultiSelectCreatable({
  options,
  selected,
  onChange,
  nuevos = [],
  onNuevosChange,
  placeholder = 'Selecciona',
  searchPlaceholder = 'Buscar o escribir para crear...',
  emptyLabel = 'Sin resultados',
  showChips = true,
}: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const grupos = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visibles = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
    const mapa = new Map<string, Opcion[]>();
    for (const o of visibles) {
      const clave = o.group ?? '';
      mapa.set(clave, [...(mapa.get(clave) ?? []), o]);
    }
    return [...mapa.entries()];
  }, [options, query]);

  const hayOpciones = grupos.some(([, lista]) => lista.length > 0);
  const termino = query.trim();
  const yaExiste =
    !termino ||
    options.some((o) => o.label.toLowerCase() === termino.toLowerCase()) ||
    nuevos.some((n) => n.toLowerCase() === termino.toLowerCase());
  const puedeCrear = !!onNuevosChange && !yaExiste;

  const total = selected.length + nuevos.length;
  const etiqueta = etiquetaResumen(total, placeholder, selected, nuevos, options, showChips);

  const alternar = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const crear = () => {
    if (!onNuevosChange || !termino) return;
    onNuevosChange([...nuevos, termino]);
    setQuery('');
  };

  return (
    <div className="space-y-2">
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
            <span className={cn('min-w-0 truncate', total === 0 && 'text-muted-foreground')}>{etiqueta}</span>
            <ChevronDown className="ml-2 size-4 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="max-h-80 w-(--radix-dropdown-menu-trigger-width) max-w-[calc(100vw-2rem)] overflow-hidden p-0"
          align="start"
        >
          <div className="sticky top-0 border-b bg-popover p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter' && puedeCrear) {
                    e.preventDefault();
                    crear();
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
                  crear();
                }}
                className="flex items-center gap-2 font-medium text-brand"
              >
                <Plus className="size-4 shrink-0" />
                <span className="min-w-0 truncate">Crear "{termino}"</span>
              </DropdownMenuItem>
            )}
            {!hayOpciones && !puedeCrear && (
              <p className="px-3 py-6 text-center text-muted-foreground text-sm">{emptyLabel}</p>
            )}
            {grupos.map(([nombre, lista], gi) => (
              <div key={nombre || `g${gi}`}>
                {nombre && (
                  <>
                    {gi > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="text-muted-foreground text-xs">{nombre}</DropdownMenuLabel>
                  </>
                )}
                {lista.map((o) => (
                  <DropdownMenuItem
                    key={o.value}
                    onSelect={(e) => {
                      e.preventDefault();
                      alternar(o.value);
                    }}
                    className="flex items-center justify-between"
                  >
                    <span className="min-w-0 truncate">{o.label}</span>
                    {selected.includes(o.value) && <Check className="ml-2 size-4 shrink-0 text-brand" />}
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {showChips && total > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((v) => (
            <Chip key={v} label={options.find((o) => o.value === v)?.label ?? v} onRemove={() => alternar(v)} />
          ))}
          {nuevos.map((n) => (
            <Chip key={n} label={n} nuevo onRemove={() => onNuevosChange?.(nuevos.filter((x) => x !== n))} />
          ))}
        </div>
      )}
    </div>
  );
}

function etiquetaResumen(
  total: number,
  placeholder: string,
  selected: string[],
  nuevos: string[],
  options: Opcion[],
  showChips: boolean,
): string {
  if (total === 0) return placeholder;
  if (total > 1) return `${total} seleccionados`;
  if (showChips) return '1 seleccionado';
  const id = selected[0];
  if (id) return options.find((o) => o.value === id)?.label ?? id;
  return nuevos[0] ?? placeholder;
}

function Chip({ label, onRemove, nuevo }: Readonly<{ label: string; onRemove: () => void; nuevo?: boolean }>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs',
        nuevo ? 'border-brand/40 bg-brand/10 text-brand' : 'bg-muted',
      )}
    >
      <span className="max-w-40 truncate">{label}</span>
      {nuevo && <span className="text-[10px] opacity-70">nuevo</span>}
      <button type="button" onClick={onRemove} aria-label={`Quitar ${label}`} className="opacity-60 hover:opacity-100">
        <X className="size-3" />
      </button>
    </span>
  );
}
