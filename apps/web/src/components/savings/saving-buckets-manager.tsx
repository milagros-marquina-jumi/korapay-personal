'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconAction } from '@/components/ui/icon-action';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import type { BankCatalog, SavingBucket } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const NO_BANK = '__none__';

export function SavingBucketsManager() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<SavingBucket | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [bank, setBank] = useState(NO_BANK);
  const [currency, setCurrency] = useState('PEN');

  const { data: buckets, isLoading } = useQuery({
    queryKey: queryKeys.savingBuckets(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<SavingBucket[]>(`/saving-balances/buckets?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const { data: banks } = useQuery({
    queryKey: queryKeys.banks(),
    queryFn: () => apiFetch<BankCatalog[]>('/banks'),
  });

  useEffect(() => {
    if (!editing) return;
    setName(editing.bucket);
    setBank(editing.bank || NO_BANK);
    setCurrency(editing.currency);
  }, [editing]);

  const openCreate = () => {
    setName('');
    setBank(NO_BANK);
    setCurrency('PEN');
    setCreating(true);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.savingBuckets(activeWorkspaceId ?? '') });
    queryClient.invalidateQueries({ queryKey: ['saving-balances', activeWorkspaceId] });
    queryClient.invalidateQueries({ queryKey: queryKeys.savingLastPeriod(activeWorkspaceId ?? '') });
    queryClient.invalidateQueries({ queryKey: queryKeys.savingYearlyPivot(activeWorkspaceId ?? '') });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch('/saving-balances/buckets', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          bucket: name.trim(),
          bank: bank === NO_BANK ? undefined : bank,
          currency,
          amount: '0',
        }),
      }),
    onSuccess: () => {
      invalidate();
      toast.success('Cuenta creada');
      setCreating(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const renameMutation = useMutation({
    mutationFn: () =>
      apiFetch('/saving-balances/buckets', {
        method: 'PATCH',
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          bucket: editing?.bucket,
          currency: editing?.currency,
          name: name.trim(),
          bank: bank === NO_BANK ? undefined : bank,
        }),
      }),
    onSuccess: () => {
      invalidate();
      toast.success('Cuenta actualizada en todos sus periodos');
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (target: SavingBucket) =>
      apiFetch(
        `/saving-balances/buckets?workspaceId=${activeWorkspaceId}&bucket=${encodeURIComponent(target.bucket)}&currency=${target.currency}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => {
      invalidate();
      toast.success('Cuenta eliminada de todos los periodos');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirmRemove = async (target: SavingBucket) => {
    const ok = await confirm({
      title: 'Eliminar cuenta de ahorro',
      description: `Se eliminará "${target.bucket}" de los ${target.periods} periodos donde aparece. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) removeMutation.mutate(target);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold">Cuentas de ahorro</h3>
        <Button size="sm" variant="secondary" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> Nueva
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}

      {!isLoading && !buckets?.length && (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Aún no hay cuentas de ahorro registradas.
        </p>
      )}

      <div className="divide-y rounded-lg border">
        {(buckets ?? []).map((item) => (
          <div key={`${item.bucket}-${item.currency}`} className="flex items-center gap-2 px-3 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate text-sm font-medium">{item.bucket}</span>
              {item.bank && <span className="shrink-0 text-xs text-muted-foreground">{item.bank}</span>}
              {item.currency === 'USD' && (
                <span className="shrink-0 rounded bg-brand/10 px-1 text-[10px] font-medium text-brand">USD</span>
              )}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {item.periods} {item.periods === 1 ? 'periodo' : 'periodos'}
            </span>
            <IconAction icon={Pencil} label="Editar cuenta" onClick={() => setEditing(item)} />
            <IconAction icon={Trash2} label="Eliminar cuenta" destructive onClick={() => confirmRemove(item)} />
          </div>
        ))}
      </div>

      <Dialog
        open={editing !== null || creating}
        onOpenChange={(next) => {
          if (next) return;
          setEditing(null);
          setCreating(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{creating ? 'Nueva cuenta de ahorro' : 'Editar cuenta de ahorro'}</DialogTitle>
            <DialogDescription>
              {creating
                ? 'Se agregará al último periodo registrado con saldo en cero.'
                : `El cambio se aplicará a los ${editing?.periods} periodos donde aparece esta cuenta.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="bucket-name">Nombre</Label>
              <Input
                id="bucket-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Ahorro (BCP)"
                maxLength={80}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bucket-bank">Banco</Label>
                <Select value={bank} onValueChange={setBank}>
                  <SelectTrigger id="bucket-bank">
                    <SelectValue placeholder="Sin banco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_BANK}>Sin banco</SelectItem>
                    {(banks ?? []).map((b) => (
                      <SelectItem key={b.id} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bucket-currency">Moneda</Label>
                <Select value={currency} onValueChange={setCurrency} disabled={!creating}>
                  <SelectTrigger id="bucket-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PEN">Soles (PEN)</SelectItem>
                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(null);
                setCreating(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => (creating ? createMutation.mutate() : renameMutation.mutate())}
              disabled={createMutation.isPending || renameMutation.isPending || !name.trim()}
            >
              {createMutation.isPending || renameMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
