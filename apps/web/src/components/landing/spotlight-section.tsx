'use client';

import { formatMoney } from '@korapay/domain';
import { ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { useLandingMotion } from '@/components/landing/animations/use-landing-motion';
import { Character } from '@/components/landing/character';
import { Button } from '@/components/ui/button';

const PUNTOS = [
  { titulo: 'Sabes qué te deben', texto: 'Cada cobro con su fecha, su empresa y su estado.' },
  { titulo: 'Sabes qué debes', texto: 'Deudas con cuotas, vencimientos y cuánto falta.' },
  { titulo: 'Sabes cuánto queda', texto: 'Renta anual proyectada desde el primer mes.' },
];

export function SpotlightSection() {
  const scope = useRef<HTMLElement>(null);
  useLandingMotion({ scope });

  return (
    <section ref={scope} className="relative overflow-hidden bg-foreground px-4 py-20 text-background md:px-6 md:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,currentColor_1px,transparent_0)] [background-size:28px_28px]"
      />
      <div
        aria-hidden="true"
        className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-[-10rem] size-[34rem] rounded-full bg-brand/25 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1fr_0.85fr]">
        <div data-reveal>
          <p className="font-semibold text-brand text-xs uppercase tracking-[0.2em]">Un solo lugar</p>
          <h2 className="mt-4 font-display font-extrabold text-4xl leading-[1.02] tracking-tight md:text-5xl lg:text-6xl">
            Deja de armar
            <span className="block text-brand">el rompecabezas</span>
            cada fin de mes.
          </h2>

          <ul className="mt-10 space-y-6">
            {PUNTOS.map((p) => (
              <li key={p.titulo} className="flex gap-4">
                <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                  <TrendingUp className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-background text-lg">{p.titulo}</p>
                  <p className="mt-0.5 text-background/60 text-sm leading-relaxed">{p.texto}</p>
                </div>
              </li>
            ))}
          </ul>

          <Button asChild size="lg" variant="secondary" className="group mt-10">
            <Link href="/dashboard">
              Ver mis números
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </div>

        <div data-reveal className="relative flex justify-center">
          <Character
            name="banco"
            width={560}
            float
            className="w-64 drop-shadow-[0_30px_50px_rgba(0,0,0,0.45)] sm:w-80 lg:w-full"
          />
          <div className="-bottom-2 absolute left-0 rounded-2xl border border-background/15 bg-background/10 px-4 py-3 backdrop-blur-md sm:left-4">
            <p className="text-[10px] text-background/60 uppercase tracking-wider">Por cobrar</p>
            <p className="font-display font-bold text-background text-xl tabular-nums">{formatMoney('12400', 'PEN')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
