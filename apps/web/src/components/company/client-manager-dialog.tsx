'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/confirm-provider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IconAction } from '@/components/ui/icon-action';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import type { Company, GlobalClient } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { cn } from '@/lib/utils';

interface Props {
  workspaceId: string;
  company: Company;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientManagerDialog({ workspaceId, company, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { markNew, highlightClass } = useHighlightNew();
  const [editing, setEditing] = useState<GlobalClient | null>(null);
  const [values, setValues] = useState<{ name: string }>({ name: '' });

  const { data } = useQuery({
    queryKey: queryKeys.globalClients(),
    queryFn: () => apiFetch<GlobalClient[]>('/global-clients'),
    enabled: open,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.globalClients() });
    queryClient.invalidateQueries({ queryKey: queryKeys.globalCompanies() });
    queryClient.invalidateQueries({ queryKey: queryKeys.companies(workspaceId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.employmentContracts(workspaceId) });
  };

  const reset = () => {
    setEditing(null);
    setValues({ name: '' });
  };

  const save = useMutation({
    mutationFn: () => {
      const payload = { name: values.name.trim(), globalCompanyId: company.globalCompanyId ?? undefined };
      if (editing) {
        return apiFetch<GlobalClient>(`/global-clients/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
      return apiFetch<GlobalClient>('/global-clients', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: (result) => {
      invalidate();
      toast.success(editing ? 'Cliente actualizado' : 'Cliente creado');
      if (!editing && result?.id) markNew(result.id);
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiFetch(`/global-clients/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      toast.success('Cliente eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clients = (data ?? []).filter((c) => c.globalCompanyId && c.globalCompanyId === company.globalCompanyId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clientes de {company.name}</DialogTitle>
          <DialogDescription>Empresas o clientes finales a los que prestaste servicio.</DialogDescription>
        </DialogHeader>

        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (values.name.trim()) save.mutate();
          }}
        >
          <div className="flex-1 space-y-1">
            <Label htmlFor="client-name" className="text-xs">
              {editing ? 'Editar cliente' : 'Nuevo cliente'}
            </Label>
            <Input
              id="client-name"
              placeholder="Ej. TADCON, cliente final"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            />
          </div>
          <Button type="submit" size="sm" disabled={save.isPending || !values.name.trim()}>
            {editing ? 'Guardar' : <Plus className="h-4 w-4" />}
          </Button>
          {editing && (
            <Button type="button" size="sm" variant="outline" onClick={reset}>
              Cancelar
            </Button>
          )}
        </form>

        <div className="divide-y rounded-lg border">
          {clients.length ? (
            clients.map((client) => (
              <div
                key={client.id}
                className={cn('flex items-center justify-between px-3 py-2', highlightClass(client.id))}
              >
                <span className="text-sm">{client.name}</span>
                <div className="flex gap-0.5">
                  <IconAction
                    icon={Pencil}
                    label="Editar"
                    onClick={() => {
                      setEditing(client);
                      setValues({ name: client.name });
                    }}
                  />
                  <IconAction
                    icon={Trash2}
                    label="Eliminar"
                    destructive
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Eliminar cliente',
                        description: `Se eliminará "${client.name}".`,
                        confirmLabel: 'Eliminar',
                        destructive: true,
                      });
                      if (ok) remove.mutate(client.id);
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Sin clientes registrados</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
