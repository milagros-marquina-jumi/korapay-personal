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
  const totalRecibido = distribuciones.reduce((sum, d) => sum + Number(d.amountReceived ?? 0), 0);
  const totalTalento = distribuciones.reduce((sum, d) => sum + Number(d.amountRetained ?? 0), 0);

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
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Sueldo</p>
                <p className="font-semibold text-2xl tabular-nums">
                  {contract.rate ? formatMoney(contract.rate, moneda) : '—'}
                </p>
                {contract.paymentType && <p className="mt-0.5 text-muted-foreground text-xs">{contract.paymentType}</p>}
              </div>
              <StatusBadge status={contract.status} />
            </div>

            <dl className="divide-y rounded-xl border text-sm">
              <Linea label="Cargo" value={contract.position || '—'} />
              <Linea label="Empresa" value={contract.companyName || '—'} />
              <Linea label="Cliente" value={contract.clientName || '—'} />
              <Linea label="Tipo de pago" value={contract.paymentType || '—'} />
              <Linea label="Inicio" value={formatDateLong(contract.startDate)} />
              <Linea label="Fin" value={contract.endDate ? formatDateLong(contract.endDate) : 'Sigue activo'} />
              <Linea label="Duración" value={formatDurationExact(contract.startDate, contract.endDate)} />
              <Linea label="Plazo del contrato" value={contract.contractTerm || '—'} />
              {contract.sequenceIndex && (contract.sequenceTotal ?? 1) > 1 ? (
                <Linea
                  label="Contrato con esta empresa"
                  value={`${contract.sequenceIndex} de ${contract.sequenceTotal}`}
                />
              ) : null}
              <Linea label="Pagos registrados" value={String(distribuciones.length)} />
              {distribuciones.length > 0 && (
                <>
                  <Linea label="Total recibido (MIMOTECH)" value={formatMoney(String(totalRecibido), moneda)} />
                  <Linea label="Total del talento" value={formatMoney(String(totalTalento), moneda)} />
                </>
              )}
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
