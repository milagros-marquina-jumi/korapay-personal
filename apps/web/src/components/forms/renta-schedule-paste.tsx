'use client';

import { formatMoney, parseTaxSchedule, scheduleTotals } from '@korapay/domain';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ClipboardPaste } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { TaxObligation } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

interface Props {
  workspaceId: string;
  obligation: TaxObligation;
}

const EJEMPLO = `1   31/07/2025   1,419.00   144.00   1,563.00
2   29/08/2025   1,429.00   117.00   1,546.00`;

// Un fraccionamiento puede llegar a 72 cuotas (~55 caracteres cada una) y el
// texto del PDF arrastra cabecera y notas.
const MAX_CRONOGRAMA = 8000;

export function RentaSchedulePaste({ workspaceId, obligation }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState('');
  const queryClient = useQueryClient();

  const { rows, warnings } = useMemo(() => parseTaxSchedule(texto), [texto]);
  const totals = useMemo(() => scheduleTotals(rows), [rows]);

  const guardar = useMutation({
    mutationFn: () =>
      apiFetch<TaxObligation>(`/tax-obligations/${obligation.id}?workspaceId=${workspaceId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          schedule: rows.map((r) => ({
            number: r.number,
            dueDate: r.dueDate ?? undefined,
            principalAmount: r.principalAmount,
            interestAmount: r.interestAmount,
          })),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taxObligations(workspaceId) });
      toast.success(`Cronograma cargado: ${rows.length} cuotas.`);
      setTexto('');
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ClipboardPaste className="mr-2 size-4" />
          Pegar cronograma
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pegar cronograma de SUNAT</DialogTitle>
          <DialogDescription>
            Copia el cuadro de cuotas de tu resolución de SUNAT (Anexo N.º 2) y pégalo aquí. Puedes pegarlo tal cual
            sale del PDF, de una tabla o de Excel.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={14}
          // El limite por defecto (500) corta un cronograma de 12 cuotas.
          maxLength={MAX_CRONOGRAMA}
          placeholder={EJEMPLO}
          className="max-h-[40vh] min-h-56 resize-y whitespace-pre font-mono text-xs leading-relaxed"
          aria-label="Cronograma pegado"
        />

        {texto.trim() && (
          <div className="space-y-3">
            {warnings.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/8 p-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden="true" />
                <ul className="min-w-0 space-y-0.5 text-warning-foreground text-xs">
                  {warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {rows.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-4">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Cuotas</p>
                    <p className="font-semibold text-sm tabular-nums">{rows.length}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Deuda original</p>
                    <p className="font-semibold text-sm tabular-nums">{formatMoney(totals.principal, 'PEN')}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Interés</p>
                    <p className="font-semibold text-sm text-warning-foreground tabular-nums">
                      +{formatMoney(totals.interest, 'PEN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Total</p>
                    <p className="font-semibold text-sm tabular-nums">{formatMoney(totals.total, 'PEN')}</p>
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto rounded-lg border">
                  <table className="w-full text-xs">
                    {/* Opaco: si no, las filas se transparentan por debajo al hacer scroll. */}
                    <thead className="sticky top-0 bg-card shadow-[inset_0_-1px_0_var(--color-border)]">
                      <tr className="text-left text-muted-foreground">
                        <th className="px-2 py-1.5 font-medium">#</th>
                        <th className="px-2 py-1.5 font-medium">Vence</th>
                        <th className="px-2 py-1.5 text-right font-medium">Deuda</th>
                        <th className="px-2 py-1.5 text-right font-medium">Interés</th>
                        <th className="px-2 py-1.5 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {rows.map((r) => (
                        <tr key={r.number}>
                          <td className="px-2 py-1.5 tabular-nums">{r.number}</td>
                          <td className="px-2 py-1.5">{r.dueDate ? formatDate(r.dueDate) : '—'}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums">
                            {formatMoney(r.principalAmount, 'PEN')}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums">
                            {formatMoney(r.interestAmount, 'PEN')}
                          </td>
                          <td className="px-2 py-1.5 text-right font-medium tabular-nums">
                            {formatMoney(r.total, 'PEN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={!rows.length || guardar.isPending} onClick={() => guardar.mutate()}>
            {guardar.isPending ? 'Guardando…' : `Cargar ${rows.length || ''} cuotas`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
