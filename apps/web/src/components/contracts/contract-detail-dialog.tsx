'use client';

import { formatMoney } from '@korapay/domain';
import { StatusBadge } from '@korapay/ui';
import { SequenceBadge } from '@/components/contracts/sequence-badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { EmploymentContract } from '@/lib/api.types';
import { cn, formatDateLong, formatDurationExact } from '@/lib/utils';

interface Props {
  contract: EmploymentContract | null;
  onOpenChange: (open: boolean) => void;
}

export function ContractDetailDialog({ contract, onOpenChange }: Readonly<Props>) {
  const propio = contract?.salary;
  const derivado = contract?.grossSalary;
  const salario = propio ?? derivado;
  const moneda = (contract?.currency ?? 'PEN') as 'PEN' | 'USD';

  return (
    <Dialog open={contract !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {contract && (
          <>
            <DialogHeader className="space-y-1">
              <DialogTitle className="flex flex-wrap items-center gap-2 pr-6 text-lg leading-tight">
                {contract.companyName ?? 'Sin empresa'}
                <SequenceBadge sequence={contract.sequence} total={contract.sequenceTotal} />
              </DialogTitle>
              <DialogDescription>{contract.position || 'Sin cargo registrado'}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Salario bruto</p>
                <p className="font-semibold text-2xl tabular-nums">{salario ? formatMoney(salario, moneda) : '—'}</p>
                {salario && !propio && <p className="mt-0.5 text-muted-foreground text-xs">Según sus pagos</p>}
              </div>
              <StatusBadge status={contract.status} />
            </div>

            <dl className="divide-y rounded-xl border text-sm">
              <Linea label="Inicio" value={formatDateLong(contract.startDate)} />
              <Linea label="Fin" value={contract.endDate ? formatDateLong(contract.endDate) : 'Sigue activo'} />
              <Linea label="Duración" value={formatDurationExact(contract.startDate, contract.endDate)} />
              <Linea label="Tipo de pago" value={contract.type || '—'} />
              <Linea label="Clientes" value={(contract.clients ?? []).map((c) => c.name).join(', ') || '—'} />
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
