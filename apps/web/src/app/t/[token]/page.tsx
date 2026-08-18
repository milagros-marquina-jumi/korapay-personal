'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { StatusPicker } from '@/components/data-table/status-toggle';
import { DebtOwnerBadge } from '@/components/talent/debt-owner-badge';
import { TalentLedgerDetailDialog } from '@/components/talent/ledger-detail-dialog';
import type { LedgerFormValues } from '@/components/talent/ledger-form-dialog';
import { LedgerFormDialog } from '@/components/talent/ledger-form-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconAction, IconActions } from '@/components/ui/icon-action';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import type { TalentLedgerEntry, TalentPortalProfile } from '@/lib/api.types';
import { DEBT_STATUS_OPTIONS, normalizarDeuda } from '@/lib/debt-status';
import { queryKeys } from '@/lib/query-keys';
import { cn, formatDate } from '@/lib/utils';

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

  const cambiarEstado = (entryId: string, status: string) => {
    const entrada = entradaDe(entryId);
    if (!entrada) return;
    updateMut.mutate({
      entryId,
      values: {
        date: entrada.date.slice(0, 10),
        type: 'DEUDA',
        debtOwner: (entrada.debtOwner as 'TALENT' | 'MINE') ?? 'TALENT',
        paidAmount: '0',
        debtAmount: entrada.debtAmount,
        pendingAmount: normalizarDeuda({
          status,
          debtAmount: entrada.debtAmount,
          pendingAmount: entrada.pendingAmount,
        }),
        status,
        description: entrada.description ?? '',
      },
    });
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.portal(token) });
    queryClient.invalidateQueries({ queryKey: queryKeys.portalLedger(token) });
  };

  const createMut = useMutation({
    mutationFn: (values: LedgerFormValues) =>
      apiFetch(`/portal/${token}/ledger`, { method: 'POST', body: JSON.stringify(normalize(values)) }),
    onSuccess: () => {
      invalidate();
      toast.success('Registro guardado');
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

  const verEgresos = profile.scope === 'DEBTS_EXPENSES';
  const egresos = (entries ?? []).filter((e) => e.type === 'EGRESO');
  const totalEgresos = egresos.reduce((sum, e) => sum + Number(e.paidAmount), 0).toFixed(2);

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
            lockType
            viewer="TALENT"
            talentName={profile.talent.name}
            adminName={profile.owner?.name}
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
                    <TableHead className="w-28">Fecha</TableHead>
                    <TableHead className="w-24">De quién</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-40 whitespace-nowrap text-right">Falta pagar</TableHead>
                    <TableHead className="w-28">Estado</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.debtRows.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDate(d.date)}</TableCell>
                      <TableCell>
                        <DebtOwnerBadge
                          owner={d.debtOwner}
                          viewer="TALENT"
                          talentName={profile.talent.name}
                          adminName={profile.owner?.name}
                        />
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm" title={d.description}>
                        {d.description || '—'}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'whitespace-nowrap text-right tabular-nums',
                          Number(d.pending) > 0 ? 'text-destructive' : 'text-muted-foreground/60',
                        )}
                      >
                        {formatMoney(d.pending, 'PEN')}
                      </TableCell>
                      <TableCell>
                        <StatusPicker
                          status={d.status}
                          options={DEBT_STATUS_OPTIONS}
                          isPending={updateMut.isPending}
                          onSelect={(next) => cambiarEstado(d.id, next)}
                        />
                      </TableCell>
                      <TableCell>
                        <IconActions>
                          <IconAction icon={Eye} label="Ver detalle" onClick={() => setDetalle(entradaDe(d.id))} />
                          <IconAction icon={Pencil} label="Editar" onClick={() => setEditando(entradaDe(d.id))} />
                        </IconActions>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 bg-muted/40">
                    <TableCell colSpan={3} className="font-semibold text-sm">
                      Total
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums text-destructive">
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

      {verEgresos && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Mis egresos</CardTitle>
            <LedgerFormDialog
              defaultType="EGRESO"
              lockType
              viewer="TALENT"
              talentName={profile.talent.name}
              adminName={profile.owner?.name}
              isPending={createMut.isPending}
              onSubmit={(v) => createMut.mutateAsync(v).then(() => undefined)}
              trigger={
                <Button size="sm">
                  <Plus className="mr-1 size-4" /> Nuevo egreso
                </Button>
              }
            />
          </CardHeader>
          <CardContent>
            {egresos.length ? (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Fecha</TableHead>
                      <TableHead className="w-40 whitespace-nowrap text-right">Desembolsado</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="w-28">Estado</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {egresos.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap text-sm">{formatDate(e.date)}</TableCell>
                        <TableCell className="whitespace-nowrap text-right tabular-nums">
                          {formatMoney(e.paidAmount, 'PEN')}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm" title={e.description ?? undefined}>
                          {e.description || '—'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={e.status} />
                        </TableCell>
                        <TableCell>
                          <IconActions>
                            <IconAction icon={Eye} label="Ver detalle" onClick={() => setDetalle(e)} />
                            <IconAction icon={Pencil} label="Editar" onClick={() => setEditando(e)} />
                          </IconActions>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 bg-muted/40">
                      <TableCell className="font-semibold text-sm">Total</TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                        {formatMoney(totalEgresos, 'PEN')}
                      </TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay egresos registrados.</p>
            )}
          </CardContent>
        </Card>
      )}

      <TalentLedgerDetailDialog entry={detalle} currency="PEN" onOpenChange={(next) => !next && setDetalle(null)} />

      {editando && (
        <LedgerFormDialog
          entry={editando}
          lockType
          viewer="TALENT"
          talentName={profile.talent.name}
          adminName={profile.owner?.name}
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
