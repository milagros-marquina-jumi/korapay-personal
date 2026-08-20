'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { useHeroMotion } from '@/components/landing/animations/use-hero-motion';
import { AppWindow } from '@/components/landing/app-window';
import { Character } from '@/components/landing/character';
import { HERO } from '@/components/landing/landing-data';
import { Button } from '@/components/ui/button';

const METRICAS = [
  { valor: '4', label: 'workspaces' },
  { valor: '0', label: 'hojas de Excel' },
  { valor: '1', label: 'lugar para todo' },
];

export function HeroSection() {
  const scope = useRef<HTMLElement>(null);
  useHeroMotion({ scope });

  return (
    <section ref={scope} className="relative overflow-hidden px-4 pt-8 pb-16 md:px-6 md:pt-12 md:pb-24">
      <div
        data-hero="glow"
        aria-hidden="true"
        className="-z-10 pointer-events-none absolute top-[-22rem] left-1/2 size-[46rem] -translate-x-1/2 rounded-full bg-brand/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="-z-10 pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:56px_56px]"
      />

      <div className="mx-auto w-full max-w-6xl">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
          <div className="text-center lg:text-left">
            <span
              data-hero="badge"
              className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft/60 px-3.5 py-1.5 font-medium text-brand text-xs"
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              {HERO.badge}
            </span>

            <h1 className="mt-6 font-display font-extrabold text-5xl text-foreground leading-[0.94] tracking-[-0.035em] sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              <span className="block overflow-hidden">
                <span data-hero="line" className="block">
                  Cobras de todos
                </span>
              </span>
              <span className="block overflow-hidden">
                <span data-hero="line" className="relative block">
                  lados. <span className="text-brand">Ordénalo.</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 300 12"
                    preserveAspectRatio="none"
                    className="-bottom-1 absolute right-0 h-2.5 w-[4.6em] text-brand/35"
                  >
                    <title>subrayado</title>
                    <path d="M2 8c60-5 120-6 180-4s80 4 116 2" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                </span>
              </span>
            </h1>

            <p
              data-hero="sub"
              className="mx-auto mt-7 max-w-xl text-base text-muted-foreground leading-relaxed lg:mx-0 md:text-lg"
            >
              {HERO.subtitulo}
            </p>

            <div
              data-hero="cta"
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
            >
              <Button asChild size="lg" className="group w-full sm:w-auto">
                <Link href={HERO.ctaPrincipal.href}>
                  {HERO.ctaPrincipal.label}
                  <ArrowRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link href={HERO.ctaSecundario.href}>{HERO.ctaSecundario.label}</Link>
              </Button>
            </div>

            <dl data-hero="cta" className="mt-10 flex items-center justify-center gap-8 lg:justify-start">
              {METRICAS.map((m) => (
                <div key={m.label} className="text-center lg:text-left">
                  <dt className="font-display font-extrabold text-3xl text-brand tabular-nums md:text-4xl">
                    {m.valor}
                  </dt>
                  <dd className="mt-0.5 text-muted-foreground text-xs uppercase tracking-wider">{m.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div data-hero="panel" className="relative mt-4 lg:mt-0">
            <Character
              name="capibaraFeliz"
              width={420}
              priority
              float
              data-parallax="0.4"
              className="-left-6 -bottom-8 pointer-events-none absolute z-20 w-28 drop-shadow-[0_20px_30px_rgba(120,72,10,0.3)] sm:w-40 lg:-left-16 lg:w-52"
            />
            <Character
              name="caballoFeliz"
              width={420}
              priority
              data-parallax="0.65"
              className="-right-4 -top-12 pointer-events-none absolute z-20 w-24 animate-float-soft drop-shadow-[0_20px_30px_rgba(120,72,10,0.3)] sm:w-36 lg:-right-14 lg:-top-16 lg:w-48"
            />
            <div className="lg:rotate-[1.5deg] lg:transition-transform lg:duration-500 lg:hover:rotate-0">
              <AppWindow />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
