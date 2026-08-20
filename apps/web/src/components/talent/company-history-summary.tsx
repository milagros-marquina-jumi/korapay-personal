'use client';

import { formatMoney } from '@korapay/domain';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TalentContract } from '@/lib/api.types';
import { cn, formatDate, formatDurationExact } from '@/lib/utils';

interface Props {
  contracts: TalentContract[];
}

const DIA_MS = 86_400_000;

function diasEntre(desde: string, hasta?: string | null) {
  const inicio = new Date(desde).getTime();
  const fin = hasta ? new Date(hasta).getTime() : Date.now();
  return Math.max(0, Math.round((fin - inicio) / DIA_MS));
}

function fin(fila: { activo: boolean; hasta?: string | null }) {
  if (fila.activo) return 'hoy';
  return fila.hasta ? formatDate(fila.hasta) : '—';
}

function mesesDe(dias: number) {
  const meses = Math.round(dias / 30.44);
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  const anios = Math.floor(meses / 12);
  const resto = meses % 12;
  const parteAnios = `${anios} ${anios === 1 ? 'año' : 'años'}`;
  return resto ? `${parteAnios} y ${resto} ${resto === 1 ? 'mes' : 'meses'}` : parteAnios;
}

export function CompanyHistorySummary({ contracts }: Readonly<Props>) {
  if (!contracts.length) return null;

  const filas = contracts
    .map((c) => ({
      id: c.id,
      empresa: c.companyName ?? 'Sin empresa',
      cliente: c.clientName,
      cargo: c.position,
      desde: c.startDate,
      hasta: c.endDate,
      activo: c.status === 'ACTIVE',
      dias: diasEntre(c.startDate, c.status === 'ACTIVE' ? null : c.endDate),
      rate: c.rate,
      currency: (c.currency as 'PEN' | 'USD') ?? 'PEN',
    }))
    .sort((a, b) => b.dias - a.dias);

  const maxDias = Math.max(...filas.map((f) => f.dias), 1);
  const totalDias = filas.reduce((s, f) => s + f.dias, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="size-4 text-muted-foreground" />
          Tiempo por empresa ({filas.length})
        </CardTitle>
        <span className="text-right text-muted-foreground text-xs">{mesesDe(totalDias)} de trabajo acumulado</span>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3">Empresa / Cliente</th>
                <th className="p-3">Cargo</th>
                <th className="p-3">Periodo</th>
                <th className="p-3">Tiempo</th>
                <th className="p-3 text-right">Sueldo</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.id} className={cn('border-b last:border-0', f.activo && 'bg-brand/5')}>
                  <td className="p-3">
                    <span className="font-medium">{f.empresa}</span>
                    {f.cliente && <span className="text-muted-foreground"> / {f.cliente}</span>}
                    {f.activo && (
                      <span className="ml-2 rounded bg-success/15 px-1.5 py-0.5 font-medium text-[10px] text-success">
                        Activo
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{f.cargo ?? '—'}</td>
                  <td className="whitespace-nowrap p-3 text-muted-foreground text-xs">
                    {formatDate(f.desde)} — {fin(f)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn('h-full rounded-full', f.activo ? 'bg-brand' : 'bg-brand/40')}
                          style={{ width: `${Math.max(3, (f.dias / maxDias) * 100)}%` }}
                        />
                      </div>
                      <span className="whitespace-nowrap font-medium">
                        {formatDurationExact(f.desde, f.activo ? null : f.hasta)}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap p-3 text-right tabular-nums">
                    {f.rate ? formatMoney(f.rate, f.currency) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-muted-foreground text-xs">
          Ordenado de la estadía más larga a la más corta. Los contratos activos cuentan hasta hoy.
        </p>
      </CardContent>
    </Card>
  );
}
