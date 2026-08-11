'use client';

import { Menu } from 'lucide-react';
import { useState } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useSidebarState } from '@/components/layout/use-sidebar-state';
import { UserMenu } from '@/components/layout/user-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { readonly children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, hydrated, toggle } = useSidebarState();

  return (
    <div className="flex min-h-screen flex-col">
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 hidden h-screen border-r border-sidebar-border bg-sidebar lg:block',
          hydrated && 'transition-[width] duration-300 ease-out-soft',
          collapsed ? 'w-19' : 'w-64',
        )}
      >
        <SidebarNav collapsed={collapsed} onToggleCollapse={toggle} />
      </aside>

      <div
        className={cn(
          'flex flex-1 flex-col',
          hydrated && 'transition-[margin] duration-300 ease-out-soft',
          collapsed ? 'lg:ml-19' : 'lg:ml-64',
        )}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-sidebar-border p-0">
              <SheetTitle className="sr-only">Navegación</SheetTitle>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />
          <ThemeToggle />
          <UserMenu />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
