'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';
import { cn } from '@/lib/utils';
import { footerNavItem, navItems } from './nav-items';

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const renderItem = (item: (typeof navItems)[number]) => {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
          K
        </div>
        <span className="font-display text-lg font-bold">KoraPay</span>
      </div>

      <div className="border-b px-4 py-3">
        <WorkspaceSwitcher />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">{navItems.map(renderItem)}</nav>

      <div className="border-t p-3">{renderItem(footerNavItem)}</div>
    </div>
  );
}
