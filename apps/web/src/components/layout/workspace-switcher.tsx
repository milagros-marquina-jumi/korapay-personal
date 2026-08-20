'use client';

import { useRouter } from 'next/navigation';
import { WorkspaceIcon } from '@/components/layout/workspace-icon';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ collapsed = false }: Readonly<WorkspaceSwitcherProps>) {
  const { workspaces, activeWorkspaceId, activeWorkspace, setActiveWorkspaceId, isLoading } = useWorkspace();
  const router = useRouter();

  // Los inactivos se ocultan, salvo el que este seleccionado: si no, el Select
  // quedaria sin opcion valida y se veria vacio.
  const visibles = workspaces.filter((w) => (w.status ?? 'ACTIVE') !== 'INACTIVE' || w.id === activeWorkspaceId);

  if (isLoading || !activeWorkspaceId) {
    return <Skeleton className={cn('h-10', collapsed ? 'w-10 rounded-xl' : 'w-full')} />;
  }

  const handleChange = (id: string) => {
    if (id === activeWorkspaceId) return;
    setActiveWorkspaceId(id);
  };

  if (collapsed) {
    return (
      <Tooltip delayDuration={120}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            aria-label={activeWorkspace?.name ?? 'Workspace'}
            className={cn(
              'sidebar-sheen flex h-10 w-full items-center justify-center rounded-xl border border-sidebar-border bg-card text-base shadow-soft',
              'transition-transform duration-300 ease-spring hover:scale-105 hover:bg-sidebar-accent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
            )}
          >
            <WorkspaceIcon name={activeWorkspace?.emoji} className="size-4.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10}>
          {activeWorkspace?.name}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Select value={activeWorkspaceId} onValueChange={handleChange}>
      <SelectTrigger
        className={cn(
          'sidebar-sheen h-11 w-full border-sidebar-border bg-card font-medium shadow-soft',
          'transition-all duration-300 ease-out-soft hover:border-brand/50 hover:bg-sidebar-accent',
          'focus-visible:ring-2 focus-visible:ring-brand/50',
        )}
      >
        <SelectValue placeholder="Selecciona workspace" />
      </SelectTrigger>
      <SelectContent>
        {visibles.map((w) => (
          <SelectItem key={w.id} value={w.id}>
            <span className="flex items-center gap-2">
              <WorkspaceIcon name={w.emoji} className="size-4 shrink-0 text-muted-foreground" />
              {w.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
