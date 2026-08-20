'use client';

import { formatMoney } from '@korapay/domain';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { TalentGlobalReport } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

export interface MimotalentMonthSelection {
  year: number;
  month: number;
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
    ? data?.monthlyDetail?.find((p) => p.year === selection.year && p.month === selection.month)
    : undefined;
  const talentos = period?.talents ?? [];
  const suma = (campo: 'withDiscount' | 'received' | 'kept') =>
    talentos.reduce((total, t) => total + Number(t[campo]), 0);
  const bruto = suma('withDiscount');
  const recibido = suma('received');
  const seQuedaron = suma('kept');

  return (
    <Dialog open={selection !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="capitalize">Mimotalents · {period?.label ?? 'Detalle del mes'}</DialogTitle>
          <DialogDescription>
            {talentos.length
              ? `${talentos.length} ${talentos.length === 1 ? 'talento generó' : 'talentos generaron'} ingresos este mes.`
              : 'Detalle de los pagos de contratos de talentos.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading && <Skeleton className="h-48 rounded-xl" />}

        {!isLoading && talentos.length > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Bruto</p>
                <p className="font-semibold text-lg tabular-nums">{formatMoney(String(bruto), 'PEN')}</p>
              </div>
              <div className="rounded-xl border bg-muted/30 px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Recibí</p>
                <p className="font-semibold text-brand text-lg tabular-nums">{formatMoney(String(recibido), 'PEN')}</p>
              </div>
              <div className="rounded-xl border px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Se quedaron</p>
                <p className="font-semibold text-lg tabular-nums">{formatMoney(String(seQuedaron), 'PEN')}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground text-xs">
                    <th className="px-4 py-2 font-medium">Talento</th>
                    <th className="px-4 py-2 text-right font-medium">Bruto</th>
                    <th className="px-4 py-2 text-right font-medium">Recibí</th>
                    <th className="px-4 py-2 text-right font-medium">Se quedó</th>
                  </tr>
                </thead>
                <tbody>
                  {talentos.map((t) => (
                    <tr key={t.name} className="border-b last:border-0">
                      <td className="px-4 py-2.5">{t.name}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                        {formatMoney(t.withDiscount, 'PEN')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium text-brand tabular-nums">
                        {formatMoney(t.received, 'PEN')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                        {formatMoney(t.kept, 'PEN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Este ingreso se genera automáticamente desde los pagos de contratos de Mimotalents. Para corregirlo, edita
              el pago del talento en el workspace MIMOTECH.
            </p>
          </div>
        )}

        {!isLoading && talentos.length === 0 && (
          <p className="py-8 text-center text-muted-foreground text-sm">
            No hay pagos de talentos registrados en ese mes.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
