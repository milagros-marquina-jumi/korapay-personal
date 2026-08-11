'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'korapay.sidebar.collapsed';

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1');
    setHydrated(true);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      }
      return next;
    });
  }, []);

  return { collapsed, hydrated, toggle };
}
