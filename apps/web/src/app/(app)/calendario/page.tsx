'use client';

import { AlertTriangle, ArrowDownLeft, ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EventRow, SummaryCard } from '@/components/calendar/calendar-shared';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { groupByDate, upcomingFirst, useCalendar } from '@/lib/use-calendar';
import { MonthGrid } from './month-grid';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatLargo(iso: string): string {
  const [y = '', m = '01', d = '1'] = iso.split('-');
  const nombre = MESES[Number(m) - 1] ?? '';
  return `${Number(d)} de ${nombre.toLowerCase()} de ${y}`;
}

export default function CalendarioPage() {
  const hoy = todayIso();
  const [verPagados, setVerPagados] = useState(false);
  const { data, isLoading } = useCalendar({ includePaid: verPagados });

  const byDate = useMemo(() => groupByDate(data?.events ?? []), [data]);
  const proximos = useMemo(
    () => upcomingFirst((data?.events ?? []).filter((e) => e.status !== 'PAID')).slice(0, 12),
    [data],
  );
  const pagadosVisibles = useMemo(() => (data?.events ?? []).filter((e) => e.status === 'PAID').length, [data]);

  const mesInicial = useMemo(() => {
    const eventos = data?.events ?? [];
    if (!eventos.length) return hoy.slice(0, 7);
    if (eventos.some((e) => e.date.startsWith(hoy.slice(0, 7)))) return hoy.slice(0, 7);
    const porMes = new Map<string, number>();
    for (const e of eventos) porMes.set(e.date.slice(0, 7), (porMes.get(e.date.slice(0, 7)) ?? 0) + 1);
    const actual = hoy.slice(0, 7);
    let mejor = actual;
    let mejorPuntaje = -1;
    for (const [mesIso, cantidad] of porMes) {
      const distancia = Math.abs(Number(mesIso.replace('-', '')) - Number(actual.replace('-', '')));
      const puntaje = cantidad * 100 - distancia;
      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje;
        mejor = mesIso;
      }
    }
    return mejor;
  }, [data, hoy]);

  const [mesVisible, setMesVisible] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<string | null>(null);

  const activo = mesVisible ?? mesInicial;
  const anio = Number(activo.slice(0, 4));
  const mes = Number(activo.slice(5, 7)) - 1;

  const diaActivo =
    seleccion ??
    (byDate.has(hoy) ? hoy : [...byDate.keys()].sort((a, b) => a.localeCompare(b)).find((d) => d.startsWith(activo))) ??
    hoy;
  const delDia = byDate.get(diaActivo) ?? [];

  const mover = (delta: number) => {
    const fecha = new Date(Date.UTC(anio, mes + delta, 1));
    setMesVisible(`${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`);
    setSeleccion(null);
  };

  const irHoy = () => {
    setMesVisible(hoy.slice(0, 7));
    setSeleccion(hoy);
  };

  return (
    <PageShell
      title="Calendario financiero"
      description="Vencimientos, cobros y fin de contratos de todos tus workspaces"
    >
      {isLoading && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-80" />
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
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
            <SummaryCard
              label="Vencidos"
              amount={data.summary.overdue}
              count={data.summary.overdueCount}
              tone="overdue"
              icon={AlertTriangle}
            />
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                  <CardTitle className="text-base">
                    {MESES[mes]} {anio}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <label
                      className="mr-1 flex cursor-pointer items-center gap-2 text-muted-foreground text-xs hover:text-foreground"
                      title={
                        verPagados
                          ? `${pagadosVisibles} movimientos pagados en el historial`
                          : 'El calendario muestra solo lo que falta'
                      }
                    >
                      <input
                        type="checkbox"
                        checked={verPagados}
                        onChange={(e) => setVerPagados(e.target.checked)}
                        className="size-3.5 accent-brand"
                      />
                      Ver pagados
                    </label>
                    <Button variant="ghost" size="sm" onClick={irHoy}>
                      Hoy
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => mover(-1)} aria-label="Mes anterior">
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => mover(1)} aria-label="Mes siguiente">
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <MonthGrid
                    year={anio}
                    month={mes}
                    byDate={byDate}
                    selected={diaActivo}
                    onSelect={setSeleccion}
                    today={hoy}
                  />
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-destructive" /> Vencido
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-success" /> Por cobrar
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-brand" /> Por pagar
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-info" /> Contrato
                    </span>
                    {verPagados && (
                      <span className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-muted-foreground/40" /> Pagado
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{formatLargo(diaActivo)}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {delDia.length === 0
                      ? 'Sin eventos este día'
                      : `${delDia.length} ${delDia.length === 1 ? 'evento' : 'eventos'}`}
                  </p>
                </CardHeader>
                <CardContent>
                  {delDia.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Elige un día con puntos de color para ver su detalle.
                    </p>
                  ) : (
                    <div className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
                      {delDia.map((event) => (
                        <EventRow key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="lg:sticky lg:top-20">
              <CardHeader>
                <CardTitle className="text-base">Próximos vencimientos</CardTitle>
                <p className="text-sm text-muted-foreground">Lo más urgente primero</p>
              </CardHeader>
              <CardContent>
                {proximos.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Nada pendiente.</p>
                ) : (
                  <div className="grid max-h-128 min-w-0 grid-cols-[minmax(0,1fr)] gap-2 overflow-y-auto overflow-x-hidden pr-1.5">
                    {proximos.map((event) => (
                      <EventRow key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}
