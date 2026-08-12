'use client';

import { AlertTriangle, ArrowDownLeft, CalendarDays, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { EventRow, SummaryCard } from '@/components/calendar/calendar-shared';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { upcomingFirst, useCalendar } from '@/lib/use-calendar';

const PREVIEW_LIMIT = 8;

export function CalendarHeaderPanel() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useCalendar();

  const pendientes = data?.summary.overdueCount ?? 0;
  const eventos = data ? upcomingFirst(data.events).slice(0, PREVIEW_LIMIT) : [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative overflow-visible"
              aria-label={pendientes > 0 ? `Calendario financiero, ${pendientes} vencidos` : 'Calendario financiero'}
            >
              <CalendarDays className="h-5 w-5" />
              {pendientes > 0 && (
                <span className="-right-0.5 -top-0.5 absolute flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-destructive px-1 font-bold text-[10px] text-white leading-none">
                  {pendientes > 99 ? '99+' : pendientes}
                </span>
              )}
            </Button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {pendientes > 0 ? `${pendientes} vencimientos vencidos` : 'Calendario financiero'}
        </TooltipContent>
      </Tooltip>

      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <div className="border-b px-4 py-4">
          <SheetTitle className="font-display text-lg">Calendario financiero</SheetTitle>
          <p className="text-xs text-muted-foreground">Vencimientos de todos tus workspaces</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {data && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <SummaryCard
                  label="Por pagar"
                  amount={data.summary.toPay}
                  count={data.summary.toPayCount}
                  tone="pay"
                  icon={Wallet}
                />
                <SummaryCard
                  label="Por cobrar"
                  amount={data.summary.toCollect}
                  count={data.summary.toCollectCount}
                  tone="collect"
                  icon={ArrowDownLeft}
                />
              </div>

              {data.summary.overdueCount > 0 && (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/8 p-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-destructive">{data.summary.overdueCount} vencidos</p>
                    <p className="text-xs text-muted-foreground">Revisa los que ya pasaron de fecha.</p>
                  </div>
                </div>
              )}

              <p className="mt-5 mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Próximos</p>
              {eventos.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Sin vencimientos registrados.</p>
              ) : (
                <div className="grid gap-2">
                  {eventos.map((event) => (
                    <EventRow key={event.id} event={event} onNavigate={() => setOpen(false)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t p-4">
          <Button asChild variant="outline" className="w-full" onClick={() => setOpen(false)}>
            <Link href="/calendario">Ver calendario completo</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
