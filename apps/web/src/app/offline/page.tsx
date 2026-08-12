import { WifiOff } from 'lucide-react';
import type { Metadata } from 'next';
import { OfflineRetryButton } from './offline-retry-button';

export const metadata: Metadata = {
  title: 'Sin conexión — KoraPay',
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border border-border bg-card">
          <WifiOff className="size-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">Sin conexión</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No hay conexión a internet. Las páginas que ya visitaste siguen disponibles; para ver datos actualizados
          necesitas volver a conectarte.
        </p>
        <OfflineRetryButton />
      </div>
    </div>
  );
}
