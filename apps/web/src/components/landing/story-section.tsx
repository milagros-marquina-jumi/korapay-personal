'use client';

import { ArrowRight } from 'lucide-react';
import { Character } from '@/components/landing/character';

const ANTES = [
  'No sabes cuánto te deben ni desde cuándo.',
  'El sueldo del cliente y tu comisión viven en la misma hoja.',
  'La renta anual te sorprende cada año.',
];

const DESPUES = [
  'Cada cobro con su fecha, su empresa y su estado.',
  'Cada workspace con sus propios números y reportes.',
  'La renta proyectada desde el primer mes.',
];

export function StorySection() {
  return (
    <section className="relative overflow-hidden border-t px-4 py-20 md:px-6 md:py-28">
      <div
        aria-hidden="true"
        className="-z-10 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl"
      />

      <div className="mx-auto w-full max-w-6xl">
        <div data-reveal className="mx-auto max-w-2xl text-center">
          <p className="font-semibold text-brand text-xs uppercase tracking-[0.14em]">El cambio</p>
          <h2 className="mt-3 font-display font-bold text-3xl text-foreground tracking-tight md:text-4xl">
            De perseguir cobros a verlos venir
          </h2>
        </div>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
          <article
            data-reveal
            className="group rounded-3xl border border-border/70 bg-card/60 p-7 transition-transform duration-300 hover:scale-[1.02] md:p-8"
          >
            <div className="flex items-center justify-center">
              <Character
                name="sinDinero"
                width={360}
                className="w-56 opacity-80 grayscale-[0.55] transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100 md:w-72"
              />
            </div>
            <p className="mt-6 text-center font-medium text-muted-foreground text-sm uppercase tracking-wider">
              Sin KoraPay
            </p>
            <ul className="mt-4 space-y-3">
              {ANTES.map((t) => (
                <li key={t} className="flex gap-2.5 text-muted-foreground text-sm leading-relaxed">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                  {t}
                </li>
              ))}
            </ul>
          </article>

          <div aria-hidden="true" className="flex justify-center lg:flex-col">
            <span className="flex size-12 items-center justify-center rounded-full border border-brand/30 bg-brand-soft text-brand">
              <ArrowRight className="size-5 lg:rotate-0" />
            </span>
          </div>

          <article
            data-reveal
            className="group relative overflow-hidden rounded-3xl border border-brand/40 bg-gradient-to-b from-brand-soft/70 to-brand-soft/20 p-7 shadow-[0_20px_60px_-24px_rgba(217,119,6,0.45)] transition-transform duration-300 hover:scale-[1.02] md:p-8"
          >
            <div className="flex items-center justify-center">
              <Character
                name="ahorro"
                width={420}
                float
                className="w-60 drop-shadow-[0_16px_24px_rgba(120,72,10,0.3)] md:w-80"
              />
            </div>
            <p className="mt-6 text-center font-semibold text-brand text-sm uppercase tracking-wider">Con KoraPay</p>
            <ul className="mt-4 space-y-3">
              {DESPUES.map((t) => (
                <li key={t} className="flex gap-2.5 text-foreground text-sm leading-relaxed">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  {t}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
