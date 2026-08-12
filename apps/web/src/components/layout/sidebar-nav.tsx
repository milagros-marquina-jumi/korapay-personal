'use client';

import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Logo } from '@/components/layout/logo';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { footerNavItems, type NavItem, navForType } from './nav-items';

interface SidebarNavProps {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SidebarNav({ onNavigate, collapsed = false, onToggleCollapse }: Readonly<SidebarNavProps>) {
  const pathname = usePathname();
  const { activeWorkspace } = useWorkspace();
  const items = navForType(activeWorkspace?.type);

  const matches = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Solo el href mas especifico que coincide queda activo: sin esto, estando en
  // /mimotech/talentos/reporte se marcarian a la vez "Talentos" y "Reportes".
  const bestMatch = useMemo(() => {
    const hrefs: string[] = [];
    const collect = (list: NavItem[]) => {
      for (const item of list) {
        hrefs.push(item.href);
        if (item.children?.length) collect(item.children);
      }
    };
    collect(items);
    collect(footerNavItems);
    return hrefs.filter(matches).sort((a, b) => b.length - a.length)[0];
  }, [items, pathname]);

  const isActive = (href: string) => href === bestMatch;

  const renderLink = (item: NavItem, depth = 0, exact = false, index = 0) => (
    <NavLink
      key={item.href}
      item={item}
      depth={depth}
      index={index}
      collapsed={collapsed}
      active={exact ? pathname === item.href : isActive(item.href)}
      descendantActive={exact && pathname !== item.href && isActive(item.href)}
      onNavigate={onNavigate}
    />
  );

  const renderItem = (item: NavItem, index: number) => {
    if (!item.children?.length) return renderLink(item, 0, false, index);
    return (
      <NavGroup
        key={item.href}
        item={item}
        index={index}
        collapsed={collapsed}
        isActive={isActive}
        matches={matches}
        renderLink={renderLink}
      />
    );
  };

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
        <div
          className={cn(
            'flex h-16 items-center border-b border-sidebar-border',
            collapsed ? 'justify-center px-2' : 'px-5',
          )}
        >
          <Link href="/dashboard" className="transition-transform duration-300 hover:scale-[1.04]">
            <Logo size={30} withWordmark={!collapsed} />
          </Link>
        </div>

        <div className={cn('border-b border-sidebar-border', collapsed ? 'px-2 py-3' : 'px-4 py-3')}>
          <WorkspaceSwitcher collapsed={collapsed} />
        </div>

