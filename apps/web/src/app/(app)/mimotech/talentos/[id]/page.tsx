'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, KeyRound, ShieldOff } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import type { LedgerFormValues } from '@/components/talent/ledger-form-dialog';
import { LedgerSection } from '@/components/talent/ledger-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/api';
import type { Talent, TalentAuditEntry, TalentLedgerEntry, TalentLedgerSummary } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

function formatDateOrActive(value?: string | null) {
  return value ? formatDate(value) : 'Actual';
}

const ACTION_LABELS: Record<string, string> = { CREATE: 'Creó', UPDATE: 'Editó', DELETE: 'Eliminó' };

function TalentDetailContent() {
  const { activeWorkspaceId } = useWorkspace();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const ws = activeWorkspaceId ?? '';

  const { data: talent, isLoading } = useQuery({
    queryKey: queryKeys.talent(ws, id),
    queryFn: () => apiFetch<Talent>(`/talents/${id}?workspaceId=${ws}`),
    enabled: !!ws && !!id,
  });

  const { data: entries } = useQuery({
    queryKey: queryKeys.talentLedger(ws, id),
    queryFn: () => apiFetch<TalentLedgerEntry[]>(`/talent-ledger?workspaceId=${ws}&talentId=${id}`),
    enabled: !!ws && !!id,
  });

  const { data: summaryList } = useQuery({
    queryKey: queryKeys.talentLedgerSummary(ws),
    queryFn: () => apiFetch<TalentLedgerSummary[]>(`/talent-ledger/summary?workspaceId=${ws}`),
    enabled: !!ws,
  });

  const { data: audit } = useQuery({
    queryKey: queryKeys.talentAudit(ws, id),
    queryFn: () => apiFetch<TalentAuditEntry[]>(`/talent-ledger/audit?workspaceId=${ws}&talentId=${id}`),
    enabled: !!ws && !!id,
  });

  const summary = summaryList?.find((s) => s.talentId === id);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.talentLedger(ws, id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.talentLedgerSummary(ws) });
    queryClient.invalidateQueries({ queryKey: queryKeys.talentAudit(ws, id) });
  };

  const createMut = useMutation({
    mutationFn: (values: LedgerFormValues) =>
      apiFetch('/talent-ledger', {
        method: 'POST',
        body: JSON.stringify({ workspaceId: ws, talentId: id, ...normalize(values) }),
      }),
    onSuccess: () => {
      invalidate();
      toast.success('Registro creado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ entryId, values }: { entryId: string; values: LedgerFormValues }) =>
      apiFetch(`/talent-ledger/${entryId}`, {
        method: 'PATCH',
        body: JSON.stringify({ workspaceId: ws, ...normalize(values) }),
      }),
    onSuccess: () => {
      invalidate();
      toast.success('Registro actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (entryId: string) => apiFetch(`/talent-ledger/${entryId}?workspaceId=${ws}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      toast.success('Registro eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const tokenMut = useMutation({
    mutationFn: (action: 'generate' | 'revoke') =>
      apiFetch(`/talents/${id}/access-token?workspaceId=${ws}`, { method: action === 'generate' ? 'POST' : 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talent(ws, id) });
      toast.success('Acceso actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !talent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  const contracts = talent.contracts ?? [];
  const portalUrl = talent.accessToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/t/${talent.accessToken}`
    : null;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <Link href="/mimotech/talentos">
          <ArrowLeft className="mr-2 h-4 w-4" /> Talentos
        </Link>
      </Button>

      <PageHeader title={talent.name} action={<StatusBadge status={talent.status} />} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="size-4" /> Acceso del talento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {portalUrl ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <code className="flex-1 truncate rounded-lg bg-muted px-3 py-2 text-sm">{portalUrl}</code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(portalUrl);
                    toast.success('Link copiado');
                  }}
                >
                  <Copy className="mr-1 size-4" /> Copiar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => tokenMut.mutate('revoke')}
                  disabled={tokenMut.isPending}
                >
                  <ShieldOff className="mr-1 size-4" /> Revocar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Cualquiera con este enlace puede ver y registrar los movimientos de este talento. Revócalo si se filtra.
              </p>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Genera un enlace privado para que el talento vea su estado de cuenta.
              </p>
              <Button size="sm" onClick={() => tokenMut.mutate('generate')} disabled={tokenMut.isPending}>
                <KeyRound className="mr-1 size-4" /> Generar link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="ledger">
        <TabsList>
          <TabsTrigger value="ledger">Estado de cuenta</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="audit">Auditoría</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger">
          <LedgerSection
            entries={entries ?? []}
            summary={summary}
            onCreate={(v) => createMut.mutateAsync(v).then(() => undefined)}
            onUpdate={(entryId, v) => updateMut.mutateAsync({ entryId, values: v }).then(() => undefined)}
            onDelete={async (entryId) => {
              const ok = await confirm({
                title: 'Eliminar registro',
                description: 'Esta acción no se puede deshacer.',
                confirmLabel: 'Eliminar',
                destructive: true,
              });
              if (ok) deleteMut.mutate(entryId);
            }}
            isMutating={createMut.isPending || updateMut.isPending}
          />
        </TabsContent>

        <TabsContent value="contracts">
          {contracts.length ? (
            <div className="space-y-4">
              {contracts.map((contract) => (
                <Card key={contract.id}>
                  <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle>{contract.position ?? 'Contrato'}</CardTitle>
                    <StatusBadge status={contract.status} />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        {formatDate(contract.startDate)} – {formatDateOrActive(contract.endDate)}
                      </span>
                      {contract.rate && (
                        <span className="font-medium tabular-nums text-foreground">
                          {formatMoney(contract.rate, contract.currency as 'PEN' | 'USD')}
                        </span>
                      )}
                    </div>
                    {contract.incomeDistributions?.length ? (
                      <div className="overflow-x-auto rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right">Con descuento</TableHead>
                              <TableHead className="text-right">Recibido</TableHead>
                              <TableHead className="text-right">Retenido</TableHead>
                              <TableHead>Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contract.incomeDistributions.map((dist) => (
                              <TableRow key={dist.id}>
                                <TableCell className="text-right tabular-nums">
                                  {formatMoney(dist.amountWithDiscount, contract.currency as 'PEN' | 'USD')}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {formatMoney(dist.amountReceived, contract.currency as 'PEN' | 'USD')}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {formatMoney(dist.amountRetained, contract.currency as 'PEN' | 'USD')}
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={dist.status} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin distribuciones registradas</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin contratos" description="Este talento aún no tiene contratos registrados." />
          )}
        </TabsContent>

        <TabsContent value="audit">
          {audit?.length ? (
            <div className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y hora</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audit.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(a.createdAt).toLocaleString('es-PE')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={a.action === 'DELETE' ? 'destructive' : a.action === 'CREATE' ? 'success' : 'info'}
                        >
                          {ACTION_LABELS[a.action] ?? a.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.changes?.actor?.startsWith('TALENT') ? 'Talento' : 'Administrador'}
                      </TableCell>
                      <TableCell>
                        <AuditDetail entry={a} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState title="Sin cambios" description="Aún no hay historial de auditoría." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

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

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
};
const TYPE_LABELS: Record<string, string> = { EGRESO: 'Egreso', DEUDA: 'Deuda' };

interface LedgerSnapshot {
  date?: string;
  type?: string;
  paidAmount?: string;
  debtAmount?: string;
  pendingAmount?: string;
  status?: string;
  description?: string | null;
}

function snapshotLines(snap: LedgerSnapshot): string[] {
  const lines: string[] = [];
  if (snap.date) lines.push(`Fecha: ${formatDate(snap.date)}`);
  if (snap.type) lines.push(`Tipo: ${TYPE_LABELS[snap.type] ?? snap.type}`);
  if (snap.paidAmount !== undefined) lines.push(`Pagado: ${formatMoney(snap.paidAmount, 'PEN')}`);
  if (snap.debtAmount !== undefined) lines.push(`Deuda: ${formatMoney(snap.debtAmount, 'PEN')}`);
  if (snap.pendingAmount !== undefined) lines.push(`Falta pagar: ${formatMoney(snap.pendingAmount, 'PEN')}`);
  if (snap.status) lines.push(`Estado: ${STATUS_LABELS[snap.status] ?? snap.status}`);
  if (snap.description) lines.push(`Descripción: ${snap.description}`);
  return lines;
}

function AuditDetail({ entry }: { entry: TalentAuditEntry }) {
  const before = entry.changes?.before as LedgerSnapshot | undefined;
  const after = entry.changes?.after as LedgerSnapshot | undefined;

  if (entry.action === 'DELETE' && before) {
    return (
      <div className="space-y-0.5 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Registro eliminado</p>
        {snapshotLines(before).map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
    );
  }

  if (entry.action === 'UPDATE' && before && after) {
    const changed = snapshotLines(after).filter((line, i) => line !== snapshotLines(before)[i]);
    return (
      <div className="space-y-0.5 text-xs text-muted-foreground">
        {changed.length ? changed.map((l) => <p key={l}>{l}</p>) : <p>Sin cambios de valor</p>}
      </div>
    );
  }

  if (after) {
    return (
      <div className="space-y-0.5 text-xs text-muted-foreground">
        {snapshotLines(after).map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
    );
  }

  return <span className="text-xs text-muted-foreground">—</span>;
}

export default function TalentDetailPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <TalentDetailContent />
    </WorkspaceGate>
  );
}
