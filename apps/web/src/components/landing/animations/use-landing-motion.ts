'use client';

import type { RefObject } from 'react';
import { gsap, registerGsap, useGSAP } from './gsap-setup';
import { DISTANCE, DURATION, EASE, STAGGER, TRIGGER_START } from './motion-tokens';

registerGsap();

const REVEAL = '[data-reveal]';
const STAGGER_ITEM = '[data-stagger] > *';
const PARALLAX = '[data-parallax]';

interface Options {
  scope: RefObject<HTMLElement | null>;
}

/**
 * Anima toda una seccion a partir de atributos data-*, sin acoplar el markup a GSAP.
 * gsap.matchMedia se encarga de revertir y de respetar prefers-reduced-motion.
 */
export function useLandingMotion({ scope }: Options): void {
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
            // Sin movimiento: el contenido aparece de una, nunca oculto.
            gsap.set([REVEAL, STAGGER_ITEM, PARALLAX], { clearProps: 'all', autoAlpha: 1 });
            return;
          }

          for (const el of gsap.utils.toArray<HTMLElement>(REVEAL)) {
            gsap.from(el, {
              autoAlpha: 0,
              y: DISTANCE.standard,
              duration: DURATION.slow,
              ease: EASE.entrance,
              scrollTrigger: { trigger: el, start: TRIGGER_START, once: true },
            });
          }

          for (const grupo of gsap.utils.toArray<HTMLElement>('[data-stagger]')) {
            gsap.from(grupo.children, {
              autoAlpha: 0,
              y: DISTANCE.standard,
              duration: DURATION.base,
              ease: EASE.entrance,
              stagger: STAGGER.base,
              scrollTrigger: { trigger: grupo, start: TRIGGER_START, once: true },
            });
          }

          for (const el of gsap.utils.toArray<HTMLElement>(PARALLAX)) {
            const intensidad = Number(el.dataset.parallax) || 60;
            gsap.to(el, {
              y: -intensidad,
              ease: 'none',
              scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
            });
          }
        },
      );

      return () => mm.revert();
    },
    { scope },
  );
}