        <nav className={cn('sidebar-scroll flex-1 space-y-1 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
          {items.map((item, i) => renderItem(item, i))}
        </nav>

        <div className={cn('space-y-1 border-t border-sidebar-border p-3', collapsed && 'px-2')}>
          {footerNavItems.map((item, i) => renderLink(item, 0, false, items.length + i))}
        </div>

        {onToggleCollapse && (
          <div className="hidden border-t border-sidebar-border p-2 lg:block">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground',
                'transition-colors duration-200 hover:bg-sidebar-accent hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60',
                collapsed && 'justify-center px-0',
              )}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4.5 w-4.5" />
              ) : (
                <>
                  <PanelLeftClose className="h-4.5 w-4.5" />
                  <span>Contraer</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

interface NavLinkProps {
  item: NavItem;
  depth: number;
  index: number;
  collapsed: boolean;
  active: boolean;
  descendantActive: boolean;
  onNavigate?: () => void;
}

function NavLink({ item, depth, index, collapsed, active, descendantActive, onNavigate }: Readonly<NavLinkProps>) {
  const Icon = item.icon;

  let paddingClass = 'px-3';
  if (collapsed) paddingClass = 'justify-center px-0';
  else if (depth > 0) paddingClass = 'pl-11 pr-3';

  let stateClass = 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground';
  if (active) stateClass = 'bg-brand-soft font-semibold text-brand-strong dark:text-brand';
  else if (descendantActive) stateClass = 'font-semibold text-brand-strong hover:bg-sidebar-accent dark:text-brand';

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      style={{ animationDelay: `${index * 28}ms` }}
      className={cn(
        'animate-nav-in group relative flex items-center gap-3 overflow-hidden rounded-xl py-2.5 text-sm font-medium',
        'transition-[background-color,color,transform] duration-200 ease-out-soft',
        'hover:translate-x-0.5 active:scale-[0.985]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar',
        paddingClass,
        stateClass,
      )}
    >
      {active && (
        <span
          aria-hidden
          className={cn(
            'absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-brand-strong dark:bg-brand',
            'transition-all duration-300 ease-spring',
            collapsed ? 'h-6' : 'h-5',
          )}
        />
      )}
      <Icon
        className={cn(
          'h-4.5 w-4.5 shrink-0 transition-transform duration-300 ease-spring',
          'group-hover:scale-110',
          active && 'scale-110',
        )}
      />
      <span className={cn('truncate transition-all duration-200', collapsed && 'pointer-events-none w-0 opacity-0')}>
        {item.label}
      </span>
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip delayDuration={120}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}

interface NavGroupProps {
  item: NavItem;
  index: number;
  collapsed: boolean;
  isActive: (href: string) => boolean;
  matches: (href: string) => boolean;
  renderLink: (item: NavItem, depth?: number, exact?: boolean, index?: number) => React.ReactNode;
}

function NavGroup({ item, index, collapsed, isActive, matches, renderLink }: Readonly<NavGroupProps>) {
  const children = item.children ?? [];
  // El grupo se resalta y se abre si la ruta cae en cualquiera de sus hijos,
  // aunque el enlace activo sea solo uno de ellos.
  const groupActive = children.some((c) => matches(c.href)) || matches(item.href);
  const [open, setOpen] = useState(groupActive);
  const ItemIcon = item.icon;

  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  if (collapsed) {
    return (
      <div className="space-y-1">
        {renderLink({ href: item.href, label: item.label, icon: item.icon }, 0, item.linkable, index)}
        {children.map((c, i) => renderLink(c, 0, false, index + i + 1))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">
          {item.linkable ? (
            renderLink({ href: item.href, label: item.label, icon: item.icon }, 0, true, index)
          ) : (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              style={{ animationDelay: `${index * 28}ms` }}
              aria-expanded={open}
              className={cn(
                'animate-nav-in group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                'transition-[background-color,color,transform] duration-200 ease-out-soft',
                'hover:translate-x-0.5 hover:bg-sidebar-accent',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60',
                groupActive ? 'text-brand-strong dark:text-brand' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <ItemIcon className="h-4.5 w-4.5 shrink-0 transition-transform duration-300 ease-spring group-hover:scale-110" />
              <span className="truncate">{item.label}</span>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? `Contraer ${item.label}` : `Expandir ${item.label}`}
          aria-expanded={open}
          className={cn(
            'rounded-lg p-1.5 text-muted-foreground transition-colors duration-200',
            'hover:bg-sidebar-accent hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60',
          )}
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform duration-300 ease-spring', open && 'rotate-180')} />
        </button>
      </div>

      <div
        style={{ maxHeight: open ? `${children.length * 46 + 24}px` : '0px' }}
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out-soft"
      >
        <div className={cn('relative space-y-1 transition-opacity duration-200', open ? 'opacity-100' : 'opacity-0')}>
          <span aria-hidden className="absolute bottom-1 left-5.5 top-1 w-px bg-sidebar-border" />
          {children.map((c, i) =>
            c.children?.length ? (
              <NavGroup
                key={c.href}
                item={c}
                index={index + i + 1}
                collapsed={collapsed}
                isActive={isActive}
                matches={matches}
                renderLink={renderLink}
              />
            ) : (
              renderLink(c, 1, false, index + i + 1)
            ),
          )}
        </div>
      </div>
    </div>
  );
}
