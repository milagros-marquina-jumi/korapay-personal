'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import type { Transaction } from '@/lib/api.types';
import { MONTH_NAMES } from '@/lib/months';

interface Props {
  workspaceId: string;
  transaction: Transaction | null;
  onOpenChange: (open: boolean) => void;
  onDuplicated?: (id: string) => void;
}

export function DuplicateTransactionDialog({ workspaceId, transaction, onOpenChange, onDuplicated }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [month, setMonth] = useState(new Date().getUTCMonth() + 1);

  useEffect(() => {
    if (!transaction) return;
    const source = new Date(transaction.date);
    const nextMonth = source.getUTCMonth() + 2;
    setYear(nextMonth > 12 ? source.getUTCFullYear() + 1 : source.getUTCFullYear());
    setMonth(nextMonth > 12 ? 1 : nextMonth);
  }, [transaction]);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<Transaction>(`/transactions/${transaction?.id}/duplicate?workspaceId=${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify({ year, month }),
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', workspaceId] });
      toast.success(`Copiado a ${MONTH_NAMES[month - 1]} ${year}`);
      onOpenChange(false);
      if (created?.id) onDuplicated?.(created.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const years = Array.from({ length: 6 }, (_, i) => new Date().getUTCFullYear() - 2 + i);

  return (
    <Dialog open={transaction !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copiar movimiento</DialogTitle>
          <DialogDescription>
            Se creará una copia de "{transaction?.concept}" como pendiente en el mes que elijas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="copy-year">Año</Label>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger id="copy-year">
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
            <Label htmlFor="copy-month">Mes</Label>
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger id="copy-month">
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

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Copiando...' : 'Copiar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
