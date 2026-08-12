'use client';

import { WifiOff } from 'lucide-react';
import { useIsOnline } from '@/lib/use-pwa';

export function NetworkStatus() {
  const isOnline = useIsOnline();

  if (isOnline) return null;

  return (
    <output
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-sm items-start gap-3 rounded-xl border border-warning/40 bg-card p-3 shadow-card sm:left-auto sm:right-4"
    >
      <WifiOff className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">Sin conexión</p>
        <p className="text-xs text-muted-foreground">
          Estás viendo datos guardados. No podrás registrar movimientos hasta reconectarte.
        </p>
      </div>
    </output>
  );
}
