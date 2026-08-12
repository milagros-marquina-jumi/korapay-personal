'use client';

import { Download, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt, usePWAUpdate } from '@/lib/use-pwa';

const DISMISS_KEY = 'korapay.pwaInstallDismissed';

export function PWABanner() {
  const { showReload, reloadPage } = usePWAUpdate();
  const { isInstallable, installApp } = useInstallPrompt();
  const [installDismissed, setInstallDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  });

  const dismissInstall = () => {
    setInstallDismissed(true);
    window.localStorage.setItem(DISMISS_KEY, '1');
  };

  // La actualizacion tiene prioridad: si hay version nueva esperando, se ofrece
  // recargar antes que instalar.
  if (showReload) {
    return (
      <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-card sm:left-auto sm:right-4">
        <RefreshCw className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Nueva versión disponible</p>
          <p className="text-xs text-muted-foreground">Recarga para aplicar los últimos cambios.</p>
          <Button type="button" size="sm" className="mt-2.5 w-full" onClick={reloadPage}>
            Actualizar ahora
          </Button>
        </div>
      </div>
    );
  }

  if (!isInstallable || installDismissed) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-card sm:left-auto sm:right-4">
      <Download className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Instalar KoraPay</p>
        <p className="text-xs text-muted-foreground">
          Accede más rápido y úsala como una app desde tu pantalla de inicio.
        </p>
        <Button
          type="button"
          size="sm"
          className="mt-2.5 w-full"
          onClick={() => {
            void installApp().then((instalada) => {
              if (!instalada) dismissInstall();
            });
          }}
        >
          Instalar
        </Button>
      </div>
      <button
        type="button"
        onClick={dismissInstall}
        aria-label="Descartar"
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
