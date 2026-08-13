'use client';

import { ArrowDownLeft, ArrowUpRight, LayoutGrid, PiggyBank, Receipt, TrendingUp, Wallet } from 'lucide-react';

const NAV = [
  { icon: LayoutGrid, label: 'Dashboard', activo: true },
  { icon: Wallet, label: 'Movimientos' },
  { icon: PiggyBank, label: 'Ahorros' },
  { icon: TrendingUp, label: 'Deudas' },
  { icon: Receipt, label: 'Pendientes' },
];

// Datos de demostracion: nombres y montos inventados para la vitrina.
const KPI = [
  { label: 'Ingresos', valor: 'S/ 8,450', delta: '+12%', positivo: true },
  { label: 'Egresos', valor: 'S/ 3,120', delta: '-4%', positivo: false },
  { label: 'Disponible', valor: 'S/ 5,330', delta: '+18%', positivo: true },
];

const BARRAS = [
  { mes: 'ene', alto: 38 },
  { mes: 'feb', alto: 52 },
  { mes: 'mar', alto: 44 },
  { mes: 'abr', alto: 68 },
  { mes: 'may', alto: 57 },
  { mes: 'jun', alto: 74 },
  { mes: 'jul', alto: 62 },
  { mes: 'ago', alto: 88 },
  { mes: 'sep', alto: 71 },
  { mes: 'oct', alto: 95 },
  { mes: 'nov', alto: 80 },
  { mes: 'dic', alto: 100 },
];

const MOVIMIENTOS = [
  { concepto: 'Pago de proyecto', etiqueta: 'Ingreso', monto: '+S/ 3,200', positivo: true },
  { concepto: 'Servicio de nube', etiqueta: 'Suscripción', monto: '−S/ 180', positivo: false },
  { concepto: 'Aporte a meta viaje', etiqueta: 'Ahorro', monto: '−S/ 500', positivo: false },
  { concepto: 'Consultoría mensual', etiqueta: 'Ingreso', monto: '+S/ 1,850', positivo: true },
];

export function AppWindow() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex h-10 items-center gap-2 border-b bg-muted/50 px-4">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-destructive/60" />
          <span className="size-2.5 rounded-full bg-warning/70" />
          <span className="size-2.5 rounded-full bg-success/60" />
        </span>
        <span className="mx-auto rounded-md bg-background px-3 py-0.5 font-medium text-[11px] text-muted-foreground">
          korapay.app / dashboard
        </span>
      </div>

      <div className="grid grid-cols-[1fr] sm:grid-cols-[8.5rem_minmax(0,1fr)]">
        <aside className="hidden flex-col gap-0.5 border-r bg-muted/25 p-2.5 sm:flex">
          <p className="px-2 pb-1.5 font-semibold text-[9px] text-muted-foreground uppercase tracking-[0.12em]">
            Personal
          </p>
          {NAV.map((item) => (
            <span
              key={item.label}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] ${
                item.activo ? 'bg-brand-soft font-semibold text-brand' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="size-3.5 shrink-0" aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </aside>

        <div className="min-w-0 p-4 md:p-5">
          <div className="grid grid-cols-3 gap-2.5">
            {KPI.map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-background p-2.5">
                <p className="text-[10px] text-muted-foreground">{k.label}</p>
                <p className="mt-0.5 font-display font-bold text-foreground text-sm tabular-nums md:text-base">
                  {k.valor}
                </p>
                <p
                  className={`mt-0.5 flex items-center gap-0.5 text-[10px] ${
                    k.positivo ? 'text-success' : 'text-muted-foreground'
                  }`}
                >
                  {k.positivo ? (
                    <ArrowUpRight className="size-2.5" aria-hidden="true" />
                  ) : (
                    <ArrowDownLeft className="size-2.5" aria-hidden="true" />
                  )}
                  {k.delta}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl border border-border bg-background p-3">
            <p className="font-medium text-[11px] text-muted-foreground">Ingresos por mes</p>
            <div className="mt-2.5 flex h-20 items-end gap-1" aria-hidden="true">
              {BARRAS.map((barra) => (
                <span key={barra.mes} style={{ height: `${barra.alto}%` }} className="flex-1 rounded-sm bg-brand/70" />
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-border bg-background">
            {MOVIMIENTOS.map((m, i) => (
              <div key={m.concepto} className={`flex items-center gap-2 px-3 py-2 ${i > 0 ? 'border-t' : ''}`}>
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md ${
                    m.positivo ? 'bg-success/12 text-success' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {m.positivo ? (
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                  ) : (
                    <ArrowDownLeft className="size-3" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-[11px] text-foreground">{m.concepto}</span>
                  <span className="block text-[10px] text-muted-foreground">{m.etiqueta}</span>
                </span>
                <span
                  className={`shrink-0 font-semibold text-[11px] tabular-nums ${
                    m.positivo ? 'text-success' : 'text-foreground'
                  }`}
                >
                  {m.monto}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
