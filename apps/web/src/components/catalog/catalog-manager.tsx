'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/confirm-provider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';

export interface CatalogField {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
}

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
}: Props) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: items } = useQuery({
    queryKey,
    queryFn: () =>
      apiFetch<CatalogItem[]>(endpoint.startsWith('/') ? endpointWithQuery(endpoint, extraBody) : endpoint),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const save = useMutation({
    mutationFn: () => {
      const body = { ...extraBody, ...values };
      if (editing) {
        return apiFetch(withId(endpoint, editing.id, extraBody), { method: 'PATCH', body: JSON.stringify(body) });
      }
      return apiFetch(endpoint.startsWith('/') ? endpoint : endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success(editing ? 'Actualizado' : 'Creado');
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
                  <Input
                    id={f.name}
                    value={values[f.name] ?? ''}
                    placeholder={f.placeholder}
                    required={f.required}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  />
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

      <div className="divide-y rounded-lg border">
        {items?.length ? (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-3 py-2">
              <span className="text-sm">{display(item)}</span>
              <div className="flex gap-1">
                {editable && (
                  <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {deletable && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Eliminar"
                    onClick={async () => {
                      const ok = await confirm({
                        title: `Eliminar ${title.toLowerCase()}`,
                        description: `Se eliminará "${display(item)}". Esta acción no se puede deshacer.`,
                        confirmLabel: 'Eliminar',
                        destructive: true,
                      });
                      if (ok) remove.mutate(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Sin registros</p>
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
