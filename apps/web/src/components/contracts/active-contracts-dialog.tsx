'use client';

import { formatMoney } from '@korapay/domain';
import { StatusBadge } from '@korapay/ui';
import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { EmploymentContract } from '@/lib/api.types';
import { cn, formatDateMedium, formatDaysRemaining, formatDurationExact } from '@/lib/utils';

interface Props {
  contracts: EmploymentContract[];
}

function restanteCorto(days?: number | null): string {
  const texto = formatDaysRemaining(days);
  if (!texto) return 'Sin fecha de fin';
  return texto.replace(/^Faltan /, '');
}

export function ActiveContractsDialog({ contracts }: Readonly<Props>) {
  const vigentes = contracts
    .filter((c) => c.state === 'ACTIVE' || c.state === 'EXPIRING')
    .sort((a, b) => (a.daysRemaining ?? Number.POSITIVE_INFINITY) - (b.daysRemaining ?? Number.POSITIVE_INFINITY));

  const porVencer = vigentes.filter((c) => c.state === 'EXPIRING').length;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarClock className="mr-2 size-4" />
          Vigentes
          <span className="ml-2 rounded-full bg-brand/15 px-2 py-0.5 text-xs font-semibold text-brand-strong dark:text-brand">
            {vigentes.length}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Contratos vigentes</DialogTitle>
          <DialogDescription>
            {vigentes.length === 0
              ? 'No tienes contratos vigentes registrados.'
              : `${vigentes.length} vigente${vigentes.length === 1 ? '' : 's'}${
                  porVencer > 0 ? `, ${porVencer} por vencer en los próximos 45 días` : ''
                }.`}
          </DialogDescription>
        </DialogHeader>

        {vigentes.length > 0 && (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {vigentes.map((c) => (
              <div key={c.id} className="rounded-lg border px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.companyName ?? 'Sin empresa'}</span>
                    <StatusBadge status={c.state ?? c.status} />
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {c.salary || c.grossSalary
                      ? formatMoney(c.salary ?? c.grossSalary ?? '0', c.currency as 'PEN' | 'USD')
                      : '-'}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 text-muted-foreground text-xs">
                  <span>{c.type ?? 'Sin tipo'}</span>
                  <span>
                    {formatDateMedium(c.startDate)} → {c.endDate ? formatDateMedium(c.endDate) : 'indefinido'}
                  </span>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/30 px-3 py-2">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Llevas</p>
                    <p className="font-semibold text-sm">{formatDurationExact(c.startDate)}</p>
                  </div>
                  <div
                    className={cn(
                      'rounded-lg border px-3 py-2',
                      c.state === 'EXPIRING' ? 'border-warning/40 bg-warning/8' : 'bg-muted/30',
                    )}
                  >
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Te falta</p>
                    <p className={cn('font-semibold text-sm', c.state === 'EXPIRING' && 'text-warning-foreground')}>
                      {restanteCorto(c.daysRemaining)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
