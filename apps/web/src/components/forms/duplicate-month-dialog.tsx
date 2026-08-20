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
import { MONTH_NAMES } from '@/lib/months';

interface Props {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: { year: number; month: number; count: number } | null;
  type?: string;
}

interface DuplicateMonthResult {
  copiadas: number;
  omitidas: number;
  total: number;
}

export function DuplicateMonthDialog({ workspaceId, open, onOpenChange, source, type }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [month, setMonth] = useState(new Date().getUTCMonth() + 1);

  useEffect(() => {
    if (!open || !source) return;
    const siguiente = source.month + 1;
    setYear(siguiente > 12 ? source.year + 1 : source.year);
    setMonth(siguiente > 12 ? 1 : siguiente);
  }, [open, source]);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<DuplicateMonthResult>(`/transactions/duplicate-month?workspaceId=${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify({
          sourceYear: source?.year,
          sourceMonth: source?.month,
          targetYear: year,
          targetMonth: month,
          ...(type && { type }),
        }),
      }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', workspaceId] });
      const destino = `${MONTH_NAMES[month - 1]} ${year}`;
      if (r.copiadas === 0) toast.info(`Todo ya existía en ${destino}. No se copió nada.`);
      else if (r.omitidas > 0) toast.success(`${r.copiadas} copiados a ${destino}. ${r.omitidas} ya existían.`);
      else toast.success(`${r.copiadas} copiados a ${destino}`);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const years = Array.from({ length: 6 }, (_, i) => new Date().getUTCFullYear() - 2 + i);
  const mismoMes = source?.year === year && source?.month === month;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copiar el mes completo</DialogTitle>
          <DialogDescription>
            {source
              ? `Se copiarán los ${source.count} costos de ${MONTH_NAMES[source.month - 1]} ${source.year} como pendientes en el mes que elijas.`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="dup-year">Año destino</Label>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger id="dup-year">
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
            <Label htmlFor="dup-month">Mes destino</Label>
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger id="dup-month">
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

        {mismoMes && <p className="text-destructive text-xs">Elige un mes distinto al de origen.</p>}
        <p className="text-muted-foreground text-xs">Los costos que ya existan en el mes destino no se duplican.</p>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || mismoMes || !source}>
            {mutation.isPending ? 'Copiando...' : 'Copiar mes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
