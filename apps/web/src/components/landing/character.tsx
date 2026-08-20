'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

export const CHARACTER = {
  heroAvion: { src: '/img-personajes/web/hero-avion.webp', alt: 'Capibara y caballo volando en un avión de papel' },
  ahorro: { src: '/img-personajes/web/ahorro.webp', alt: 'Capibara y caballo junto a pilas de monedas' },
  sinDinero: { src: '/img-personajes/web/sin-dinero.webp', alt: 'Capibara y caballo tristes con pocas monedas' },
  deudas: { src: '/img-personajes/web/deudas.webp', alt: 'Capibara y caballo bajo una nube de tormenta' },
  nube: { src: '/img-personajes/web/nube.webp', alt: 'Capibara y caballo sentados sobre una nube' },
  gastos: { src: '/img-personajes/web/gastos.webp', alt: 'Capibara y caballo rodeados de bolsas de compras' },
  banco: { src: '/img-personajes/web/banco.webp', alt: 'Capibara y caballo frente a un banco' },
  hogar: { src: '/img-personajes/web/hogar.webp', alt: 'Capibara y caballo asomados en una casa' },
  capibaraFeliz: { src: '/img-personajes/web/capibara-feliz.webp', alt: 'Capibara feliz con monedas' },
  caballoFeliz: { src: '/img-personajes/web/caballo-feliz.webp', alt: 'Caballo feliz con monedas' },
  capibaraTriste: { src: '/img-personajes/web/capibara-triste.webp', alt: 'Capibara triste con monedas' },
  caballoTriste: { src: '/img-personajes/web/caballo-triste.webp', alt: 'Caballo triste con monedas' },
  mascotaCapibara: { src: '/img-personajes/web/mascota-capibara.webp', alt: 'Capibara de perfil' },
  mascotaCaballo: { src: '/img-personajes/web/mascota-caballo.webp', alt: 'Caballo de perfil' },
} as const;

export type CharacterKey = keyof typeof CHARACTER;

interface Props {
  name: CharacterKey;
  width: number;
  height?: number;
  className?: string;
  float?: boolean;
  priority?: boolean;
  'data-parallax'?: string;
}

export function Character({
  name,
  width,
  height,
  className,
  float = false,
  priority = false,
  ...rest
}: Readonly<Props>) {
  const { src, alt } = CHARACTER[name];
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height ?? width}
      priority={priority}
      className={cn('select-none', float && 'animate-float', className)}
      draggable={false}
      {...rest}
    />
  );
}
