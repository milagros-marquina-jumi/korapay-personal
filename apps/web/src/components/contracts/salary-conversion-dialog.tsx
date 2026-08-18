'use client';

import { formatMoney } from '@korapay/domain';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';

interface SalaryConversionContract {
  companyName?: string | null;
  salary?: string | null;
  grossSalary?: string | null;
}

interface Props {
  contract: SalaryConversionContract | null;
  rate: string | null;
  rateDate?: string | null;
  onOpenChange: (open: boolean) => void;
}

export function SalaryConversionDialog({ contract, rate, rateDate, onOpenChange }: Readonly<Props>) {
  const dolares = contract?.salary ?? contract?.grossSalary ?? '0';
  const tipoCambio = Number(rate ?? 0);
  const soles = (Number(dolares) * tipoCambio).toFixed(2);

  return (
    <Dialog open={contract !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conversión a soles</DialogTitle>
          <DialogDescription>{contract?.companyName ?? 'Contrato'}</DialogDescription>
        </DialogHeader>
        {contract && (
          <div className="space-y-3">
            <dl className="divide-y rounded-xl border text-sm">
              <Linea label="Salario en dólares" value={formatMoney(dolares, 'USD')} />
              <Linea
                label={rateDate ? `Tipo de cambio del ${formatDate(rateDate)}` : 'Tipo de cambio'}
                value={tipoCambio ? `S/ ${tipoCambio.toFixed(3)}` : 'Sin tipo de cambio'}
              />
            </dl>
            <div className="flex items-end justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Equivale a</p>
              <p className="font-semibold text-2xl text-brand tabular-nums">{formatMoney(soles, 'PEN')}</p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Referencial: usa el tipo de cambio de hoy, no el de cada pago.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Linea({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="min-w-0 text-muted-foreground text-xs">{label}</dt>
      <dd className="shrink-0 text-right font-medium tabular-nums">{value}</dd>
    </div>
  );
}
