'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { CalendarEvent, CalendarResponse } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

export function useCalendar(range?: { from?: string; to?: string }) {
  const params = new URLSearchParams();
  if (range?.from) params.set('from', range.from);
  if (range?.to) params.set('to', range.to);
  const qs = params.toString();

  return useQuery({
    queryKey: queryKeys.calendar(range),
    queryFn: () => apiFetch<CalendarResponse>(`/calendar${qs ? `?${qs}` : ''}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function groupByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = map.get(event.date);
    if (list) list.push(event);
    else map.set(event.date, [event]);
  }
  return map;
}

export function upcomingFirst(events: CalendarEvent[]): CalendarEvent[] {
  const futuros = events.filter((e) => e.daysUntil >= 0).sort((a, b) => a.daysUntil - b.daysUntil);
  const vencidos = events.filter((e) => e.daysUntil < 0).sort((a, b) => b.daysUntil - a.daysUntil);
  return [...futuros, ...vencidos];
}
