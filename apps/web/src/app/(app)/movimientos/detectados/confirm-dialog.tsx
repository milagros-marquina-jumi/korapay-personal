'use client';

import { formatMoney } from '@korapay/domain';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import type { Account, Category, DetectedTransaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

interface ConfirmDialogProps {
  detected: DetectedTransaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: () => void;
}

export function ConfirmDialog({ detected, open, onOpenChange, onConfirmed }: ConfirmDialogProps) {
  const { workspaces } = useWorkspace();
  const [workspaceId, setWorkspaceId] = useState(detected.workspaceId ?? workspaces[0]?.id ?? '');
  const [accountId, setAccountId] = useState(detected.accountId ?? '');
  const [categoryId, setCategoryId] = useState(detected.categoryId ?? '');
  const [createRule, setCreateRule] = useState(false);

  const { data: accounts } = useQuery({
    queryKey: queryKeys.accounts(workspaceId),
    queryFn: () => apiFetch<Account[]>(`/accounts?workspaceId=${workspaceId}`),
    enabled: open && !!workspaceId,
  });

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories(workspaceId),
    queryFn: () => apiFetch<Category[]>(`/categories?workspaceId=${workspaceId}`),
    enabled: open && !!workspaceId,
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`/detected-transactions/${detected.id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId,
          accountId: accountId || undefined,
          categoryId: categoryId || undefined,
          createRule,
        }),
      }),
    onSuccess: () => {
      onConfirmed();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar movimiento</DialogTitle>
          <DialogDescription>
            {(detected.merchantOriginal ?? detected.description) || 'Movimiento detectado'} ·{' '}
            {formatMoney(detected.amount, detected.currency as 'PEN' | 'USD')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Workspace</Label>
            <Select
              value={workspaceId}
              onValueChange={(v) => {
                setWorkspaceId(v);
                setAccountId('');
                setCategoryId('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cuenta</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin cuenta" />
              </SelectTrigger>
              <SelectContent>
                {(accounts ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Checkbox id="createRule" checked={createRule} onCheckedChange={(v) => setCreateRule(v === true)} />
            <Label htmlFor="createRule" className="font-normal">
              Crear regla para futuros movimientos similares
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !workspaceId}>
            {mutation.isPending ? 'Confirmando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
