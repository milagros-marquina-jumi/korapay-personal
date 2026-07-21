'use client';

import { useCallback, useRef, useState } from 'react';

export function useHighlightNew(durationMs = 2200) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const markNew = useCallback(
    (id: string) => {
      if (!id) return;
      setIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      clearTimeout(timers.current[id]);
      timers.current[id] = setTimeout(() => {
        setIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        delete timers.current[id];
      }, durationMs);
    },
    [durationMs],
  );

  const isNew = useCallback((id: string) => ids.has(id), [ids]);

  const highlightClass = useCallback((id: string) => (ids.has(id) ? 'animate-row-highlight' : ''), [ids]);

  return { markNew, isNew, highlightClass };
}
