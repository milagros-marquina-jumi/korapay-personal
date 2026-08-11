'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Ban, CheckCircle2, CopyCheck, Inbox, RefreshCw, Trash2, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { PageShell } from '@/components/layout/page-shell';
import { useConfirm } from '@/components/providers/confirm-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconAction } from '@/components/ui/icon-action';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { apiFetch, buildQuery } from '@/lib/api';
import type { DetectedSummary, DetectedTransaction, EmailSource, ExchangeRateInfo } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ConfirmDialog } from './confirm-dialog';
import { confirmBlockedReason, STATUS_LABELS, STATUS_VARIANTS, TRANSACTION_TYPE_LABELS } from './detected.constants';

export default function DetectadosPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);
  const [bankFilter, setBankFilter] = useState(FILTER_ALL);
  const [currencyFilter, setCurrencyFilter] = useState(FILTER_ALL);
  const [confidenceFilter, setConfidenceFilter] = useState(FILTER_ALL);
  const [confirming, setConfirming] = useState<DetectedTransaction | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);
  const [usdDetail, setUsdDetail] = useState<DetectedTransaction | null>(null);

  const filters = useMemo(
    () => ({
      status: statusFilter === FILTER_ALL ? undefined : statusFilter,
      bankCode: bankFilter === FILTER_ALL ? undefined : bankFilter,
      currency: currencyFilter === FILTER_ALL ? undefined : currencyFilter,
    }),
    [statusFilter, bankFilter, currencyFilter],
  );

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.detectedTransactions(filters),
    queryFn: () =>
      apiFetch<DetectedTransaction[]>(
        `/detected-transactions${buildQuery({
          status: filters.status,
          bankCode: filters.bankCode,
          currency: filters.currency,
        })}`,
      ),
  });

  const { data: summary } = useQuery({
    queryKey: queryKeys.detectedSummary(),
    queryFn: () => apiFetch<DetectedSummary>('/detected-transactions/summary'),
  });

  const { data: exchangeRateInfo } = useQuery({
    queryKey: queryKeys.exchangeRate(),
    queryFn: () => apiFetch<ExchangeRateInfo | null>('/exchange-rate'),
    staleTime: 1000 * 60 * 60,
  });

  const { data: emailSources } = useQuery({
    queryKey: ['email-sources'],
    queryFn: () => apiFetch<EmailSource[]>('/email-sources'),
  });

  const lastSync = emailSources?.[0]?.lastSuccessfulIngestionAt ?? null;

  const exchangeRate = exchangeRateInfo ? Number(exchangeRateInfo.rate) : 1;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['detected-transactions'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.detectedSummary() });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const ignoreMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/detected-transactions/${id}/ignore`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      toast.success('Movimiento ignorado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/detected-transactions/${id}/mark-duplicate`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      toast.success('Marcado como duplicado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unignoreMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/detected-transactions/${id}/unignore`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      toast.success('Movimiento restaurado a revisión');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/detected-transactions/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      toast.success('Movimiento eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bankOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of data ?? []) {
      if (t.bankCode) map.set(t.bankCode, t.bankName ?? t.bankCode);
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [data]);

  const rows = useMemo(() => {
    let filtered = data ?? [];
    const q = search.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((t) =>
        `${t.merchantOriginal ?? ''} ${t.description} ${t.bankName ?? ''}`.toLowerCase().includes(q),
      );
    }
    if (confidenceFilter === 'high') {
      filtered = filtered.filter((t) => t.confidence >= 0.8);
    } else if (confidenceFilter === 'medium') {
      filtered = filtered.filter((t) => t.confidence >= 0.55 && t.confidence < 0.8);
    } else if (confidenceFilter === 'low') {
      filtered = filtered.filter((t) => t.confidence < 0.55);
    }
    return filtered;
  }, [data, search, confidenceFilter]);

  const columns = useMemo<ColumnDef<DetectedTransaction, unknown>[]>(
    () => [
      {
        accessorKey: 'occurredAt',
        header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.occurredAt)}</span>,
      },
      {
        id: 'bank',
        header: 'Banco',
        cell: ({ row }) => <span className="text-sm">{row.original.bankName ?? '—'}</span>,
      },
      {
        id: 'card',
        header: 'Tarjeta',
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-muted-foreground">
            {row.original.cardLast4 ? `••••${row.original.cardLast4}` : '—'}
          </span>
        ),
      },
      {
        id: 'merchant',
        header: 'Comercio',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.merchantOriginal ?? row.original.description}</span>
        ),
      },
      {
        id: 'amount',
        accessorFn: (r) => Number(r.amount),
        sortingFn: 'basic',
        size: 180,
        header: ({ column }) => <SortableHeader column={column} label="Monto" className="ml-auto" />,
        cell: ({ row }) => {
          const tx = row.original;
          const isUsd = tx.currency === 'USD';
          const amountPEN = isUsd ? (Number(tx.amount) * exchangeRate).toFixed(2) : tx.amount;
          const amountEl = (
            <span className="font-semibold tabular-nums text-destructive">-{formatMoney(amountPEN, 'PEN')}</span>
          );
          if (isUsd) {
            return (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setUsdDetail(tx)}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted"
                  title="Ver conversion en dolares"
                >
                  {amountEl}
                  <span className="rounded bg-brand/10 px-1 text-[10px] font-medium text-brand">USD</span>
                </button>
              </div>
            );
          }
          return <div className="text-right">{amountEl}</div>;
        },
      },
      {
        id: 'type',
        header: 'Tipo',
        cell: ({ row }) => (
          <span className="text-sm">
            {TRANSACTION_TYPE_LABELS[row.original.transactionType] ?? row.original.transactionType}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        size: 120,
        header: 'Estado',
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'secondary'}>
            {STATUS_LABELS[row.original.status] ?? row.original.status}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const t = row.original;
          const isPending = t.status === 'PENDING_REVIEW';
          const isIgnored = t.status === 'IGNORED';
          const confirmDisabledLabel = confirmBlockedReason(t);
          return (
            <div className="flex justify-end gap-0.5">
              <IconAction
                icon={CheckCircle2}
                label={confirmDisabledLabel ?? 'Revisar y confirmar'}
                disabled={!!confirmDisabledLabel}
                onClick={() => setConfirming(t)}
              />
              {isIgnored ? (
                <IconAction icon={Ban} label="Des-ignorar" onClick={() => unignoreMutation.mutate(t.id)} />
              ) : (
                <IconAction
                  icon={Ban}
                  label="Ignorar"
                  disabled={!isPending}
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Ignorar movimiento',
                      description: 'El movimiento no se registrará en tus finanzas.',
                      confirmLabel: 'Ignorar',
                    });
                    if (ok) ignoreMutation.mutate(t.id);
                  }}
                />
              )}
              <IconAction
                icon={CopyCheck}
                label="Marcar como duplicado"
                disabled={!isPending}
                onClick={() => duplicateMutation.mutate(t.id)}
              />
              <IconAction
                icon={Trash2}
                label="Eliminar"
                destructive
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Eliminar movimiento detectado',
                    description: 'Se eliminará de la lista de detectados. Esta acción no se puede deshacer.',
                    confirmLabel: 'Eliminar',
                    destructive: true,
                  });
                  if (ok) deleteMutation.mutate(t.id);
                }}
              />
            </div>
          );
        },
      },
    ],
    [confirm, ignoreMutation, duplicateMutation, deleteMutation],
  );

  const hasFilters =
    search !== '' ||
    statusFilter !== FILTER_ALL ||
    bankFilter !== FILTER_ALL ||
    currencyFilter !== FILTER_ALL ||
    confidenceFilter !== FILTER_ALL;

  return (
    <PageShell
      title="Movimientos detectados"
      titleAside={
        <InfoTooltip
          className="ml-2"
          content={
            <span>
              Alta (&ge;80%): banco, monto, moneda, fecha, tarjeta y comercio detectados
              <br />
              Media (55-79%): datos basicos, falta tarjeta o comercio
              <br />
              Baja (&lt;55%): solo monto detectado
            </span>
          }
        />
      }
      description="Revisa y confirma los consumos importados desde tus correos"
      action={
        <div className="flex items-center gap-3">
          {lastSync && (
            <span className="text-xs text-muted-foreground">Ultima sincronizacion: {formatDateTime(lastSync)}</span>
          )}
          <Button variant="outline" onClick={() => setSyncOpen(true)}>
            <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard label="Por revisar" value={String(summary?.pendingReview ?? 0)} icon={Inbox} />
        <KPICard label="Alta confianza" value={String(summary?.highConfidence ?? 0)} icon={CheckCircle2} />
        <KPICard label="Sin cuenta" value={String(summary?.withoutAccount ?? 0)} icon={WalletCards} />
        <KPICard label="Duplicados" value={String(summary?.duplicates ?? 0)} icon={CopyCheck} />
        <KPICard label="Errores" value={String(summary?.failed ?? 0)} icon={AlertTriangle} />
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar por comercio o banco..."
        showClear={hasFilters}
        onClear={() => {
          setSearch('');
          setStatusFilter(FILTER_ALL);
          setBankFilter(FILTER_ALL);
          setCurrencyFilter(FILTER_ALL);
          setConfidenceFilter(FILTER_ALL);
        }}
        filters={
          <>
            <FilterSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: 'PENDING_REVIEW', label: 'Por revisar' },
                { value: 'CONFIRMED', label: 'Confirmado' },
                { value: 'IGNORED', label: 'Ignorado' },
                { value: 'DUPLICATE', label: 'Duplicado' },
              ]}
              placeholder="Estado"
              allLabel="Todo estado"
            />
            <FilterSelect
              value={bankFilter}
              onValueChange={setBankFilter}
              options={bankOptions}
              placeholder="Banco"
              allLabel="Todo banco"
            />
            <FilterSelect
              value={currencyFilter}
              onValueChange={setCurrencyFilter}
              options={[
                { value: 'PEN', label: 'Soles' },
                { value: 'USD', label: 'Dólares' },
              ]}
              placeholder="Moneda"
              allLabel="Toda moneda"
            />
            <FilterSelect
              value={confidenceFilter}
              onValueChange={setConfidenceFilter}
              options={[
                { value: 'high', label: 'Alta' },
                { value: 'medium', label: 'Media' },
                { value: 'low', label: 'Baja' },
              ]}
              placeholder="Confianza"
              allLabel="Toda confianza"
            />
          </>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        emptyState={
          <EmptyState
            title="Sin movimientos detectados"
            description="Cuando lleguen correos bancarios, los consumos aparecerán aquí para revisión."
          />
        }
      />

      <Dialog open={syncOpen} onOpenChange={setSyncOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sincronizar correos</DialogTitle>
            <DialogDescription>
              Los correos se sincronizan automaticamente cada 15 minutos desde Google Apps Script.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Para forzar una sincronizacion ahora, abre tu proyecto en Google Apps Script y ejecuta la funcion{' '}
              <code className="rounded bg-muted px-1 text-xs">syncKoraPayBankEmails</code>.
            </p>
            <p className="text-muted-foreground">Los nuevos movimientos apareceran aqui al refrescar la pagina.</p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                invalidate();
                setSyncOpen(false);
              }}
            >
              Refrescar lista
            </Button>
            <Button onClick={() => window.open('https://script.google.com', '_blank')}>Abrir Apps Script</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={usdDetail !== null} onOpenChange={(next) => !next && setUsdDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle en dolares</DialogTitle>
            <DialogDescription>
              {usdDetail?.merchantOriginal ?? usdDetail?.description ?? 'Movimiento detectado'}
            </DialogDescription>
          </DialogHeader>
          {usdDetail && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monto en dolares</span>
                <span className="font-semibold tabular-nums">{formatMoney(usdDetail.amount, 'USD')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Tipo de cambio{exchangeRateInfo ? ` del ${formatDate(exchangeRateInfo.date)}` : ''}
                </span>
                <span className="font-medium tabular-nums">S/ {exchangeRate.toFixed(3)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-medium">Total en soles</span>
                <span className="font-semibold tabular-nums text-brand">
                  {formatMoney((Number(usdDetail.amount) * exchangeRate).toFixed(2), 'PEN')}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {confirming && (
        <ConfirmDialog
          detected={confirming}
          open
          onOpenChange={(next) => {
            if (!next) setConfirming(null);
          }}
          onConfirmed={() => {
            invalidate();
            toast.success('Movimiento confirmado');
            setConfirming(null);
          }}
        />
      )}
    </PageShell>
  );
}
