'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Profile } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: () => apiFetch<Profile>('/profile'),
    staleTime: 5 * 60 * 1000,
  });
}

export function profileInitials(name: string | undefined): string {
  if (!name) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
