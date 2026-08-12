export const DURATION = {
  instant: 0.15,
  fast: 0.3,
  base: 0.5,
  slow: 0.8,
  deliberate: 1.2,
} as const;

export const EASE = {
  out: 'power2.out',
  inOut: 'power2.inOut',
  entrance: 'power3.out',
  exit: 'power2.in',
  spring: 'back.out(1.4)',
} as const;

export const DISTANCE = {
  subtle: 16,
  standard: 40,
  expressive: 80,
} as const;

export const STAGGER = {
  tight: 0.04,
  base: 0.08,
  loose: 0.15,
} as const;

export const TRIGGER_START = 'top 82%';
