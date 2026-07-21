'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { cn } from '@/lib/utils';
import { footerNavItem, type NavItem, navForType } from './nav-items';

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { activeWorkspace } = useWorkspace();
  const items = navForType(activeWorkspace?.type);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const renderLink = (item: NavItem, indented = false) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors',
          indented ? 'pl-10 pr-3' : 'px-3',
          active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
        {item.label}
      </Link>
    );
  };

  const renderItem = (item: NavItem) => {
    if (!item.children?.length) return renderLink(item);
    const groupActive = item.children.some((c) => isActive(c.href));
    const ItemIcon = item.icon;
    return (
      <div key={item.href} className="space-y-1">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
            groupActive ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <ItemIcon className="h-[18px] w-[18px]" />
          {item.label}
        </div>
        <div className="space-y-1">{item.children.map((c) => renderLink(c, true))}</div>
      </div>
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

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">{items.map(renderItem)}</nav>

      <div className="border-t p-3">{renderLink(footerNavItem)}</div>
    </div>
  );
}
