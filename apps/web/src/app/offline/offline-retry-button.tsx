'use client';

import { Button } from '@/components/ui/button';

export function OfflineRetryButton() {
  return (
    <Button type="button" className="mt-6" onClick={() => globalThis.location.reload()}>
      Reintentar
    </Button>
  );
}
