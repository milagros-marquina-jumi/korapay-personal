'use client';

import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { useHeroMotion } from '@/components/landing/animations/use-hero-motion';
import { HERO, KPIS } from '@/components/landing/landing-data';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';

const PANEL_FILAS = [
  { etiqueta: 'Ingresos del mes', valor: 'S/ 42,207', tono: 'text-success', ancho: 'w-[86%]' },
  { etiqueta: 'Costos de negocio', valor: 'S/ 2,017', tono: 'text-foreground', ancho: 'w-[24%]' },
  { etiqueta: 'Pagos al equipo', valor: 'S/ 37,520', tono: 'text-foreground', ancho: 'w-[72%]' },
] as const;

export function HeroSection() {
  const scope = useRef<HTMLElement>(null);
  useHeroMotion({ scope });

  return (
    <section ref={scope} className="relative overflow-hidden px-4 pt-10 pb-20 md:px-6 md:pt-16 md:pb-28">
      <div
        data-hero="glow"
        aria-hidden="true"
        className="-z-10 pointer-events-none absolute top-[-18rem] left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-brand/25 blur-3xl"
      />

      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span
            data-hero="badge"
            className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft/60 px-3.5 py-1.5 font-medium text-brand text-xs"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            {HERO.badge}
          </span>

          <h1 className="mt-6 font-display font-extrabold text-4xl text-foreground leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            {HERO.titulo.map((linea, i) => (
              <span key={linea} className="block overflow-hidden">
                <span data-hero="line" className={i === 1 ? 'block text-brand' : 'block'}>
                  {linea}
                </span>
              </span>
            ))}
          </h1>

          <p data-hero="sub" className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
            {HERO.subtitulo}
          </p>

          <div data-hero="cta" className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={HERO.ctaPrincipal.href}>
                {HERO.ctaPrincipal.label}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href={HERO.ctaSecundario.href}>{HERO.ctaSecundario.label}</Link>
            </Button>
          </div>
        </div>

        <div data-hero="panel" className="mx-auto mt-14 max-w-4xl">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card md:p-6">
            <div className="flex items-center justify-between gap-3 border-b pb-4">
              <Logo size={30} />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 font-medium text-success text-xs">
                <TrendingUp className="size-3.5" aria-hidden="true" />
                Resumen del mes
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {PANEL_FILAS.map((fila) => (
                <div key={fila.etiqueta}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-muted-foreground text-sm">{fila.etiqueta}</span>
                    <span className={`font-semibold text-sm tabular-nums ${fila.tono}`}>{fila.valor}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full bg-brand/70 ${fila.ancho}`} />
                  </div>
                </div>
              ))}
            </div>

            <div data-hero="kpi" className="mt-6 grid grid-cols-3 gap-3 border-t pt-5">
              {KPIS.map((kpi) => (
                <div key={kpi.label} className="text-center">
                  <p className="font-display font-bold text-2xl text-brand tabular-nums">
                    <span data-counter={kpi.valor}>{kpi.valor}</span>
                    {kpi.sufijo}
                  </p>
                  <p className="mt-0.5 text-muted-foreground text-xs leading-tight">{kpi.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
