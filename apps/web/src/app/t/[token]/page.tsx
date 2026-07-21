'use client';

import { EmptyState } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import type { LedgerFormValues } from '@/components/talent/ledger-form-dialog';
import { LedgerSection } from '@/components/talent/ledger-section';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { TalentLedgerEntry, TalentPortalProfile } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

function normalize(values: LedgerFormValues) {
  return {
    date: values.date,
    type: values.type,
    paidAmount: values.paidAmount || '0',
    debtAmount: values.debtAmount || '0',
    pendingAmount: values.pendingAmount || '0',
    status: values.status,
    description: values.description || undefined,
  };
}

export default function TalentPortalPage() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.portal(token),
    queryFn: () => apiFetch<TalentPortalProfile>(`/portal/${token}`),
    enabled: !!token,
    retry: false,
  });

  const { data: entries } = useQuery({
    queryKey: queryKeys.portalLedger(token),
    queryFn: () => apiFetch<TalentLedgerEntry[]>(`/portal/${token}/ledger`),
    enabled: !!token && !!profile,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.portal(token) });
    queryClient.invalidateQueries({ queryKey: queryKeys.portalLedger(token) });
  };

  const createMut = useMutation({
    mutationFn: (values: LedgerFormValues) =>
      apiFetch(`/portal/${token}/ledger`, { method: 'POST', body: JSON.stringify(normalize(values)) }),
    onSuccess: () => {
      invalidate();
      toast.success('Registro creado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ entryId, values }: { entryId: string; values: LedgerFormValues }) =>
      apiFetch(`/portal/${token}/ledger/${entryId}`, { method: 'PATCH', body: JSON.stringify(normalize(values)) }),
    onSuccess: () => {
      invalidate();
      toast.success('Registro actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <EmptyState
        title="Enlace no valido"
        description="Este enlace no existe o fue revocado. Solicita uno nuevo al administrador."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Estado de cuenta</p>
        <h1 className="font-display text-2xl font-bold tracking-tight">{profile.talent.name}</h1>
      </div>

      <LedgerSection
        entries={entries ?? []}
        summary={profile.summary}
        canDelete={false}
        onCreate={(v) => createMut.mutateAsync(v).then(() => undefined)}
        onUpdate={(entryId, v) => updateMut.mutateAsync({ entryId, values: v }).then(() => undefined)}
        isMutating={createMut.isPending || updateMut.isPending}
      />
    </div>
  );
}
