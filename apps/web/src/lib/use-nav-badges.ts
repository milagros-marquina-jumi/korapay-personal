'use client';

import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { apiFetch } from '@/lib/api';
import type {
  Debt,
  DetectedSummary,
  Paginated,
  PendingItem,
  RecurrenceRule,
  TaxObligation,
  Transaction,
} from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const SIN_SALDAR = new Set(['PENDING', 'PARTIAL', 'OVERDUE']);

export function useNavBadges(): Record<string, number> {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const ws = activeWorkspaceId ?? '';
  const tipo = activeWorkspace?.type;
  const esPersonal = tipo === 'PERSONAL' || tipo === 'SHARED';
  const esNegocio = tipo === 'BUSINESS';
  const esLaboral = tipo === 'EMPLOYMENT';

  const { data: pendientes } = useQuery({
    queryKey: queryKeys.pendingItems(ws),
    queryFn: () => apiFetch<PendingItem[]>(`/pending-items?workspaceId=${ws}`),
    enabled: !!ws && esPersonal,
  });

  const { data: deudas } = useQuery({
    queryKey: queryKeys.debts(ws),
    queryFn: () => apiFetch<Debt[]>(`/debts?workspaceId=${ws}`),
    enabled: !!ws && esPersonal,
  });

  const { data: detectados } = useQuery({
    queryKey: queryKeys.detectedSummary(),
    queryFn: () => apiFetch<DetectedSummary>('/detected-transactions/summary'),
    enabled: !!ws && esPersonal,
  });

  const { data: recurrentes } = useQuery({
    queryKey: queryKeys.recurrences(ws),
    queryFn: () => apiFetch<RecurrenceRule[]>(`/recurrences?workspaceId=${ws}`),
    enabled: !!ws && esPersonal,
  });

  const { data: movimientos } = useQuery({
    queryKey: queryKeys.transactions(ws, { badge: true }),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(`/transactions?workspaceId=${ws}&pageSize=500&sortBy=date&sortOrder=desc`),
    enabled: !!ws && (esPersonal || esNegocio || esLaboral),
  });

  const { data: renta } = useQuery({
    queryKey: queryKeys.taxObligations(ws),
    queryFn: () => apiFetch<TaxObligation[]>(`/tax-obligations?workspaceId=${ws}`),
    enabled: !!ws && esLaboral,
  });

  const sinPagar = (filas: Transaction[], tipos: string[]) =>
    filas.filter((t) => tipos.includes(t.type) && SIN_SALDAR.has(t.status)).length;

  const filas = movimientos?.data ?? [];
  const badges: Record<string, number> = {};

  if (esPersonal) {
    badges['/pendientes'] = (pendientes ?? []).filter((p) => SIN_SALDAR.has(p.status)).length;
    badges['/deudas'] = (deudas ?? []).filter((d) => SIN_SALDAR.has(d.status)).length;
    badges['/movimientos/detectados'] = detectados?.pendingReview ?? 0;
    badges['/movimientos/recurrentes'] = (recurrentes ?? []).filter((r) => r.status === 'ACTIVE').length;
    badges['/movimientos'] = sinPagar(filas, ['EXPENSE', 'INCOME', 'SAVING']);
  }

  if (esNegocio) {
    badges['/mimotech/costos'] = sinPagar(filas, ['BUSINESS_COST']);
    badges['/mimotech/equipo/pagos'] = sinPagar(filas, ['TEAM_PAYMENT']);
  }

  if (esLaboral) {
    badges['/ingresos'] = sinPagar(filas, ['INCOME']);
    badges['/renta'] = (renta ?? []).filter((o) => SIN_SALDAR.has(o.status)).length;
  }

  return badges;
}
