'use client';

import { formatMoney } from '@korapay/domain';
import { CalendarDays, Gift, Scale, Umbrella } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  CTS_GRATIFICACION_FRACTION,
  CTS_SALARY_FACTOR,
  ESSALUD_BONUS,
  LABOR_EVENTS,
  type LaborEventKind,
  type LaborEventStatus,
  OTHER_BENEFITS,
  STATUS_STYLES,
  UPCOMING_WINDOW_DAYS,
} from '@/components/reports/peru-laboral-constants';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PeruLaboralCalendarProps {
  readonly latestMonthlySalary: number;
}

interface ResolvedEvent {
  id: string;
  title: string;
  period: string;
  kind: LaborEventKind;
  date: Date;
  law: string;
  amount: number | null;
  status: LaborEventStatus;
}

const DAY_MS = 86_400_000;

const ICONS: Record<LaborEventKind, ReactNode> = {
  gratificacion: <Gift className="h-3.5 w-3.5" />,
  cts: <Umbrella className="h-3.5 w-3.5" />,
  utilidades: <Scale className="h-3.5 w-3.5" />,
};

function statusOf(date: Date, today: Date): LaborEventStatus {
  const days = Math.round((date.getTime() - today.getTime()) / DAY_MS);
  if (days < 0) return 'pasado';
  if (days <= UPCOMING_WINDOW_DAYS) return 'proximo';
  return 'futuro';
}

function amountFor(kind: LaborEventKind, salary: number) {
  if (salary <= 0) return null;
  const gratificacion = salary * (1 + ESSALUD_BONUS);
  if (kind === 'gratificacion') return gratificacion;
  if (kind === 'cts') return salary * CTS_SALARY_FACTOR + gratificacion / CTS_GRATIFICACION_FRACTION;
  return null;
}

function resolveEvents(salary: number): ResolvedEvent[] {
  const today = new Date();
  const year = today.getFullYear();

  return LABOR_EVENTS.map((spec) => {
    const date = new Date(Date.UTC(year, spec.month, spec.day));
    return {
      id: spec.id,
      title: spec.title,
      period: spec.period,
      kind: spec.kind,
      date,
      law: spec.law,
      amount: amountFor(spec.kind, salary),
      status: statusOf(date, today),
    };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
}

const SHORT_DATE = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', timeZone: 'UTC' });

export function PeruLaboralCalendar({ latestMonthlySalary }: PeruLaboralCalendarProps) {
  const events = resolveEvents(latestMonthlySalary);
  const totalAnual = events.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const proximo = events.find((e) => e.status === 'proximo') ?? events.find((e) => e.status === 'futuro');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarDays className="h-4 w-4" />
          Calendario laboral
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-brand" />
            Calendario laboral Perú
          </DialogTitle>
          <DialogDescription>
            Solo aplica a planilla. Los recibos por honorarios no generan estos pagos.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          {latestMonthlySalary > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Proyección anual</p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-success">
                  {formatMoney(String(totalAnual), 'PEN')}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Sobre un sueldo de {formatMoney(String(latestMonthlySalary), 'PEN')}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Siguiente pago</p>
                <p className="mt-0.5 text-xl font-bold">{proximo ? SHORT_DATE.format(proximo.date) : '—'}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {proximo ? `${proximo.title} ${proximo.period}` : 'Sin pagos pendientes este año'}
                </p>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Fecha</th>
                  <th className="px-3 py-2 font-medium">Beneficio</th>
                  <th className="px-3 py-2 text-right font-medium">Monto</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{SHORT_DATE.format(e.date)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{ICONS[e.kind]}</span>
                        <span className="font-medium">{e.title}</span>
                      </div>
                      <span className="ml-5.5 text-xs text-muted-foreground">{e.period}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                      {e.amount ? (
                        <span className="font-semibold text-success">{formatMoney(String(e.amount), 'PEN')}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Variable</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex w-fit whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[e.status].className}`}
                      >
                        {STATUS_STYLES[e.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Otros beneficios de planilla</p>
            <div className="grid grid-cols-3 gap-2">
              {OTHER_BENEFITS.map((b) => (
                <div key={b.title} className="rounded-lg border p-2.5">
                  <p className="text-xs text-muted-foreground">{b.title}</p>
                  <p className="mt-0.5 font-semibold">{b.value}</p>
                  <p className="text-[11px] text-muted-foreground">{b.note}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Gratificación: un sueldo + 9% EsSalud. CTS: medio sueldo + 1/6 de gratificación. Utilidades solo en empresas
            de más de 20 trabajadores.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
