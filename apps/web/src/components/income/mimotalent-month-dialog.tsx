'use client';

import { formatMoney } from '@korapay/domain';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { TalentGlobalReport } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';

export interface MimotalentMonthSelection {
  year: number;
  month: number;
  registered: number;
}

interface Props {
  selection: MimotalentMonthSelection | null;
  businessWorkspaceId?: string | null;
  onOpenChange: (open: boolean) => void;
}

export function MimotalentMonthDialog({ selection, businessWorkspaceId, onOpenChange }: Readonly<Props>) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.talentGlobalReport(businessWorkspaceId ?? '', { source: 'ingresos' }),
    queryFn: () => apiFetch<TalentGlobalReport>(`/talents/report/global?workspaceId=${businessWorkspaceId}`),
    enabled: !!businessWorkspaceId && selection !== null,
  });

  const period = selection
    ? data?.incomePivot.find((p) => p.year === selection.year && p.month === selection.month)
    : undefined;
  const real = Number(period?.total ?? 0);
  const diferencia = selection ? selection.registered - real : 0;
  const cuadra = Math.abs(diferencia) < 0.01;
  const celdas = [...(period?.cells ?? [])].sort((a, b) => Number(b.amount) - Number(a.amount));

  return (
    <Dialog open={selection !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="capitalize">Mimotalents · {period?.label ?? 'Detalle del mes'}</DialogTitle>
          <DialogDescription>
            Lo que recibió MIMOTECH ese mes por los pagos de los contratos de talentos.
          </DialogDescription>
        </DialogHeader>

        {isLoading && <Skeleton className="h-48 rounded-xl" />}

        {!isLoading && selection && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-muted/30 px-4 py-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Real (Mimotalents)</p>
                <p className="font-semibold text-2xl text-brand tabular-nums">{formatMoney(String(real), 'PEN')}</p>
              </div>
              <div className="rounded-xl border px-4 py-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Registrado aquí</p>
                <p className="font-semibold text-2xl tabular-nums">
                  {formatMoney(String(selection.registered), 'PEN')}
                </p>
              </div>
            </div>

            <p
              className={cn(
                'rounded-lg px-3 py-2 text-xs',
                cuadra ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
              )}
            >
              {cuadra
                ? 'El monto registrado coincide con los pagos reales de los talentos.'
                : `Diferencia de ${formatMoney(String(Math.abs(diferencia)), 'PEN')}: lo registrado en este workspace ${diferencia > 0 ? 'supera' : 'está por debajo de'} la suma real de los pagos de talentos.`}
            </p>

            {celdas.length ? (
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-muted-foreground text-xs">
                      <th className="px-4 py-2 font-medium">Talento</th>
                      <th className="px-4 py-2 text-right font-medium">Recibí (MIMOTECH)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {celdas.map((c) => (
                      <tr key={c.name} className="border-b last:border-0">
                        <td className="px-4 py-2.5">{c.name}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular-nums">
                          {formatMoney(c.amount, 'PEN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-center text-muted-foreground text-sm">
                No hay pagos de talentos registrados en ese mes.
              </p>
            )}

            <p className="text-[11px] text-muted-foreground">
              Fuente: pagos de contratos del workspace MIMOTECH. La fila de ingresos se sincroniza automáticamente con
              estos pagos: para corregirla, corrige el pago del talento.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
