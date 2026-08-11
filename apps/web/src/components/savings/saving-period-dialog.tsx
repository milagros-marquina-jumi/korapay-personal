'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { IconAction } from '@/components/ui/icon-action';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import type { BankCatalog, SavingBucket, SavingLastPeriod } from '@/lib/api.types';
import { MONTH_NAMES } from '@/lib/months';
import { queryKeys } from '@/lib/query-keys';

const NO_BANK = '__none__';

interface DraftAccount {
  bucket: string;
  bank: string | null;
  currency: string;
  amount: string;
  selected: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function nextPeriod(last: SavingLastPeriod | null) {
  if (!last) {
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  }
  return last.month === 12 ? { year: last.year + 1, month: 1 } : { year: last.year, month: last.month + 1 };
}

export function SavingPeriodDialog({ open, onOpenChange }: Readonly<Props>) {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const [year, setYear] = useState<number>(new Date().getUTCFullYear());
  const [month, setMonth] = useState<number>(new Date().getUTCMonth() + 1);
  const [accounts, setAccounts] = useState<DraftAccount[]>([]);
  const [newBucket, setNewBucket] = useState('');
  const [newBank, setNewBank] = useState(NO_BANK);

  const { data: banks } = useQuery({
    queryKey: queryKeys.banks(),
    queryFn: () => apiFetch<BankCatalog[]>('/banks'),
    enabled: open,
  });

  const { data: buckets } = useQuery({
    queryKey: queryKeys.savingBuckets(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<SavingBucket[]>(`/saving-balances/buckets?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId && open,
  });

  const { data: last } = useQuery({
    queryKey: queryKeys.savingLastPeriod(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<SavingLastPeriod | null>(`/saving-balances/last-period?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId && open,
  });

  useEffect(() => {
    if (!open || !buckets) return;
    const target = nextPeriod(last ?? null);
    setYear(target.year);
    setMonth(target.month);
    setAccounts(
      buckets.map((b) => {
        const _previous = last?.accounts.find((a) => a.bucket === b.bucket && a.currency === b.currency);
        return {
          bucket: b.bucket,
          bank: b.bank ?? null,
          currency: b.currency,
          amount: '0',
          selected: false,
        };
      }),
    );
  }, [open, buckets, last]);

  const createMutation = useMutation({
    mutationFn: (payload: { year: number; month: number; accounts: Omit<DraftAccount, 'selected'>[] }) =>
      apiFetch('/saving-balances/periods', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: activeWorkspaceId,
          year: payload.year,
          month: payload.month,
          accounts: payload.accounts.map((a) => ({
            bucket: a.bucket,
            bank: a.bank ?? undefined,
            currency: a.currency,
            amount: a.amount || '0',
          })),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saving-balances', activeWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingBuckets(activeWorkspaceId ?? '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingLastPeriod(activeWorkspaceId ?? '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.savingYearlyPivot(activeWorkspaceId ?? '') });
      toast.success('Periodo creado');
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (index: number) =>
    setAccounts((prev) => prev.map((a, i) => (i === index ? { ...a, selected: !a.selected } : a)));

  const setAmount = (index: number, amount: string) =>
    setAccounts((prev) => prev.map((a, i) => (i === index ? { ...a, amount } : a)));

  const addBucket = () => {
    const name = newBucket.trim();
    if (!name) return;
    if (accounts.some((a) => a.bucket.toLowerCase() === name.toLowerCase())) {
      toast.error('Esa cuenta ya está en la lista');
      return;
    }
    setAccounts((prev) => [
      ...prev,
      { bucket: name, bank: newBank === NO_BANK ? null : newBank, currency: 'PEN', amount: '0', selected: true },
    ]);
    setNewBucket('');
    setNewBank(NO_BANK);
  };

  const removeDraft = (index: number) => setAccounts((prev) => prev.filter((_, i) => i !== index));

  const selected = accounts.filter((a) => a.selected);

  const submit = () => {
    if (!selected.length) {
      toast.error('Selecciona al menos una cuenta');
      return;
    }
    createMutation.mutate({
      year,
      month,
      accounts: selected.map(({ selected: _s, ...rest }) => rest),
    });
  };

  const years = Array.from({ length: 8 }, (_, i) => new Date().getUTCFullYear() - 4 + i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo periodo de ahorros</DialogTitle>
          <DialogDescription>
            Elige el mes y marca las cuentas que quieres registrar. Los montos vienen del último periodo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="saving-year">Año</Label>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger id="saving-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="saving-month">Mes</Label>
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger id="saving-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cuentas ({selected.length} seleccionadas)</Label>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-xl border p-2">
            {accounts.length === 0 && (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No hay cuentas previas. Agrega la primera abajo.
              </p>
            )}
            {accounts.map((account, index) => (
              <div
                key={`${account.bucket}-${account.currency}`}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60"
              >
                <Checkbox
                  id={`acc-${account.bucket}-${account.currency}`}
                  checked={account.selected}
                  onCheckedChange={() => toggle(index)}
                />
                <Label
                  htmlFor={`acc-${account.bucket}-${account.currency}`}
                  className="flex min-w-0 flex-1 items-center gap-2 font-normal"
                >
                  <span className="truncate text-sm font-medium">{account.bucket}</span>
                  {account.bank && <span className="shrink-0 text-xs text-muted-foreground">{account.bank}</span>}
                  {account.currency === 'USD' && (
                    <span className="shrink-0 rounded bg-brand/10 px-1 text-[10px] font-medium text-brand">USD</span>
                  )}
                </Label>
                <MoneyInput
                  value={account.amount}
                  onValueChange={(v) => setAmount(index, v)}
                  className={account.selected ? 'w-36' : 'pointer-events-none w-36 opacity-40'}
                />
                <IconAction icon={Trash2} label="Quitar de la lista" destructive onClick={() => removeDraft(index)} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="new-bucket">Agregar cuenta</Label>
            <Input
              id="new-bucket"
              value={newBucket}
              onChange={(e) => setNewBucket(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addBucket();
                }
              }}
              placeholder="Ej. Ahorro (BCP)"
              maxLength={80}
            />
          </div>
          <div className="w-44 space-y-1.5">
            <Label htmlFor="new-bank">Banco</Label>
            <Select value={newBank} onValueChange={setNewBank}>
              <SelectTrigger id="new-bank">
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
          <Button type="button" variant="secondary" onClick={addBucket}>
            <Plus className="mr-1 h-4 w-4" /> Agregar
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={createMutation.isPending || !selected.length}>
            {createMutation.isPending ? 'Creando...' : 'Crear periodo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
