'use client';

import { formatMoney } from '@korapay/domain';
import { TrendingUp } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { TalentContract } from '@/lib/api.types';
import { proyectarMesActual } from '@/lib/payment-projection';

interface Props {
  contracts: TalentContract[];
  trigger?: ReactNode;
}

export function ProjectedPaymentDialog({ contracts, trigger }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const proyeccion = proyectarMesActual(contracts);
  const money = (v: number) => formatMoney(String(v), 'PEN');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <TrendingUp className="mr-1 size-4" /> Proyección
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Proyección de {proyeccion.etiqueta}</DialogTitle>
          <DialogDescription>
            Lo que falta cobrar este mes, estimado con el último pago de cada contrato vigente. No incluye CTS,
            gratificaciones ni liquidaciones.
          </DialogDescription>
        </DialogHeader>

        {proyeccion.filas.length ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-info/5 p-3">
                <p className="text-muted-foreground text-xs">Recibiré (MIMOTECH)</p>
                <p className="font-display font-bold text-2xl text-info tabular-nums">
                  {money(proyeccion.totalRecibi)}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-muted-foreground text-xs">Se quedarán (talento)</p>
                <p className="font-display font-bold text-2xl tabular-nums">{money(proyeccion.totalQuedo)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-muted-foreground text-xs">Facturado</p>
                <p className="font-display font-bold text-2xl text-muted-foreground tabular-nums">
                  {money(proyeccion.totalBase)}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="w-[38%] p-3">Contrato</th>
                    <th className="w-[16%] p-3">Según</th>
                    <th className="w-[23%] p-3 text-right">Recibiré</th>
                    <th className="w-[23%] p-3 text-right">Se quedará</th>
                  </tr>
                </thead>
                <tbody>
                  {proyeccion.filas.map((f) => (
                    <tr key={f.contractId} className="border-b last:border-0">
                      <td className="p-3">
                        <span className="block truncate font-medium" title={f.empresa}>
                          {f.empresa}
                        </span>
                      </td>
                      <td className="whitespace-nowrap p-3 text-muted-foreground text-xs">{f.desdePeriodo}</td>
                      <td className="whitespace-nowrap p-3 text-right font-medium text-info tabular-nums">
                        {money(f.recibi)}
                      </td>
                      <td className="whitespace-nowrap p-3 text-right tabular-nums">{money(f.quedo)}</td>
                    </tr>
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
