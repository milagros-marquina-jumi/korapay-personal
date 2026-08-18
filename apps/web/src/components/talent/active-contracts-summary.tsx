'use client';

import { formatMoney } from '@korapay/domain';
import { Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TalentContract } from '@/lib/api.types';
import { diasParaVencer } from '@/lib/contract-expiry';
import { cn, formatDate, formatDurationDaysCompact, formatDurationExact } from '@/lib/utils';

interface Props {
  contracts: TalentContract[];
}

/** Resumen de los trabajos vigentes: cuanto lleva, cuanto falta y cuanto suma. */
export function ActiveContractsSummary({ contracts }: Readonly<Props>) {
  const activos = contracts.filter((c) => c.status === 'ACTIVE');
  if (!activos.length) return null;

  const porMoneda = new Map<string, number>();
  for (const c of activos) {
    const cur = (c.currency as string) || 'PEN';
    porMoneda.set(cur, (porMoneda.get(cur) ?? 0) + Number(c.rate ?? 0));
  }
  const sinSueldo = activos.filter((c) => !c.rate).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="size-4 text-muted-foreground" />
          Trabajos activos ({activos.length})
        </CardTitle>
        <span className="text-right">
          {[...porMoneda.entries()].map(([cur, total]) => (
            <span key={cur} className="ml-3 font-semibold tabular-nums">
              {formatMoney(String(total), cur as 'PEN' | 'USD')}
            </span>
          ))}
          <span className="block text-[11px] text-muted-foreground">
            {sinSueldo > 0 ? `${sinSueldo} sin sueldo registrado` : 'suma de sueldos'}
          </span>
        </span>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3">Empresa / Cliente</th>
                <th className="p-3">Cargo</th>
                <th className="p-3">Desde</th>
                <th className="p-3">Lleva</th>
                <th className="p-3">Vence</th>
                <th className="p-3 text-right">Sueldo</th>
              </tr>
            </thead>
            <tbody>
              {activos.map((c) => {
                const v = diasParaVencer(c.endDate);
                return (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="p-3">
                      <span className="font-medium">{c.companyName ?? 'Sin empresa'}</span>
                      {c.clientName && <span className="text-muted-foreground"> / {c.clientName}</span>}
                    </td>
                    <td className="p-3 text-muted-foreground">{c.position ?? '—'}</td>
                    <td className="whitespace-nowrap p-3 text-muted-foreground">{formatDate(c.startDate)}</td>
                    <td className="whitespace-nowrap p-3">{formatDurationExact(c.startDate, null)}</td>
                    <td className="whitespace-nowrap p-3">
                      {!v && <span className="text-muted-foreground">Sin plazo</span>}
                      {v?.vencido && (
                        <span className="font-medium text-destructive">
                          Venció hace {formatDurationDaysCompact(Math.abs(v.dias))}
                        </span>
                      )}
                      {v && !v.vencido && (
                        <span className={cn('font-medium', v.porVencer && 'text-warning')}>
                          {v.dias === 0 ? 'Hoy' : `En ${formatDurationDaysCompact(v.dias)}`}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap p-3 text-right font-medium tabular-nums">
                      {c.rate ? formatMoney(c.rate, (c.currency as 'PEN' | 'USD') ?? 'PEN') : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
