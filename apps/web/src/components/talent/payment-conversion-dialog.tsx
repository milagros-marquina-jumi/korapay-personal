'use client';

import { formatMoney } from '@korapay/domain';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { TalentIncomeDistribution } from '@/lib/api.types';
import { formatDate, formatMonthYear } from '@/lib/utils';

interface Props {
  distribution: TalentIncomeDistribution | null;
  rate: string | null;
  rateDate?: string | null;
  onOpenChange: (open: boolean) => void;
}

export function PaymentConversionDialog({ distribution, rate, rateDate, onOpenChange }: Readonly<Props>) {
  const tipoCambio = Number(rate ?? 0);
  const enSoles = (v: string) => (tipoCambio ? formatMoney((Number(v) * tipoCambio).toFixed(2), 'PEN') : '—');

  return (
    <Dialog open={distribution !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conversión a soles</DialogTitle>
          <DialogDescription className="capitalize">
            {distribution
              ? `${distribution.paymentType}${distribution.date ? ` · ${formatMonthYear(distribution.date)}` : ''}`
              : 'Pago'}
          </DialogDescription>
        </DialogHeader>
        {distribution && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-4 rounded-xl border px-4 py-2.5 text-sm">
              <span className="text-muted-foreground text-xs">
                {rateDate ? `Tipo de cambio del ${formatDate(rateDate)}` : 'Tipo de cambio'}
              </span>
              <span className="font-medium tabular-nums">
                {tipoCambio ? `S/ ${tipoCambio.toFixed(3)}` : 'Sin tipo de cambio'}
              </span>
            </div>
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Concepto</th>
                    <th className="px-4 py-2 text-right font-medium">Dólares</th>
                    <th className="px-4 py-2 text-right font-medium">Soles</th>
                  </tr>
                </thead>
                <tbody>
                  <Fila
                    label="Con descuento"
                    usd={distribution.amountWithDiscount}
                    pen={enSoles(distribution.amountWithDiscount)}
                  />
                  <Fila
                    label="Recibí (MIMOTECH)"
                    usd={distribution.amountReceived}
                    pen={enSoles(distribution.amountReceived)}
                  />
                  <Fila
                    label="Se quedó (talento)"
                    usd={distribution.amountRetained}
                    pen={enSoles(distribution.amountRetained)}
                  />
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Referencial: usa el tipo de cambio de hoy, no el de la fecha del pago.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Fila({ label, usd, pen }: Readonly<{ label: string; usd: string; pen: string }>) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-2.5 text-muted-foreground text-xs">{label}</td>
      <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium tabular-nums">{formatMoney(usd, 'USD')}</td>
      <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold text-brand tabular-nums">{pen}</td>
    </tr>
  );
}
