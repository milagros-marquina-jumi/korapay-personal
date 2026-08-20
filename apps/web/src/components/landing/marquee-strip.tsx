'use client';

import { Banknote, Building2, CalendarClock, FileText, PiggyBank, Receipt, TrendingDown, Wallet } from 'lucide-react';

const ITEMS = [
  { icon: Wallet, texto: 'Sueldo' },
  { icon: Building2, texto: 'Proyectos' },
  { icon: Receipt, texto: 'Cliente propio' },
  { icon: FileText, texto: 'Renta anual' },
  { icon: PiggyBank, texto: 'Ahorros' },
  { icon: TrendingDown, texto: 'Deudas' },
  { icon: CalendarClock, texto: 'Contratos' },
  { icon: Banknote, texto: 'Cobros' },
];

export function MarqueeStrip() {
  const base = [...ITEMS, ...ITEMS, ...ITEMS];
  const fila = [...base, ...base];

  return (
    <section aria-label="Todo lo que KoraPay ordena" className="relative overflow-hidden border-y bg-card py-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-card to-transparent md:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-card to-transparent md:w-24" />

      <div className="flex w-max animate-marquee items-center">
        {fila.map((item, i) => (
          <span key={`${item.texto}-${i}`} className="flex shrink-0 items-center">
            <span className="flex items-center gap-2.5 px-6 md:px-8">
              <item.icon className="size-4 shrink-0 text-brand md:size-[1.15rem]" aria-hidden="true" />
              <span className="font-medium text-foreground/70 text-sm tracking-tight md:text-base">{item.texto}</span>
            </span>
            <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-brand/40" />
          </span>
        ))}
      </div>
    </section>
  );
}
