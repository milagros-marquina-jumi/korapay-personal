'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import type { GlobalClient, GlobalCompany } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

type ClaveOpcion = 'id' | 'name';

interface Opciones {
  enabled?: boolean;
  /** Que se guarda al elegir: el id del catalogo o su nombre. */
  valueBy?: ClaveOpcion;
}

export function useGlobalCatalog({ enabled = true, valueBy = 'name' }: Opciones = {}) {
  const queryClient = useQueryClient();

  const { data: companies } = useQuery({
    queryKey: queryKeys.globalCompanies(),
    queryFn: () => apiFetch<GlobalCompany[]>('/global-companies'),
    enabled,
  });

  const { data: clients } = useQuery({
    queryKey: queryKeys.globalClients(),
    queryFn: () => apiFetch<GlobalClient[]>('/global-clients'),
    enabled,
  });

  const companyOptions = useMemo(
    () => (companies ?? []).map((c) => ({ value: valueBy === 'id' ? c.id : c.name, label: c.name })),
    [companies, valueBy],
  );

  const clientOptionsFor = (globalCompanyId?: string | null) => {
    const todos = clients ?? [];
    const suyos = globalCompanyId
      ? todos.filter((c) => (c.companyIds ?? [c.globalCompanyId]).some((id) => id === globalCompanyId))
      : [];
    const resto = todos.filter((c) => !suyos.some((s) => s.id === c.id));
    const mapear = (lista: GlobalClient[], group: string) =>
      lista.map((c) => ({ value: valueBy === 'id' ? c.id : c.name, label: c.name, group }));
    if (!suyos.length) return mapear(resto, '');
    return [...mapear(suyos, 'De esta empresa'), ...mapear(resto, 'Otros clientes')];
  };

  const createCompany = async (name: string) => {
    const creada = await apiFetch<GlobalCompany>('/global-companies', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    await queryClient.invalidateQueries({ queryKey: queryKeys.globalCompanies() });
    return creada;
  };

  const createClient = async (name: string, globalCompanyId?: string | null) => {
    const creado = await apiFetch<GlobalClient>('/global-clients', {
      method: 'POST',
      body: JSON.stringify({ name, globalCompanyId: globalCompanyId ?? undefined }),
    });
    await queryClient.invalidateQueries({ queryKey: queryKeys.globalClients() });
    return creado;
  };

  const companyByName = (name?: string | null) =>
    (companies ?? []).find((c) => c.name.toLowerCase() === (name ?? '').toLowerCase());

  return { companies, clients, companyOptions, clientOptionsFor, createCompany, createClient, companyByName };
}
