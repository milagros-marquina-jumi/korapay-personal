'use client';

import { formatMoney } from '@korapay/domain';
import { TrendingUp } from 'lucide-react';
import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { TalentGlobalReport } from '@/lib/api.types';

interface Props {
  projection: TalentGlobalReport['projection'];
}

export function GlobalProjectionDialog({ projection }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const money = (v: string | number) => formatMoney(String(v), 'PEN');

  const porTalento = new Map<string, { received: number; retained: number; contratos: number }>();
  for (const r of projection.rows) {
    const fila = porTalento.get(r.talent) ?? { received: 0, retained: 0, contratos: 0 };
    fila.received += Number(r.received);
    fila.retained += Number(r.retained);
    fila.contratos += 1;
    porTalento.set(r.talent, fila);
  }
  const talentos = [...porTalento.entries()].sort((a, b) => b[1].received - a[1].received);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <TrendingUp className="mr-1 size-4" /> Proyección
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Proyección de {projection.label}</DialogTitle>
          <DialogDescription>
            Estimado a partir del último pago mensual de cada contrato vigente. No incluye CTS, gratificaciones ni
            liquidaciones.
          </DialogDescription>
        </DialogHeader>

        {projection.rows.length ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-info/5 p-3">
                <p className="text-muted-foreground text-xs">Recibiré (MIMOTECH)</p>
                <p className="font-display font-bold text-2xl text-info tabular-nums">
                  {money(projection.totalReceived)}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-muted-foreground text-xs">Se quedarán (talentos)</p>
                <p className="font-display font-bold text-2xl tabular-nums">{money(projection.totalRetained)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-muted-foreground text-xs">Facturado</p>
                <p className="font-display font-bold text-2xl text-muted-foreground tabular-nums">
                  {money(projection.totalWithDiscount)}
                </p>
              </div>
            </div>

            <div className="max-h-[45vh] overflow-y-auto rounded-lg border">
              <table className="w-full table-fixed text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="w-[6%] p-3" />
                    <th className="w-[42%] p-3">Contrato</th>
                    <th className="w-[18%] p-3">Según</th>
                    <th className="w-[34%] p-3 text-right">Recibiré</th>
                  </tr>
                </thead>
                <tbody>
                  {talentos.map(([nombre, tot]) => (
                    <Fragment key={nombre}>
                      <tr className="border-b bg-muted/40">
                        <td className="p-2 font-semibold" colSpan={3}>
                          {nombre}{' '}
                          <span className="font-normal text-muted-foreground text-xs">
                            ({tot.contratos} {tot.contratos === 1 ? 'contrato' : 'contratos'})
                          </span>
                        </td>
                        <td className="p-2 text-right font-semibold text-info tabular-nums">{money(tot.received)}</td>
                      </tr>
                      {projection.rows
                        .filter((r) => r.talent === nombre)
                        .map((r) => (
                          <tr key={r.talentId} className="border-b last:border-0">
                            <td className="p-3" />
                            <td className="p-3">
                              <span className="block truncate font-medium" title={r.company}>
                                {r.company}
                              </span>
                              {r.client && (
                                <span className="block truncate text-muted-foreground text-xs" title={r.client}>
                                  {r.client}
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap p-3 text-muted-foreground text-xs">{r.from}</td>
                            <td className="whitespace-nowrap p-3 text-right tabular-nums">{money(r.received)}</td>
                          </tr>
                        ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="py-8 text-center text-muted-foreground text-sm">
            No hay contratos vigentes con pagos mensuales previos para proyectar.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
