'use client';

import { formatMoney } from '@korapay/domain';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import type { Account, BankCatalog, Category, DetectedTransaction, PaymentMethodCatalog } from '@/lib/api.types';
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
  const [bank, setBank] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const { data: accounts } = useQuery({
    queryKey: queryKeys.accounts(workspaceId),
    queryFn: () => apiFetch<Account[]>(`/accounts?workspaceId=${workspaceId}`),
    enabled: open && !!workspaceId,
  });

  const { data: categories, isSuccess: categoriesLoaded } = useQuery({
    queryKey: queryKeys.categories(workspaceId),
    queryFn: () => apiFetch<Category[]>(`/categories?workspaceId=${workspaceId}`),
    enabled: open && !!workspaceId,
  });

  const { data: banks } = useQuery({
    queryKey: queryKeys.banks(),
    queryFn: () => apiFetch<BankCatalog[]>('/banks'),
    enabled: open,
  });

  const { data: paymentMethods } = useQuery({
    queryKey: queryKeys.paymentMethods(),
    queryFn: () => apiFetch<PaymentMethodCatalog[]>('/payment-methods'),
    enabled: open,
  });

  const bancoDetectado = useMemo(() => {
    const candidatos = [detected.bankName, detected.bankCode].filter(Boolean).map((v) => String(v).toLowerCase());
    if (!candidatos.length) return '';
    const lista = banks ?? [];
    const exacto = lista.find((b) => candidatos.includes(b.name.toLowerCase()));
    if (exacto) return exacto.name;
    const parcial = lista.find((b) =>
      candidatos.some((c) => b.name.toLowerCase().startsWith(c) || c.startsWith(b.name.toLowerCase())),
    );
    return parcial?.name ?? '';
  }, [banks, detected.bankName, detected.bankCode]);

  useEffect(() => {
    if (open && bancoDetectado && !bank) setBank(bancoDetectado);
  }, [open, bancoDetectado, bank]);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`/detected-transactions/${detected.id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId,
          accountId: accountId || undefined,
          categoryId: categoryId || undefined,
          bank: bank || undefined,
          paymentMethod: paymentMethod || undefined,
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
          {(accounts ?? []).length > 0 && (
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
          )}
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={categoriesLoaded && !categories?.length ? 'Sin categorías' : 'Sin categoría'}
                />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoriesLoaded && !categories?.length && (
              <p className="text-muted-foreground text-xs">
                Este workspace aún no tiene categorías. Créalas en Configuración.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Banco</Label>
              <Select value={bank} onValueChange={setBank}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin banco" />
                </SelectTrigger>
                <SelectContent>
                  {(banks ?? []).map((b) => (
                    <SelectItem key={b.id} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {detected.bankName && (
                <p className="text-muted-foreground text-xs">
                  Detectado: {detected.bankName}
                  {detected.cardLast4 ? ` ***${detected.cardLast4}` : ''}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Medio de pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin medio" />
                </SelectTrigger>
                <SelectContent>
                  {(paymentMethods ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
