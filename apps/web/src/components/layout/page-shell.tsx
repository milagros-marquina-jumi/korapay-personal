'use client';

import type { ReactNode } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { useStickyOffset } from '@/components/layout/use-sticky-offset';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  beforeHeader?: ReactNode;
}

export function PageShell({ title, description, action, children, className, beforeHeader }: Readonly<Props>) {
  const { containerRef, headerRef } = useStickyOffset<HTMLDivElement, HTMLDivElement>();

  return (
    <div ref={containerRef} className={cn('space-y-6', className)}>
      {beforeHeader}
      <PageHeader ref={headerRef} title={title} description={description} action={action} />
      {children}
    </div>
  );
}
