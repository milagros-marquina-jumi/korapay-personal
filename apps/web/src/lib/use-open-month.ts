'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Recuerda que mes dejo abierto el usuario. Mientras no toque nada abre el
 * mes por defecto que le pase la pagina.
 */
export function useOpenMonth(storageKey: string, defaultKey: string | null) {
  const [stored, setStored] = useState<string | null>(null);
  const defaultRef = useRef(defaultKey);
  defaultRef.current = defaultKey;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setStored(window.localStorage.getItem(storageKey));
  }, [storageKey]);

  const openKey = stored ?? defaultKey;

  const toggle = useCallback(
    (key: string) => {
      setStored((current) => {
        const active = current ?? defaultRef.current;
        const next = active === key ? '' : key;
        if (typeof window !== 'undefined') window.localStorage.setItem(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const isOpen = (key: string) => openKey === key;

  return { isOpen, toggle };
}
