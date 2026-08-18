'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { TalentLedgerDetailDialog } from '@/components/talent/ledger-detail-dialog';
import type { LedgerFormValues } from '@/components/talent/ledger-form-dialog';
import { LedgerFormDialog } from '@/components/talent/ledger-form-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconAction } from '@/components/ui/icon-action';
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

  const [detalle, setDetalle] = useState<TalentLedgerEntry | null>(null);
  const [editando, setEditando] = useState<TalentLedgerEntry | null>(null);
  const entradaDe = (id: string) => (entries ?? []).find((e) => e.id === id) ?? null;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.portal(token) });
    queryClient.invalidateQueries({ queryKey: queryKeys.portalLedger(token) });
  };

  const createMut = useMutation({
    mutationFn: (values: LedgerFormValues) =>
      apiFetch(`/portal/${token}/ledger`, { method: 'POST', body: JSON.stringify(normalize(values)) }),
    onSuccess: () => {
      invalidate();
      toast.success('Deuda registrada');
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
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Mi deuda</CardTitle>
          <LedgerFormDialog
            defaultType="DEUDA"
            isPending={createMut.isPending}
            onSubmit={(v) => createMut.mutateAsync(v).then(() => undefined)}
            trigger={
              <Button size="sm">
                <Plus className="mr-1 size-4" /> Nueva deuda
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          {profile.debtRows.length ? (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Falta pagar</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.debtRows.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDate(d.date)}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm" title={d.description}>
                        {d.description || '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-destructive">
                        {formatMoney(d.pending, 'PEN')}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={d.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-0.5">
                          <IconAction icon={Eye} label="Ver detalle" onClick={() => setDetalle(entradaDe(d.id))} />
                          <IconAction icon={Pencil} label="Editar" onClick={() => setEditando(entradaDe(d.id))} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 bg-muted/40">
                    <TableCell colSpan={2} className="text-sm font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-destructive">
                      {formatMoney(profile.summary.totalPending, 'PEN')}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No tienes deudas pendientes.</p>
          )}
        </CardContent>
      </Card>

      <TalentLedgerDetailDialog entry={detalle} currency="PEN" onOpenChange={(next) => !next && setDetalle(null)} />

      {editando && (
        <LedgerFormDialog
          entry={editando}
          isPending={updateMut.isPending}
          onSubmit={(v) => updateMut.mutateAsync({ entryId: editando.id, values: v }).then(() => undefined)}
          open
          onOpenChange={(next) => {
            if (!next) setEditando(null);
          }}
        />
      )}
    </div>
  );
}
