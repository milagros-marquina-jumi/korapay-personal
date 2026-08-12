'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import type { BankCatalog, SavingBalanceAccount } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const NO_BANK = '__none__';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  periodLabel: string;
  account?: SavingBalanceAccount;
}

export function SavingAccountDialog({ open, onOpenChange, year, month, periodLabel, account }: Readonly<Props>) {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const [bucket, setBucket] = useState('');
  const [bank, setBank] = useState(NO_BANK);
  const [currency, setCurrency] = useState('PEN');
  const [amount, setAmount] = useState('0');

  const { data: banks } = useQuery({
    queryKey: queryKeys.banks(),
    queryFn: () => apiFetch<BankCatalog[]>('/banks'),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    setBucket(account?.bucket ?? '');
    setBank(account?.bank || NO_BANK);
    setCurrency(account?.currency ?? 'PEN');
    setAmount(account?.amount ?? '0');
  }, [open, account]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch('/saving-balances', {
        method: 'PUT',
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          year,
          month,
          bucket: bucket.trim(),
          bank: bank === NO_BANK ? undefined : bank,
          currency,
          amount: amount || '0',
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saving-balances', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingBuckets(activeWorkspaceId ?? '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingLastPeriod(activeWorkspaceId ?? '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingYearlyPivot(activeWorkspaceId ?? '') });
      toast.success(account ? 'Saldo actualizado' : 'Cuenta agregada');
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    if (!bucket.trim()) {
      toast.error('Escribe el nombre de la cuenta');
      return;
    }
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? 'Editar saldo' : 'Agregar cuenta'}</DialogTitle>
          <DialogDescription className="capitalize">{periodLabel}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="account-bucket">Cuenta</Label>
            <Input
              id="account-bucket"
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              placeholder="Ej. Ahorro (Agora)"
              maxLength={80}
              disabled={!!account}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account-bank">Banco</Label>
            <Select value={bank} onValueChange={setBank}>
              <SelectTrigger id="account-bank">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="account-currency">Moneda</Label>
              <Select value={currency} onValueChange={setCurrency} disabled={!!account}>
                <SelectTrigger id="account-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEN">Soles (PEN)</SelectItem>
                  <SelectItem value="USD">Dólares (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account-amount">Monto</Label>
              <MoneyInput id="account-amount" value={amount} onValueChange={setAmount} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
