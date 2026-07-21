'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import type { LedgerFormValues } from '@/components/talent/ledger-form-dialog';
import { LedgerSection } from '@/components/talent/ledger-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import type { TalentLedgerEntry, TalentPortalProfile } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

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
        title="Enlace no válido"
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mi deuda</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.debtRows.length ? (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Deuda</TableHead>
                    <TableHead className="text-right">Falta pagar</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.debtRows.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDate(d.date)}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm" title={d.description}>
                        {d.description || '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-warning">
                        {formatMoney(d.debt, 'PEN')}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-destructive">
                        {formatMoney(d.pending, 'PEN')}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={d.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 bg-muted/40">
                    <TableCell colSpan={2} className="text-sm font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-warning">
                      {formatMoney(profile.summary.totalDebt, 'PEN')}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-destructive">
                      {formatMoney(profile.summary.totalPending, 'PEN')}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No tienes deudas pendientes.</p>
          )}
        </CardContent>
      </Card>

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
