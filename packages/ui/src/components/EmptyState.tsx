import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

const BRAND_MARK = '/brand/logo-mark-128.png';

export type EmptyStateMood = 'neutral' | 'happy' | 'sad' | 'empty' | 'debt';

const MOOD_ART: Record<EmptyStateMood, string> = {
  neutral: '/img-personajes/web/mascota-capibara.webp',
  happy: '/img-personajes/web/ahorro.webp',
  sad: '/img-personajes/web/capibara-triste.webp',
  empty: '/img-personajes/web/sin-dinero.webp',
  debt: '/img-personajes/web/deudas.webp',
};

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  mood?: EmptyStateMood;
}

export function EmptyState({ icon, title, description, action, className, mood }: Readonly<EmptyStateProps>) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-soft',
        className,
      )}
    >
      {mood ? (
        <img src={MOOD_ART[mood]} alt="" width={176} height={176} className="mb-4 w-40 select-none opacity-95" />
      ) : (
        <div className="mb-4 flex size-16 items-center justify-center [&_svg]:size-7">
          {icon ?? <img src={BRAND_MARK} alt="" width={64} height={64} className="size-16 opacity-90" />}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
