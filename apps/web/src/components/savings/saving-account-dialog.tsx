'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { CurrencyToggle } from '@/components/ui/currency-toggle';
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
import { SearchSelect } from '@/components/ui/search-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import type { BankCatalog, SavingBalanceAccount, SavingBucket } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const NO_BANK = '__none__';
const NUEVA = '__nueva__';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  periodLabel: string;
  account?: SavingBalanceAccount;
  existingBuckets?: string[];
}

export function SavingAccountDialog({
  open,
  onOpenChange,
  year,
  month,
  periodLabel,
  account,
  existingBuckets,
}: Readonly<Props>) {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const [seleccion, setSeleccion] = useState(NUEVA);
  const [bucket, setBucket] = useState('');
  const [bank, setBank] = useState(NO_BANK);
  const [currency, setCurrency] = useState('PEN');
  const [amount, setAmount] = useState('0');

  const { data: banks } = useQuery({
    queryKey: queryKeys.banks(),
    queryFn: () => apiFetch<BankCatalog[]>('/banks'),
    enabled: open,
  });

  const { data: buckets } = useQuery({
    queryKey: queryKeys.savingBuckets(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<SavingBucket[]>(`/saving-balances/buckets?workspaceId=${activeWorkspaceId}`),
    enabled: open && !account && !!activeWorkspaceId,
  });

  const disponibles = (buckets ?? []).filter((b) => !(existingBuckets ?? []).includes(`${b.bucket}|${b.currency}`));

  useEffect(() => {
    if (!open) return;
    setSeleccion(NUEVA);
    setBucket(account?.bucket ?? '');
    setBank(account?.bank || NO_BANK);
    setCurrency(account?.currency ?? 'PEN');
    setAmount(account?.amount ?? '0');
  }, [open, account]);

  const elegirCuenta = (valor: string) => {
    setSeleccion(valor);
    if (valor === NUEVA) {
      setBucket('');
      setBank(NO_BANK);
      setCurrency('PEN');
      return;
    }
    const elegida = disponibles.find((b) => `${b.bucket}|${b.currency}` === valor);
    if (!elegida) return;
    setBucket(elegida.bucket);
    setBank(elegida.bank || NO_BANK);
    setCurrency(elegida.currency);
  };

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
            {account ? (
              <Input id="account-bucket" value={bucket} disabled />
            ) : (
              <SearchSelect
                options={disponibles.map((b) => ({
                  value: `${b.bucket}|${b.currency}`,
                  label: b.currency === 'USD' ? `${b.bucket} (USD)` : b.bucket,
                }))}
                value={seleccion === NUEVA ? undefined : seleccion}
                onValueChange={elegirCuenta}
                placeholder="Busca o crea una cuenta"
                searchPlaceholder="Buscar cuenta..."
                onCreate={(nombre) => {
                  setSeleccion(NUEVA);
                  setBucket(nombre);
                  setBank(NO_BANK);
                  setCurrency('PEN');
                }}
                createLabel="Crear cuenta"
              />
            )}
            {!account && seleccion === NUEVA && bucket && (
              <p className="text-muted-foreground text-xs">Se creará la cuenta "{bucket}".</p>
            )}
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

          <div className="space-y-1.5">
            <Label htmlFor="account-amount">Monto</Label>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <MoneyInput id="account-amount" value={amount} onValueChange={setAmount} />
              </div>
              {account || seleccion !== NUEVA ? null : (
                <CurrencyToggle value={currency as 'PEN' | 'USD'} onChange={(v) => setCurrency(v)} />
              )}
            </div>
            {(account || seleccion !== NUEVA) && (
              <p className="text-muted-foreground text-xs">Moneda: {currency}. No se puede cambiar.</p>
            )}
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
