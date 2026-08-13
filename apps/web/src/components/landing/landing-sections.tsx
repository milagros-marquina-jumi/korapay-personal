'use client';

import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';
import { useLandingMotion } from '@/components/landing/animations/use-landing-motion';
import { FEATURES, PWA, REPORTES, WORKSPACES } from '@/components/landing/landing-data';
import { Button } from '@/components/ui/button';

// Nombres y cifras inventados para la vitrina publica.
const DURACION_DEMO = [
  { n: 'Cliente A', d: '1 año 6 meses', w: 'w-full', c: '2 contratos' },
  { n: 'Cliente B', d: '1 año 2 meses', w: 'w-[78%]', c: '1 contrato' },
  { n: 'Cliente C', d: '11 meses', w: 'w-[61%]', c: '1 contrato' },
  { n: 'Cliente D', d: '8 meses', w: 'w-[44%]', c: '1 contrato' },
  { n: 'Cliente E', d: '5 meses', w: 'w-[28%]', c: '1 contrato' },
] as const;

function SectionTitle({
  eyebrow,
  titulo,
  descripcion,
}: Readonly<{ eyebrow: string; titulo: string; descripcion: string }>) {
  return (
    <div data-reveal className="mx-auto max-w-2xl text-center">
      <p className="font-semibold text-brand text-xs uppercase tracking-[0.14em]">{eyebrow}</p>
      <h2 className="mt-3 font-display font-bold text-3xl text-foreground tracking-tight md:text-4xl">{titulo}</h2>
      <p className="mt-3 text-base text-muted-foreground">{descripcion}</p>
    </div>
  );
}

export function LandingSections() {
  const scope = useRef<HTMLDivElement>(null);
  useLandingMotion({ scope });

  return (
    <div ref={scope}>
      <section id="workspaces" className="border-t px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto w-full max-w-6xl">
          <SectionTitle
            eyebrow="Workspaces"
            titulo="Cuatro bolsillos que no se tocan entre sí"
            descripcion="Cambias de workspace y cambia todo: movimientos, catálogos y reportes. El gasto de casa nunca aparece en los números de la empresa."
          />
          <div data-stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKSPACES.map((ws) => (
              <article
                key={ws.nombre}
                className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand/40"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand transition-transform group-hover:scale-105">
                  <ws.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display font-semibold text-foreground text-lg">{ws.nombre}</h3>
                <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">{ws.descripcion}</p>
                <ul className="mt-4 space-y-1.5 border-t pt-4">
                  {ws.puntos.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-muted-foreground text-sm">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="border-t bg-muted/30 px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto w-full max-w-6xl">
          <SectionTitle
            eyebrow="Funcionalidades"
            titulo="Seis cosas que ya no haces a mano"
            descripcion="Cada una nació de un dolor concreto: la cuota que se pasó, el contrato que nadie recordaba, el correo del banco sin registrar."
          />
          <div data-stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.titulo} className="rounded-2xl border border-border bg-card p-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <f.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display font-semibold text-base text-foreground">{f.titulo}</h3>
                <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">{f.descripcion}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="reportes" className="border-t px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div data-reveal>
            <p className="font-semibold text-brand text-xs uppercase tracking-[0.14em]">Reportes</p>
            <h2 className="mt-3 font-display font-bold text-3xl text-foreground tracking-tight md:text-4xl">
              Respuestas, no tablas dinámicas
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              ¿Cuánto tiempo trabajaste en cada empresa? ¿Qué cliente deja más? ¿Cuánto de renta te toca este año?
              KoraPay lo calcula sobre tus propios datos.
            </p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {REPORTES.map((r) => (
                <li key={r} className="flex items-start gap-2 text-foreground text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div data-parallax="40" className="rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
            <p className="font-display font-semibold text-foreground">Duración por empresa</p>
            <p className="text-muted-foreground text-xs">Los reingresos se suman sin duplicar periodos</p>
            <div className="mt-5 space-y-3.5">
              {DURACION_DEMO.map((e) => (
                <div key={e.n}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium text-foreground text-sm">{e.n}</span>
                    <span className="shrink-0 text-muted-foreground text-xs tabular-nums">{e.d}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full bg-brand/70 ${e.w}`} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{e.c}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t pt-3 text-[11px] text-muted-foreground">Datos de demostración.</p>
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 px-4 py-20 md:px-6 md:py-28">
        <div className="mx-auto w-full max-w-6xl">
          <SectionTitle
            eyebrow="Aplicación instalable"
            titulo="En el móvil, incluso sin señal"
            descripcion="KoraPay es una PWA: se instala como app y lo que ya viste sigue disponible aunque se caiga la conexión."
          />
          <div data-stagger className="mt-12 grid gap-4 sm:grid-cols-3">
            {PWA.map((p) => (
              <article key={p.titulo} className="rounded-2xl border border-border bg-card p-5 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <p.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display font-semibold text-base text-foreground">{p.titulo}</h3>
                <p className="mt-1.5 text-muted-foreground text-sm">{p.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t px-4 py-20 md:px-6 md:py-28">
        <div data-reveal className="mx-auto w-full max-w-3xl text-center">
          <h2 className="font-display font-bold text-3xl text-foreground tracking-tight md:text-4xl">
            Empieza por el bolsillo que más te preocupa
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            No hace falta migrar todo de golpe. Un workspace, los movimientos del mes, y ya ves de dónde sale y a dónde
            va tu dinero.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/dashboard">
              Entrar a KoraPay
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
