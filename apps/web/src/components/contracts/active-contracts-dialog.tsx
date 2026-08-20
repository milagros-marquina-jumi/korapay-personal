'use client';

import { formatMoney } from '@korapay/domain';
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

function avanceDe(contract: EmploymentContract): number {
  if (!contract.endDate) return 100;
  const inicio = new Date(contract.startDate).getTime();
  const fin = new Date(contract.endDate).getTime();
  const total = fin - inicio;
  if (total <= 0) return 100;
  const transcurrido = Date.now() - inicio;
  return Math.min(100, Math.max(2, Math.round((transcurrido / total) * 100)));
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
          <div className="max-h-[60vh] divide-y overflow-y-auto">
            {vigentes.map((c) => (
              <div key={c.id} className="py-4 first:pt-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="font-medium">{c.companyName ?? 'Sin empresa'}</span>
                  <span className="font-semibold tabular-nums">
                    {c.salary || c.grossSalary
                      ? formatMoney(c.salary ?? c.grossSalary ?? '0', c.currency as 'PEN' | 'USD')
                      : '—'}
                  </span>
                </div>

                <p className="mt-0.5 text-muted-foreground text-xs">
                  {c.type ?? 'Sin tipo'} · {formatDateMedium(c.startDate)} →{' '}
                  {c.endDate ? formatDateMedium(c.endDate) : 'indefinido'}
                </p>

                <div className="mt-2.5 space-y-1.5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full', c.state === 'EXPIRING' ? 'bg-warning' : 'bg-brand')}
                      style={{ width: `${avanceDe(c)}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
                    <span className="text-muted-foreground">
                      Lleva <span className="font-medium text-foreground">{formatDurationExact(c.startDate)}</span>
                    </span>
                    <span
                      className={cn('font-medium', c.state === 'EXPIRING' ? 'text-warning' : 'text-muted-foreground')}
                    >
                      {c.endDate ? `Faltan ${restanteCorto(c.daysRemaining)}` : 'Sin fecha de fin'}
                    </span>
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
