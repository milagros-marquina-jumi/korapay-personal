'use client';

import { useQuery } from '@tanstack/react-query';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Workspace } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string) => void;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const STORAGE_KEY = 'korapay.activeWorkspaceId';

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: () => apiFetch<Workspace[]>('/workspaces'),
  });

  const workspaces = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    if (!workspaces.length) return;
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    const exists = stored && workspaces.some((w) => w.id === stored);
    if (stored && !exists && typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
    setActiveWorkspaceIdState((current) => {
      if (current && workspaces.some((w) => w.id === current)) return current;
      const next = exists ? stored : (workspaces[0]?.id ?? null);
      if (next && typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, [workspaces]);

  const setActiveWorkspaceId = (id: string) => {
    setActiveWorkspaceIdState(id);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, id);
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) ?? null;

  const value = useMemo<WorkspaceContextValue>(
    () => ({ workspaces, activeWorkspace, activeWorkspaceId, setActiveWorkspaceId, isLoading }),
    [workspaces, activeWorkspace, activeWorkspaceId, isLoading],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace debe usarse dentro de WorkspaceProvider');
  return ctx;
}
