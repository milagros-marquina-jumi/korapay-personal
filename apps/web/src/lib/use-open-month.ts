'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Recuerda que meses dejo abiertos el usuario. Mientras no toque nada abre el
 * mes por defecto que le pase la pagina. Se pueden abrir varios a la vez.
 */
export function useOpenMonth(storageKey: string, defaultKey: string | null) {
  const [stored, setStored] = useState<string[] | null>(null);
  const defaultRef = useRef(defaultKey);
  defaultRef.current = defaultKey;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(storageKey);
    if (raw === null) return;
    setStored(parseKeys(raw));
  }, [storageKey]);

  const openKeys = stored ?? (defaultKey ? [defaultKey] : []);

  const toggle = useCallback(
    (key: string) => {
      setStored((current) => {
        const active = current ?? (defaultRef.current ? [defaultRef.current] : []);
        const next = active.includes(key) ? active.filter((k) => k !== key) : [...active, key];
        if (typeof window !== 'undefined') window.localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [storageKey],
  );

  const isOpen = (key: string) => openKeys.includes(key);

  return { isOpen, toggle };
}

function parseKeys(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((k): k is string => typeof k === 'string');
  } catch {
    // Antes se guardaba una sola clave suelta: se respeta al migrar.
  }
  return raw ? [raw] : [];
}
