'use client';

import type { RefObject } from 'react';
import { gsap, registerGsap, useGSAP } from './gsap-setup';
import { DISTANCE, DURATION, EASE, STAGGER } from './motion-tokens';

registerGsap();

interface Options {
  scope: RefObject<HTMLElement | null>;
}

export function useHeroMotion({ scope }: Options): void {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          animar: '(prefers-reduced-motion: no-preference)',
          reducir: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { animar } = context.conditions as { animar: boolean; reducir: boolean };

          if (!animar) {
            gsap.set('[data-hero]', { clearProps: 'all', autoAlpha: 1 });
            return;
          }

          const tl = gsap.timeline({ defaults: { ease: EASE.entrance } });

          // Posiciones absolutas en la timeline: los offsets relativos con
          // stagger se acumulan y pueden dejar pasos posteriores sin ejecutar.
          tl.from('[data-hero="badge"]', { autoAlpha: 0, y: DISTANCE.subtle, duration: DURATION.base }, 0)
            .from(
              '[data-hero="line"]',
              { autoAlpha: 0, y: DISTANCE.expressive, duration: DURATION.slow, stagger: STAGGER.loose },
              0.15,
            )
            .from('[data-hero="sub"]', { autoAlpha: 0, y: DISTANCE.standard, duration: DURATION.base }, 0.6);

          // Estos nodos se montan con el resto del arbol de React; se animan con
          // tweens propios para no depender del avance de la timeline principal.
          gsap.from('[data-hero="cta"]', {
            autoAlpha: 0,
            y: DISTANCE.standard,
            duration: DURATION.base,
            delay: 0.8,
            ease: EASE.entrance,
          });
          gsap.from('[data-hero="panel"]', {
            autoAlpha: 0,
            y: DISTANCE.expressive,
            scale: 0.96,
            duration: DURATION.deliberate,
            delay: 0.95,
            ease: EASE.entrance,
          });
          gsap.from('[data-hero="kpi"] > *', {
            autoAlpha: 0,
            y: DISTANCE.subtle,
            duration: DURATION.fast,
            stagger: STAGGER.tight,
            delay: 1.4,
            ease: EASE.entrance,
          });

          // Los KPI estan sobre el pliegue: se cuentan con su propio tween, no
          // con ScrollTrigger, que nunca dispararia por estar ya en pantalla.
          for (const el of gsap.utils.toArray<HTMLElement>('[data-counter]')) {
            const destino = Number(el.dataset.counter) || 0;
            const contador = { valor: 0 };
            gsap.to(contador, {
              valor: destino,
              duration: DURATION.deliberate,
              ease: EASE.out,
              delay: 0.6,
              onUpdate: () => {
                el.textContent = Math.round(contador.valor).toLocaleString('es-PE');
              },
            });
          }

          // Brillo lento de fondo: decorativo, sin informacion asociada.
          gsap.to('[data-hero="glow"]', {
            scale: 1.12,
            autoAlpha: 0.75,
            duration: 6,
            ease: EASE.inOut,
            repeat: -1,
            yoyo: true,
          });
        },
      );

      return () => mm.revert();
    },
    { scope },
  );
}
