'use client';

import type { ReactNode } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { useStickyOffset } from '@/components/layout/use-sticky-offset';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  titleAside?: ReactNode;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  beforeHeader?: ReactNode;
}

export function PageShell({
  title,
  titleAside,
  description,
  action,
  children,
  className,
  beforeHeader,
}: Readonly<Props>) {
  const { containerRef, headerRef } = useStickyOffset<HTMLDivElement, HTMLDivElement>();

  return (
    <div ref={containerRef} className={cn('flex flex-col', className)}>
      {beforeHeader && (
        <div className="sticky top-16 z-30 -mx-4 -mt-4 bg-background/85 px-4 pb-2 pt-4 backdrop-blur-xl md:-mx-6 md:-mt-6 md:px-6 md:pt-6 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8">
          {beforeHeader}
        </div>
      )}
      <PageHeader
        ref={headerRef}
        title={title}
        titleAside={titleAside}
        description={description}
        action={action}
        offsetTop={beforeHeader ? 'top-33' : undefined}
      />
      <div className="flex flex-col gap-6 pt-4">{children}</div>
    </div>
  );
}
