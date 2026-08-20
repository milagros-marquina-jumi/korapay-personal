'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { useHeroMotion } from '@/components/landing/animations/use-hero-motion';
import { AppWindow } from '@/components/landing/app-window';
import { Character } from '@/components/landing/character';
import { HERO } from '@/components/landing/landing-data';
import { Button } from '@/components/ui/button';

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

        <div data-hero="panel" className="relative mx-auto mt-16 max-w-4xl">
          <Character
            name="capibaraFeliz"
            width={340}
            priority
            float
            data-parallax="0.35"
            className="-left-10 -bottom-10 pointer-events-none absolute z-20 w-32 drop-shadow-[0_18px_28px_rgba(120,72,10,0.28)] sm:w-44 lg:-left-24 lg:w-60 xl:-left-32 xl:w-72"
          />
          <Character
            name="caballoFeliz"
            width={340}
            priority
            data-parallax="0.55"
            className="-right-8 -top-20 pointer-events-none absolute z-20 w-28 animate-float-soft drop-shadow-[0_18px_28px_rgba(120,72,10,0.28)] sm:w-40 lg:-right-24 lg:-top-24 lg:w-56 xl:-right-32 xl:w-68"
          />
          <AppWindow />
        </div>
      </div>
    </section>
  );
}
