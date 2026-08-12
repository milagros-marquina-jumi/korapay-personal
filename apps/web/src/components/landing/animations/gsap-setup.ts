'use client';

import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DURATION, EASE } from './motion-tokens';

let registered = false;

export function registerGsap(): void {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(useGSAP, ScrollTrigger);
  gsap.defaults({ ease: EASE.out, duration: DURATION.base });
  registered = true;
}

export { gsap, ScrollTrigger, useGSAP };
