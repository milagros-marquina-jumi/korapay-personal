'use client';

import { useEffect, useRef } from 'react';

const APP_HEADER_HEIGHT = 64;

export function useStickyOffset<C extends HTMLElement, H extends HTMLElement>() {
  const containerRef = useRef<C>(null);
  const headerRef = useRef<H>(null);

  useEffect(() => {
    const container = containerRef.current;
    const header = headerRef.current;
    if (!container || !header) return;

    const publish = () => {
      const height = header.getBoundingClientRect().height;
      container.style.setProperty('--toolbar-offset', `${APP_HEADER_HEIGHT + height}px`);
    };

    publish();

    const observer = new ResizeObserver(publish);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return { containerRef, headerRef };
}
