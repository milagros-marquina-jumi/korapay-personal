'use client';

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

export function useCatalogCreate(workspaceId: string) {
  const queryClient = useQueryClient();

  const crear = async <T>(path: string, body: Record<string, unknown>, key: readonly unknown[], etiqueta: string) => {
    const creado = await apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
    await queryClient.invalidateQueries({ queryKey: key });
    toast.success(`${etiqueta} creado`);
    return creado;
  };

  return {
    createCategory: (name: string) =>
      crear<{ id: string; name: string }>(
        '/categories',
        { workspaceId, name },
        queryKeys.categories(workspaceId),
        'Concepto',
      ),
    createCompany: (name: string) =>
      crear<{ id: string; name: string }>(
        '/companies',
        { workspaceId, name },
        queryKeys.companies(workspaceId),
        'Empresa',
      ),
    createBank: (name: string) => crear<{ id: string; name: string }>('/banks', { name }, queryKeys.banks(), 'Banco'),
    createPaymentMethod: (name: string) =>
      crear<{ id: string; name: string }>('/payment-methods', { name }, queryKeys.paymentMethods(), 'Medio de pago'),
  };
}
