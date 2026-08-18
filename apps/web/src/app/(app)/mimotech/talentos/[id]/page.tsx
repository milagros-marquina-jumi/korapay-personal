'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard, StatusBadge, statusLabel } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  Copy,
  CopyPlus,
  ExternalLink,
  Eye,
  KeyRound,
  Landmark,
  Pencil,
  Percent,
  PiggyBank,
  Plus,
  ReceiptText,
  ShieldOff,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { StatusPicker } from '@/components/data-table/status-toggle';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { ActiveContractsSummary } from '@/components/talent/active-contracts-summary';
import { type ContractFormValues, TalentContractFormDialog } from '@/components/talent/contract-form-dialog';
import { DebtOwnerBadge } from '@/components/talent/debt-owner-badge';
import { DistributionFormDialog, type DistributionFormValues } from '@/components/talent/distribution-form-dialog';
import type { LedgerFormValues } from '@/components/talent/ledger-form-dialog';
import { LedgerSection } from '@/components/talent/ledger-section';
import { ProjectedPaymentDialog } from '@/components/talent/projected-payment-dialog';
import { TalentContractDetailDialog } from '@/components/talent/talent-contract-detail-dialog';
import { TalentFormDialog } from '@/components/talent/talent-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconAction, IconActions } from '@/components/ui/icon-action';
import { Money } from '@/components/ui/money';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/api';
import type {
  Talent,
  TalentAuditEntry,
  TalentContract,
  TalentIncomeDistribution,
  TalentLedgerEntry,
  TalentLedgerSummary,
  TalentReport,
} from '@/lib/api.types';
import { diasParaVencer } from '@/lib/contract-expiry';
import { DEBT_STATUS_OPTIONS, normalizarDeuda } from '@/lib/debt-status';
import { esPagoExcepcional } from '@/lib/payment-split';
import { queryKeys } from '@/lib/query-keys';
import { ordenarPagosRecientePrimero } from '@/lib/sort-payments';
import { primerTrabajoDe, validarFechasTalento } from '@/lib/talent-dates';
import { computeWorkedTime } from '@/lib/talent-worked-time';
import { useProfile } from '@/lib/use-profile';
import { cn, formatDate, formatDurationDaysCompact, formatDurationExact, formatMonthYear } from '@/lib/utils';

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
  const [editingContract, setEditingContract] = useState<TalentContract | null>(null);
  const [detalleContrato, setDetalleContrato] = useState<TalentContract | null>(null);
  const [contractFilter, setContractFilter] = useState('ACTIVE');
  const [contractCompany, setContractCompany] = useState(FILTER_ALL);
  const [contractPayment, setContractPayment] = useState(FILTER_ALL);
  const [editingDist, setEditingDist] = useState<TalentIncomeDistribution | null>(null);

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

  const { data: report } = useQuery({
    queryKey: queryKeys.talentReport(ws, id),
    queryFn: () => apiFetch<TalentReport>(`/talents/${id}/report?workspaceId=${ws}`),
    enabled: !!ws && !!id,
  });

  const summary = summaryList?.find((s) => s.talentId === id);
  const { data: perfil } = useProfile();

  const cambiarEstadoDeuda = (entryId: string, status: string) => {
    const entrada = (entries ?? []).find((e) => e.id === entryId);
    if (!entrada) return;
    updateMut.mutate({
      entryId,
      values: {
        date: entrada.date.slice(0, 10),
        type: entrada.type as 'EGRESO' | 'DEUDA',
        debtOwner: (entrada.debtOwner as 'TALENT' | 'MINE') ?? 'TALENT',
        paidAmount: entrada.paidAmount,
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
    queryClient.invalidateQueries({ queryKey: queryKeys.talentLedger(ws, id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.talentLedgerSummary(ws) });
    queryClient.invalidateQueries({ queryKey: queryKeys.talentAudit(ws, id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.talentReport(ws, id) });
    queryClient.invalidateQueries({ queryKey: ['talent-global-report', ws] });
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

  const duplicarPago = (contractId: string, dist: TalentIncomeDistribution) => {
    const base = dist.date ? new Date(`${dist.date.slice(0, 10)}T00:00:00Z`) : new Date();
    base.setUTCMonth(base.getUTCMonth() + 1);
    const fecha = `${base.toISOString().slice(0, 7)}-01`;
    createDistMut.mutate({
      contractId,
      values: {
        date: fecha,
        paymentType: dist.paymentType as DistributionFormValues['paymentType'],
        companyName: dist.companyName ?? undefined,
        clientName: dist.clientName ?? undefined,
        salary: dist.salary ?? undefined,
        amountWithDiscount: dist.amountWithDiscount,
        amountReceived: dist.amountReceived,
        amountRetained: dist.amountRetained,
        status: dist.status as DistributionFormValues['status'],
        notes: dist.notes ?? undefined,
      },
    });
  };

  const invalidateTalent = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.talent(ws, id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.talentReport(ws, id) });
    queryClient.invalidateQueries({ queryKey: ['talent-global-report', ws] });
  };

  const createContractMut = useMutation({
    mutationFn: (values: ContractFormValues) =>
      apiFetch(`/talents/${id}/contracts?workspaceId=${ws}`, { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: () => {
      invalidateTalent();
      toast.success('Contrato creado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateContractMut = useMutation({
    mutationFn: ({ contractId, values }: { contractId: string; values: ContractFormValues }) =>
      apiFetch(`/talents/contracts/${contractId}?workspaceId=${ws}`, {
        method: 'PATCH',
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      invalidateTalent();
      toast.success('Contrato actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteContractMut = useMutation({
    mutationFn: (contractId: string) =>
      apiFetch(`/talents/contracts/${contractId}?workspaceId=${ws}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateTalent();
      toast.success('Contrato eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createDistMut = useMutation({
    mutationFn: ({ contractId, values }: { contractId: string; values: DistributionFormValues }) =>
      apiFetch(`/talents/contracts/${contractId}/distributions?workspaceId=${ws}`, {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      invalidateTalent();
      toast.success('Pago registrado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateDistMut = useMutation({
    mutationFn: ({ distId, values }: { distId: string; values: DistributionFormValues }) =>
      apiFetch(`/talents/distributions/${distId}?workspaceId=${ws}`, { method: 'PATCH', body: JSON.stringify(values) }),
    onSuccess: () => {
      invalidateTalent();
      toast.success('Pago actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteDistMut = useMutation({
    mutationFn: (distId: string) =>
      apiFetch(`/talents/distributions/${distId}?workspaceId=${ws}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateTalent();
      toast.success('Pago eliminado');
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
  const empresasDeContratos = [...new Set(contracts.map((c) => c.companyName ?? '').filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
  const tiposDePago = [
    ...new Set(
      contracts.flatMap((c) => [c.paymentType ?? '', ...(c.incomeDistributions ?? []).map((d) => d.paymentType ?? '')]),
    ),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const primerTrabajo = primerTrabajoDe(talent);
  const tiempo = computeWorkedTime(talent.startedWithMeAt, talent.endedWithMeAt, talent.contracts);
  const hayIngresos = (report?.byMonth ?? []).some((m) => Number(m.income) > 0 || Number(m.salary) > 0);
  const hayDeuda = (report?.byMonth ?? []).some((m) => Number(m.pending) > 0);
  const avisos = validarFechasTalento({
    status: talent.status,
    startedWithMeAt: talent.startedWithMeAt,
    endedWithMeAt: talent.endedWithMeAt,
    firstJobAt: primerTrabajo,
    contracts,
  });
  const portalUrl = talent.accessToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/t/${talent.accessToken}`
    : null;

  return (
    <PageShell
      beforeHeader={
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/mimotech/talentos">
            <ArrowLeft className="mr-2 h-4 w-4" /> Talentos
          </Link>
        </Button>
      }
      title={talent.name}
      description={talent.role ?? undefined}
      action={<StatusBadge status={talent.status} />}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Perfil del talento</CardTitle>
          <TalentFormDialog
            workspaceId={ws}
            talent={talent}
            trigger={<IconAction icon={Pencil} label="Editar talento" />}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <DetailItem
              label="Inicio conmigo"
              value={talent.startedWithMeAt ? formatDate(talent.startedWithMeAt) : '—'}
            />
            <DetailItem label="Tiempo conmigo" value={formatDurationDaysCompact(tiempo.totalDays)} />
            <DetailItem
              label="Fin conmigo"
              value={talent.endedWithMeAt ? formatDate(talent.endedWithMeAt) : 'Actual'}
            />
            <DetailItem label="Inicio primer trabajo" value={primerTrabajo ? formatDate(primerTrabajo) : '—'} />
            <DetailItem
              label="Tiempo colocado"
              value={tiempo.neverPlaced ? 'Nunca colocado' : formatDurationDaysCompact(tiempo.workedDays)}
            />
            {tiempo.idleDays > 0 && (
              <DetailItem label="Sin trabajo" value={formatDurationDaysCompact(tiempo.idleDays)} />
            )}
            {tiempo.remainingDays > 0 && (
              <DetailItem label="Le queda conmigo" value={formatDurationDaysCompact(tiempo.remainingDays)} />
            )}
            <DetailItem label="Lugar de estudio" value={talent.studyPlace ?? '—'} />
            <DetailItem label="Inicio estudios" value={talent.studyStartAt ? formatDate(talent.studyStartAt) : '—'} />
            <DetailItem label="Correo" value={talent.email ?? '—'} />
            <DetailItem label="Teléfono" value={talent.phone ?? '—'} />
          </dl>
          {avisos.length > 0 && (
            <div className="space-y-1.5 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2">
              {avisos.map((a) => (
                <p key={a.message} className="flex items-start gap-1.5 text-warning text-xs">
                  <AlertTriangle className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{a.message}</span>
                </p>
              ))}
            </div>
          )}
          {talent.slideUrl && (
            <a
              href={talent.slideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              <ExternalLink className="size-4" /> Ver diapositiva (Canva)
            </a>
          )}
          {talent.notes && (
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">Notas</p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm">{talent.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

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
          <TabsTrigger value="report">Reportes</TabsTrigger>
          <TabsTrigger value="ledger">Estado de cuenta</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="audit">Auditoría</TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="space-y-6">
          {report ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard
                  label="Recibí (MIMOTECH)"
                  value={formatMoney(report.income.receivedByMe, 'PEN')}
                  icon={ArrowDownLeft}
                  color="text-info"
                  tooltip="Comisión que queda en MIMOTECH de lo que factura el cliente por este talento."
                />
                <KPICard
                  label="Se quedó (talento)"
                  value={formatMoney(report.income.keptByTalent, 'PEN')}
                  icon={ArrowUpRight}
                  color="text-teal"
                  tooltip="Lo que cobra el talento por su trabajo en el cliente."
                />
                <KPICard
                  label="Invertido en él"
                  value={formatMoney(report.expense.paid, 'PEN')}
                  icon={Wallet}
                  color="text-coral"
                  tooltip="Gasto de MIMOTECH en esta persona (formación, equipos, pruebas). No es lo que cobra por su trabajo."
                />
                <KPICard
                  label="Neto (MIMOTECH)"
                  value={formatMoney(report.net, 'PEN')}
                  icon={Landmark}
                  color={Number(report.net) < 0 ? 'text-destructive' : 'text-brand'}
                  tooltip="Comisión recibida menos lo invertido en el talento."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                <KPICard
                  label="Sueldo total"
                  value={formatMoney(report.income.salary, 'PEN')}
                  icon={Banknote}
                  color="text-muted-foreground"
                  tooltip="Suma de los sueldos que el cliente paga por este talento, antes de descuentos."
                />
                <KPICard
                  label="Le llega (con descuento)"
                  value={formatMoney(report.income.withDiscount, 'PEN')}
                  icon={Percent}
                  color="text-muted-foreground"
                  tooltip={`Del sueldo total se descuenta ${formatMoney(
                    String(Math.max(0, Number(report.income.salary) - Number(report.income.withDiscount))),
                    'PEN',
                  )}. Lo que queda es lo que se reparte entre MIMOTECH y el talento.`}
                />
                <KPICard
                  label="Deuda"
                  value={formatMoney(report.expense.debt, 'PEN')}
                  icon={ReceiptText}
                  color="text-warning"
                  tooltip="Lo que el talento debe devolver a MIMOTECH."
                />
                <KPICard
                  label="Falta pagar"
                  value={formatMoney(report.expense.pending, 'PEN')}
                  icon={AlertTriangle}
                  color="text-destructive"
                  tooltip="De esa deuda, cuánto sigue sin devolver a día de hoy."
                />
                <KPICard
                  label="Ya devuelto"
                  value={formatMoney(
                    String(Math.max(0, Number(report.expense.debt) - Number(report.expense.pending))),
                    'PEN',
                  )}
                  icon={PiggyBank}
                  color="text-success"
                  tooltip="Parte de la deuda que el talento ya te devolvió."
                />
                {Number(report.expense.fraudLoss) > 0 && (
                  <KPICard
                    label="Pérdida por fraude"
                    value={formatMoney(report.expense.fraudLoss, 'PEN')}
                    icon={AlertTriangle}
                    color="text-destructive"
                  />
                )}
              </div>

              <ActiveContractsSummary contracts={contracts} />

              {report.byCompany.length > 0 && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Por empresa</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead className="text-right">Recibí</TableHead>
                            <TableHead className="text-right">Se quedó</TableHead>
                            <TableHead className="text-right">Pagos</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.byCompany.map((c) => (
                            <TableRow key={c.name}>
                              <TableCell className="text-sm font-medium">{c.name}</TableCell>
                              <TableCell className="text-right tabular-nums text-info">
                                <Money value={formatMoney(c.received, 'PEN')} />
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                <Money value={formatMoney(c.kept, 'PEN')} />
                              </TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">{c.payments}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Por cliente final</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead className="text-right">Recibí</TableHead>
                            <TableHead className="text-right">Se quedó</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.byClient.map((c) => (
                            <TableRow key={c.name}>
                              <TableCell className="text-sm font-medium">{c.name}</TableCell>
                              <TableCell className="text-right tabular-nums text-info">
                                <Money value={formatMoney(c.received, 'PEN')} />
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                <Money value={formatMoney(c.kept, 'PEN')} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {report.byPaymentType.length > 0 && (
                <div className="grid gap-4">
                  {report.byPaymentType.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Por tipo de pago (Planilla vs RxH)</CardTitle>
                      </CardHeader>
                      <CardContent className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead className="text-right">Recibí</TableHead>
                              <TableHead className="text-right">Se quedó</TableHead>
                              <TableHead className="text-right">Cantidad</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {report.byPaymentType.map((p) => (
                              <TableRow key={p.name}>
                                <TableCell className="text-sm font-medium">{p.name}</TableCell>
                                <TableCell className="text-right tabular-nums text-info">
                                  <Money value={formatMoney(p.received, 'PEN')} />
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  <Money value={formatMoney(p.kept, 'PEN')} />
                                </TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">{p.count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detalle por mes</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.byMonth.length ? (
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mes</TableHead>
                            {hayIngresos && <TableHead className="text-right">Sueldo</TableHead>}
                            {hayIngresos && <TableHead className="text-right">Recibí (MIMOTECH)</TableHead>}
                            {hayIngresos && <TableHead className="text-right">Se quedó (talento)</TableHead>}
                            <TableHead className="text-right">Invertido</TableHead>
                            {hayDeuda && <TableHead className="text-right">Falta pagar</TableHead>}
                            <TableHead className="text-right">Neto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.byMonth.map((m) => (
                            <TableRow key={`${m.year}-${m.month}`}>
                              <TableCell className="whitespace-nowrap text-sm capitalize">{m.label}</TableCell>
                              {hayIngresos && (
                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                  <Money value={formatMoney(m.salary, 'PEN')} />
                                </TableCell>
                              )}
                              {hayIngresos && (
                                <TableCell className="text-right tabular-nums text-info">
                                  <Money value={formatMoney(m.income, 'PEN')} />
                                </TableCell>
                              )}
                              {hayIngresos && (
                                <TableCell className="text-right tabular-nums">
                                  <Money value={formatMoney(m.kept, 'PEN')} />
                                </TableCell>
                              )}
                              <TableCell className="text-right text-coral tabular-nums">
                                <Money value={formatMoney(m.expense, 'PEN')} />
                              </TableCell>
                              {hayDeuda && (
                                <TableCell className="text-right tabular-nums text-destructive">
                                  <Money value={formatMoney(m.pending, 'PEN')} />
                                </TableCell>
                              )}
                              <TableCell className="text-right font-semibold tabular-nums">
                                <Money value={formatMoney(m.net, 'PEN')} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">Sin datos para el reporte.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Deuda del talento</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.debtRows.length ? (
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-28">Fecha</TableHead>
                            <TableHead className="w-24">De quién</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="w-32 text-right">Deuda</TableHead>
                            <TableHead className="w-32 text-right">Falta pagar</TableHead>
                            <TableHead className="w-32">Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.debtRows.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="whitespace-nowrap text-sm">{formatDate(d.date)}</TableCell>
                              <TableCell>
                                <DebtOwnerBadge owner={d.debtOwner} talentName={talent.name} adminName={perfil?.name} />
                              </TableCell>
                              <TableCell className="text-sm" title={d.description}>
                                {d.description || '—'}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-warning">
                                <Money value={formatMoney(d.debt, 'PEN')} />
                              </TableCell>
                              <TableCell
                                className={cn(
                                  'text-right tabular-nums',
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
                                  onSelect={(next) => cambiarEstadoDeuda(d.id, next)}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="border-t-2 bg-muted/40">
                            <TableCell colSpan={3} className="text-sm font-semibold">
                              Total
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums text-warning">
                              <Money value={formatMoney(report.expense.debt, 'PEN')} />
                            </TableCell>
                            <TableCell className="text-right font-semibold tabular-nums text-destructive">
                              <Money value={formatMoney(report.expense.pending, 'PEN')} />
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">Sin deudas pendientes.</p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Skeleton className="h-40 rounded-xl" />
          )}
        </TabsContent>

        <TabsContent value="ledger">
          <LedgerSection
            entries={entries ?? []}
            summary={summary}
            talentName={talent.name}
            adminName={perfil?.name}
            onCreate={(v) => createMut.mutateAsync(v).then(() => undefined)}
            onUpdate={(entryId, v) => updateMut.mutateAsync({ entryId, values: v }).then(() => undefined)}
            onQuickStatus={(entry, status) =>
              updateMut.mutate({
                entryId: entry.id,
                values: {
                  date: entry.date.slice(0, 10),
                  type: entry.type as 'EGRESO' | 'DEUDA',
                  debtOwner: (entry.debtOwner as 'TALENT' | 'MINE') ?? 'TALENT',
                  paidAmount: entry.paidAmount,
                  debtAmount: entry.debtAmount,
                  pendingAmount: status === 'PAID' ? '0' : entry.pendingAmount,
                  status,
                  description: entry.description ?? '',
                },
              })
            }
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

        <TabsContent value="contracts" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                value={contractFilter}
                onValueChange={setContractFilter}
                options={[
                  { value: 'ACTIVE', label: 'Activos' },
                  { value: 'FINISHED', label: 'Finalizados' },
                ]}
                placeholder="Estado"
                allLabel="Todos"
              />
              <FilterSelect
                value={contractCompany}
                onValueChange={setContractCompany}
                options={empresasDeContratos.map((n) => ({ value: n, label: n }))}
                placeholder="Empresa"
                allLabel="Todas las empresas"
                className="w-[16rem] min-w-[16rem] max-w-[16rem]"
              />
              <FilterSelect
                value={contractPayment}
                onValueChange={setContractPayment}
                options={tiposDePago.map((n) => ({ value: n, label: n }))}
                placeholder="Tipo de pago"
                allLabel="Todos los tipos"
              />
              {(contractFilter !== 'ACTIVE' || contractCompany !== FILTER_ALL || contractPayment !== FILTER_ALL) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setContractFilter('ACTIVE');
                    setContractCompany(FILTER_ALL);
                    setContractPayment(FILTER_ALL);
                  }}
                >
                  <X className="mr-1 h-4 w-4" /> Limpiar
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ProjectedPaymentDialog contracts={contracts} />
              <TalentContractFormDialog
                onSubmit={(v) => createContractMut.mutateAsync(v).then(() => undefined)}
                isPending={createContractMut.isPending}
                trigger={
                  <Button size="sm">
                    <Plus className="mr-1 size-4" /> Nuevo contrato
                  </Button>
                }
              />
            </div>
          </div>

          {(talent.looseDistributions?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ingresos sueltos (CTS, Gratificación, Liquidación)</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Ingresos que no dependen de un contrato de mes específico.
                </p>
              </CardHeader>
              <CardContent>
                {(talent.looseDistributions ?? []).length ? (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead className="text-right">Con descuento</TableHead>
                          <TableHead className="text-right">Recibí</TableHead>
                          <TableHead className="text-right">Se quedó</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(talent.looseDistributions ?? []).map((dist) => (
                          <TableRow key={dist.id}>
                            <TableCell className="whitespace-nowrap text-sm">
                              {dist.date ? formatDate(dist.date) : '—'}
                            </TableCell>
                            <TableCell
                              className={cn('text-sm', esPagoExcepcional(dist.paymentType) && 'font-semibold')}
                            >
                              {dist.paymentType}
                            </TableCell>
                            <TableCell className="text-sm">
                              {[dist.companyName, dist.clientName].filter(Boolean).join(' / ') || '—'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              <Money value={formatMoney(dist.amountWithDiscount, 'PEN')} />
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-info">
                              <Money value={formatMoney(dist.amountReceived, 'PEN')} />
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              <Money value={formatMoney(dist.amountRetained, 'PEN')} />
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={dist.status} />
                            </TableCell>
                            <TableCell>
                              <IconActions>
                                <IconAction icon={Pencil} label="Editar" onClick={() => setEditingDist(dist)} />
                                <IconAction
                                  icon={Trash2}
                                  label="Eliminar"
                                  destructive
                                  onClick={async () => {
                                    const ok = await confirm({
                                      title: 'Eliminar ingreso',
                                      description: 'Esta acción no se puede deshacer.',
                                      confirmLabel: 'Eliminar',
                                      destructive: true,
                                    });
                                    if (ok) deleteDistMut.mutate(dist.id);
                                  }}
                                />
                              </IconActions>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">Sin ingresos sueltos registrados.</p>
                )}
              </CardContent>
            </Card>
          )}

          <TalentContractDetailDialog
            contract={detalleContrato}
            onOpenChange={(next) => !next && setDetalleContrato(null)}
          />

          {editingContract && (
            <TalentContractFormDialog
              contract={editingContract}
              open={!!editingContract}
              onOpenChange={(next) => !next && setEditingContract(null)}
              onSubmit={(v) =>
                updateContractMut.mutateAsync({ contractId: editingContract.id, values: v }).then(() => undefined)
              }
              isPending={updateContractMut.isPending}
            />
          )}
          {editingDist && (
            <DistributionFormDialog
              distribution={editingDist}
              loose={!editingDist.contractId}
              open={!!editingDist}
              onOpenChange={(next) => !next && setEditingDist(null)}
              onSubmit={(v) => updateDistMut.mutateAsync({ distId: editingDist.id, values: v }).then(() => undefined)}
              isPending={updateDistMut.isPending}
            />
          )}

          {(() => {
            const filtered = contracts.filter(
              (c) =>
                (contractFilter === FILTER_ALL || c.status === contractFilter) &&
                (contractCompany === FILTER_ALL || (c.companyName ?? '') === contractCompany) &&
                (contractPayment === FILTER_ALL ||
                  c.paymentType === contractPayment ||
                  (c.incomeDistributions ?? []).some((d) => d.paymentType === contractPayment)),
            );
            return filtered.length ? (
              <div className="space-y-4">
                {filtered.map((contract) => (
                  <Card key={contract.id}>
                    <CardHeader className="flex flex-row items-start justify-between gap-4">
                      <div className="min-w-0">
                        <CardTitle className="truncate">{contract.position ?? 'Contrato'}</CardTitle>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[
                            contract.companyName
                              ? `${contract.companyName}${contract.sequenceIndex ? ` (#${contract.sequenceIndex})` : ''}`
                              : null,
                            contract.clientName,
                          ]
                            .filter(Boolean)
                            .join(' / ') || 'Sin empresa'}
                          {contract.paymentType ? ` · ${contract.paymentType}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <StatusBadge status={contract.status} />
                        <IconAction icon={Eye} label="Ver detalle" onClick={() => setDetalleContrato(contract)} />
                        <IconAction icon={Pencil} label="Editar" onClick={() => setEditingContract(contract)} />
                        <IconAction
                          icon={Trash2}
                          label="Eliminar"
                          destructive
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'Eliminar contrato',
                              description: 'Se eliminará el contrato y sus distribuciones.',
                              confirmLabel: 'Eliminar',
                              destructive: true,
                            });
                            if (ok) deleteContractMut.mutate(contract.id);
                          }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <span>
                          {formatDate(contract.startDate)} – {formatDateOrActive(contract.endDate)}
                        </span>
                        <span className="italic">
                          {contract.status === 'ACTIVE' ? 'Lleva' : 'Duró'}:{' '}
                          {formatDurationExact(contract.startDate, contract.endDate)}
                        </span>
                        {(() => {
                          if (contract.status !== 'ACTIVE') return null;
                          const v = diasParaVencer(contract.endDate);
                          if (!v) return null;
                          if (v.vencido) {
                            return (
                              <span className="font-medium text-destructive">
                                Venció hace {formatDurationDaysCompact(Math.abs(v.dias))}
                              </span>
                            );
                          }
                          if (v.dias === 0) return <span className="font-medium text-destructive">Vence hoy</span>;
                          return (
                            <span className={cn('font-medium', v.porVencer ? 'text-warning' : 'text-foreground')}>
                              Vence en {formatDurationDaysCompact(v.dias)}
                            </span>
                          );
                        })()}
                        {contract.rate && (
                          <span className="font-medium tabular-nums text-foreground">
                            Sueldo: {formatMoney(contract.rate, contract.currency as 'PEN' | 'USD')}
                          </span>
                        )}
                      </div>
                      {contract.contractTerm && (
                        <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Plazo:</span> {contract.contractTerm}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Pagos por mes</p>
                        <DistributionFormDialog
                          defaultSalary={contract.rate}
                          onSubmit={(v) =>
                            createDistMut.mutateAsync({ contractId: contract.id, values: v }).then(() => undefined)
                          }
                          isPending={createDistMut.isPending}
                          trigger={
                            <Button size="sm" variant="outline">
                              <Plus className="mr-1 size-4" /> Nuevo pago
                            </Button>
                          }
                        />
                      </div>
                      {contract.incomeDistributions?.length ? (
                        <div className="overflow-x-auto rounded-lg border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Mes</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead className="text-right">Con descuento</TableHead>
                                <TableHead className="text-right">Recibí (MIMOTECH)</TableHead>
                                <TableHead className="text-right">Se quedó (talento)</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead />
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {[...contract.incomeDistributions].sort(ordenarPagosRecientePrimero).map((dist) => (
                                <TableRow key={dist.id}>
                                  <TableCell className="whitespace-nowrap text-sm capitalize">
                                    {dist.date ? formatMonthYear(dist.date) : '-'}
                                  </TableCell>
                                  <TableCell
                                    className={cn('text-sm', esPagoExcepcional(dist.paymentType) && 'font-semibold')}
                                  >
                                    {dist.paymentType}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    <Money
                                      value={formatMoney(dist.amountWithDiscount, contract.currency as 'PEN' | 'USD')}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    <Money
                                      value={formatMoney(dist.amountReceived, contract.currency as 'PEN' | 'USD')}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    <Money
                                      value={formatMoney(dist.amountRetained, contract.currency as 'PEN' | 'USD')}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <StatusBadge status={dist.status} />
                                  </TableCell>
                                  <TableCell>
                                    <IconActions>
                                      <IconAction
                                        icon={CopyPlus}
                                        label="Duplicar en este contrato"
                                        disabled={createDistMut.isPending}
                                        onClick={() => duplicarPago(contract.id, dist)}
                                      />
                                      <IconAction icon={Pencil} label="Editar" onClick={() => setEditingDist(dist)} />
                                      <IconAction
                                        icon={Trash2}
                                        label="Eliminar"
                                        destructive
                                        onClick={async () => {
                                          const ok = await confirm({
                                            title: 'Eliminar pago',
                                            description: 'Esta acción no se puede deshacer.',
                                            confirmLabel: 'Eliminar',
                                            destructive: true,
                                          });
                                          if (ok) deleteDistMut.mutate(dist.id);
                                        }}
                                      />
                                    </IconActions>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin contratos" description="No hay contratos para este filtro." />
            );
          })()}
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
    </PageShell>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
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
  if (snap.status) lines.push(`Estado: ${statusLabel(snap.status)}`);
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
