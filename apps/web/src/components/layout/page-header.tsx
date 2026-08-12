import type { ReactNode, Ref } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  titleAside?: ReactNode;
  description?: string;
  action?: ReactNode;
  sticky?: boolean;
  offsetTop?: string;
  ref?: Ref<HTMLDivElement>;
}

export function PageHeader({ title, titleAside, description, action, sticky = true, offsetTop, ref }: Readonly<Props>) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex flex-wrap items-end justify-between gap-4',
        sticky && [
          'sticky z-20 bg-background/85 backdrop-blur-xl',
          offsetTop ?? 'top-16',
          offsetTop
            ? '-mx-4 px-4 pb-3 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8'
            : '-mx-4 -mt-4 px-4 pb-3 pt-4 md:-mx-6 md:-mt-6 md:px-6 md:pt-6 lg:-mx-8 lg:-mt-8 lg:px-8 lg:pt-8',
          'border-b border-border/60',
        ],
      )}
    >
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-[1.75rem]">
          {title}
          {titleAside}
        </h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}
