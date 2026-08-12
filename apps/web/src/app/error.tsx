'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

const RELOAD_FLAG = 'korapay.chunkReloaded';

function isStaleChunkError(error: Error) {
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(
    `${error.name} ${error.message}`,
  );
}

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (!isStaleChunkError(error)) return;
    if (sessionStorage.getItem(RELOAD_FLAG) === '1') return;
    sessionStorage.setItem(RELOAD_FLAG, '1');
    globalThis.location.reload();
  }, [error]);

  useEffect(() => {
    if (!isStaleChunkError(error)) sessionStorage.removeItem(RELOAD_FLAG);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Algo salió mal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No pudimos cargar esta sección. Vuelve a intentarlo; si continúa, recarga la página.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button type="button" onClick={reset}>
            Reintentar
          </Button>
          <Button type="button" variant="outline" onClick={() => globalThis.location.reload()}>
            Recargar
          </Button>
        </div>
      </div>
    </div>
  );
}
