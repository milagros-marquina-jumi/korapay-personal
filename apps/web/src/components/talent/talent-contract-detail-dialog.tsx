'use client';

import { formatMoney } from '@korapay/domain';
import { StatusBadge } from '@korapay/ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { TalentContract } from '@/lib/api.types';
import { cn, formatDateLong, formatDurationExact } from '@/lib/utils';

interface Props {
  contract: TalentContract | null;
  onOpenChange: (open: boolean) => void;
}

export function TalentContractDetailDialog({ contract, onOpenChange }: Readonly<Props>) {
  const moneda = (contract?.currency ?? 'PEN') as 'PEN' | 'USD';
  const distribuciones = contract?.incomeDistributions ?? [];

  return (
    <Dialog open={contract !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {contract && (
          <>
            <DialogHeader className="space-y-1">
              <DialogTitle className="pr-6 text-lg leading-tight">{contract.position ?? 'Contrato'}</DialogTitle>
              <DialogDescription>
                {[contract.companyName, contract.clientName].filter(Boolean).join(' / ') || 'Sin empresa'}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Tarifa</p>
                <p className="font-semibold text-2xl tabular-nums">
                  {contract.rate ? formatMoney(contract.rate, moneda) : '—'}
                </p>
                {contract.paymentType && <p className="mt-0.5 text-muted-foreground text-xs">{contract.paymentType}</p>}
              </div>
              <StatusBadge status={contract.status} />
            </div>

            <dl className="divide-y rounded-xl border text-sm">
              <Linea label="Inicio" value={formatDateLong(contract.startDate)} />
              <Linea label="Fin" value={contract.endDate ? formatDateLong(contract.endDate) : 'Sigue activo'} />
              <Linea label="Duración" value={formatDurationExact(contract.startDate, contract.endDate)} />
              <Linea label="Modalidad" value={contract.contractTerm || '—'} />
              {contract.sequenceIndex ? <Linea label="Contrato N.º" value={String(contract.sequenceIndex)} /> : null}
              <Linea label="Pagos registrados" value={String(distribuciones.length)} />
            </dl>

            {contract.notes && (
              <div className="rounded-xl border px-4 py-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Notas</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{contract.notes}</p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Linea({ label, value }: Readonly<{ label: string; value: string }>) {
  const vacio = !value || value === '—';
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="shrink-0 text-muted-foreground text-xs">{label}</dt>
      <dd
        className={cn('min-w-0 text-right font-medium tabular-nums', vacio && 'font-normal text-muted-foreground/60')}
      >
        {value || '—'}
      </dd>
    </div>
  );
}
