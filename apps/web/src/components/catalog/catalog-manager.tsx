'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/confirm-provider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IconAction } from '@/components/ui/icon-action';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { cn } from '@/lib/utils';

export interface CatalogField {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

const NONE = '__none__';

interface CatalogItem {
  id: string;
  [key: string]: unknown;
}

interface Props {
  title: string;
  endpoint: string;
  queryKey: readonly unknown[];
  fields: CatalogField[];
  display: (item: CatalogItem) => ReactNode;
  extraBody?: Record<string, unknown>;
  editable?: boolean;
  deletable?: boolean;
  searchable?: boolean;
  searchText?: (item: CatalogItem) => string;
}

export function CatalogManager({
  title,
  endpoint,
  queryKey,
  fields,
  display,
  extraBody,
  editable = true,
  deletable = true,
  searchable = false,
  searchText,
}: Props) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { markNew, highlightClass } = useHighlightNew();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  const { data } = useQuery({
    queryKey,
    queryFn: () =>
      apiFetch<CatalogItem[]>(endpoint.startsWith('/') ? endpointWithQuery(endpoint, extraBody) : endpoint),
  });

  const sorted = data
    ? [...data].sort((a, b) => {
        const av = String(a.name ?? a.code ?? '').toLowerCase();
        const bv = String(b.name ?? b.code ?? '').toLowerCase();
        return av.localeCompare(bv, 'es');
      })
    : undefined;

  const term = search.trim().toLowerCase();
  const items =
    term && sorted
      ? sorted.filter((item) => {
          const haystack = searchText?.(item) ?? String(item.name ?? item.code ?? '');
          return haystack.toLowerCase().includes(term);
        })
      : sorted;

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const save = useMutation({
    mutationFn: () => {
      const body = { ...extraBody, ...values };
      if (editing) {
        return apiFetch<CatalogItem>(withId(endpoint, editing.id, extraBody), {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      }
      return apiFetch<CatalogItem>(endpoint.startsWith('/') ? endpoint : endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: (result) => {
      invalidate();
      toast.success(editing ? 'Actualizado' : 'Creado');
      if (!editing && result?.id) markNew(result.id);
      setOpen(false);
      setEditing(null);
      setValues({});
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(withId(endpoint, id, extraBody), { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      toast.success('Eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setValues({});
    setOpen(true);
  };
  const openEdit = (item: CatalogItem) => {
    setEditing(item);
    setValues(Object.fromEntries(fields.map((f) => [f.name, String(item[f.name] ?? '')])));
    setOpen(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" /> Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Editar' : 'Nuevo'} {title.toLowerCase()}
              </DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              {fields.map((f) => (
                <div key={f.name} className="space-y-2">
                  <Label htmlFor={f.name}>{f.label}</Label>
                  {f.options ? (
                    <Select
                      value={values[f.name] || NONE}
                      onValueChange={(value) => setValues((v) => ({ ...v, [f.name]: value === NONE ? '' : value }))}
                    >
                      <SelectTrigger id={f.name}>
                        <SelectValue placeholder={f.placeholder ?? 'Selecciona'} />
                      </SelectTrigger>
                      <SelectContent>
                        {!f.required && <SelectItem value={NONE}>Sin asignar</SelectItem>}
                        {f.options.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={f.name}
                      value={values[f.name] ?? ''}
                      placeholder={f.placeholder}
                      required={f.required}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
              <DialogFooter>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {searchable && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar ${title.toLowerCase()}...`}
            className="border-transparent bg-muted/50 pl-9 shadow-none focus-visible:bg-card"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="divide-y rounded-lg border">
        {items?.length ? (
          items.map((item) => (
            <div key={item.id} className={cn('flex items-center justify-between px-3 py-2', highlightClass(item.id))}>
              <span className="text-sm">{display(item)}</span>
              <div className="flex gap-0.5">
                {editable && <IconAction icon={Pencil} label="Editar" onClick={() => openEdit(item)} />}
                {deletable && (
                  <IconAction
                    icon={Trash2}
                    label="Eliminar"
                    destructive
                    onClick={async () => {
                      const ok = await confirm({
                        title: `Eliminar ${title.toLowerCase()}`,
                        description: `Se eliminará "${display(item)}". Esta acción no se puede deshacer.`,
                        confirmLabel: 'Eliminar',
                        destructive: true,
                      });
                      if (ok) remove.mutate(item.id);
                    }}
                  />
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {term ? `Sin resultados para "${search.trim()}"` : 'Sin registros'}
          </p>
        )}
      </div>
    </div>
  );
}

function endpointWithQuery(endpoint: string, extra?: Record<string, unknown>): string {
  const ws = extra?.workspaceId;
  return ws ? `${endpoint}?workspaceId=${ws}` : endpoint;
}

function withId(endpoint: string, id: string, extra?: Record<string, unknown>): string {
  const ws = extra?.workspaceId;
  return ws ? `${endpoint}/${id}?workspaceId=${ws}` : `${endpoint}/${id}`;
}
