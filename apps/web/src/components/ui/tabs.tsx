'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

function TabsList({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    // max-w-full + overflow-x-auto: en movil los tabs no caben en 375px y con
    // inline-flex estiraban la pagina entera; asi el strip scrollea solo.
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-11 max-w-full items-center justify-start gap-1 overflow-x-auto scrollbar-none rounded-xl border border-border/60 bg-muted/60 p-1 text-muted-foreground sm:justify-center',
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-semibold ring-offset-background transition-all hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-brand data-[state=active]:shadow-soft',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        'mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
