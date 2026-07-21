'use client';

import { useWorkspace } from '@/components/providers/workspace-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspaceId, setActiveWorkspaceId, isLoading } = useWorkspace();

  if (isLoading || !activeWorkspaceId) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <Select value={activeWorkspaceId} onValueChange={setActiveWorkspaceId}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecciona workspace" />
      </SelectTrigger>
      <SelectContent>
        {workspaces.map((w) => (
          <SelectItem key={w.id} value={w.id}>
            <span className="mr-2">{w.emoji}</span>
            {w.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
