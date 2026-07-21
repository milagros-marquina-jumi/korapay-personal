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
import { PageHeader } from '@/components/layout/page-header';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconAction } from '@/components/ui/icon-action';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Account, Category, DetectedSummary, DetectedTransaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  CARD_PURCHASE: 'Compra',
  ONLINE_PURCHASE: 'Compra online',
  CASH_WITHDRAWAL: 'Retiro',
  TRANSFER_SENT: 'Transferencia enviada',
  TRANSFER_RECEIVED: 'Transferencia recibida',
  SERVICE_PAYMENT: 'Pago servicio',
  SUBSCRIPTION: 'Suscripción',
  REFUND: 'Devolución',
  REVERSAL: 'Reverso',
  DECLINED_TRANSACTION: 'Rechazada',
  INSTALLMENT_PURCHASE: 'Compra en cuotas',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'Por revisar',
  CONFIRMED: 'Confirmado',
  IGNORED: 'Ignorado',
  DUPLICATE: 'Duplicado',
  FAILED: 'Error',
};

const STATUS_VARIANTS: Record<string, 'warning' | 'success' | 'secondary' | 'info' | 'destructive'> = {
  PENDING_REVIEW: 'warning',
  CONFIRMED: 'success',
  IGNORED: 'secondary',
  DUPLICATE: 'info',
  FAILED: 'destructive',
};

const NON_CONFIRMABLE_TYPES = new Set(['DECLINED_TRANSACTION']);

function confirmBlockedReason(detected: DetectedTransaction): string | null {
  if (detected.status === 'CONFIRMED') return 'Ya confirmado';
  if (detected.status === 'DUPLICATE') return 'Duplicado';
  if (detected.status === 'IGNORED') return 'Ignorado';
  if (NON_CONFIRMABLE_TYPES.has(detected.transactionType)) return 'No se puede confirmar (rechazada)';
  return null;
}

function confidenceLabel(confidence: number): { label: string; className: string } {
  if (confidence >= 0.8) return { label: 'Alta', className: 'text-success' };
  if (confidence >= 0.55) return { label: 'Media', className: 'text-warning' };
  return { label: 'Baja', className: 'text-muted-foreground' };
}

function ConfirmDialog({
  detected,
  open,
  onOpenChange,
  onConfirmed,
}: {
  detected: DetectedTransaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: () => void;
}) {
  const { workspaces } = useWorkspace();
  const [workspaceId, setWorkspaceId] = useState(detected.workspaceId ?? workspaces[0]?.id ?? '');
  const [accountId, setAccountId] = useState(detected.accountId ?? '');
  const [categoryId, setCategoryId] = useState(detected.categoryId ?? '');
  const [createRule, setCreateRule] = useState(false);

  const { data: accounts } = useQuery({
    queryKey: queryKeys.accounts(workspaceId),
    queryFn: () => apiFetch<Account[]>(`/accounts?workspaceId=${workspaceId}`),
    enabled: open && !!workspaceId,
  });

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories(workspaceId),
    queryFn: () => apiFetch<Category[]>(`/categories?workspaceId=${workspaceId}`),
    enabled: open && !!workspaceId,
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`/detected-transactions/${detected.id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          workspaceId,
          accountId: accountId || undefined,
          categoryId: categoryId || undefined,
          createRule,
        }),
      }),
    onSuccess: () => {
      onConfirmed();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar movimiento</DialogTitle>
          <DialogDescription>
            {(detected.merchantOriginal ?? detected.description) || 'Movimiento detectado'} ·{' '}
            {formatMoney(detected.amount, detected.currency as 'PEN' | 'USD')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Workspace</Label>
            <Select
              value={workspaceId}
              onValueChange={(v) => {
                setWorkspaceId(v);
                setAccountId('');
                setCategoryId('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cuenta</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin cuenta" />
              </SelectTrigger>
              <SelectContent>
                {(accounts ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Checkbox id="createRule" checked={createRule} onCheckedChange={(v) => setCreateRule(v === true)} />
            <Label htmlFor="createRule" className="font-normal">
              Crear regla para futuros movimientos similares
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !workspaceId}>
            {mutation.isPending ? 'Confirmando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DetectadosPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);
  const [bankFilter, setBankFilter] = useState(FILTER_ALL);
  const [currencyFilter, setCurrencyFilter] = useState(FILTER_ALL);
  const [confirming, setConfirming] = useState<DetectedTransaction | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);

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
    const q = search.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter((t) =>
      `${t.merchantOriginal ?? ''} ${t.description} ${t.bankName ?? ''}`.toLowerCase().includes(q),
    );
  }, [data, search]);

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
        header: ({ column }) => <SortableHeader column={column} label="Monto" className="ml-auto" />,
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums text-destructive">
            {formatMoney(row.original.amount, row.original.currency as 'PEN' | 'USD')}
          </div>
        ),
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
        id: 'confidence',
        header: 'Confianza',
        cell: ({ row }) => {
          const c = confidenceLabel(row.original.confidence);
          return <span className={`text-sm font-medium ${c.className}`}>{c.label}</span>;
        },
      },
      {
        accessorKey: 'status',
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
          const confirmDisabledLabel = confirmBlockedReason(t);
          return (
            <div className="flex justify-end gap-0.5">
              <IconAction
                icon={CheckCircle2}
                label={confirmDisabledLabel ?? 'Revisar y confirmar'}
                disabled={!!confirmDisabledLabel}
                onClick={() => setConfirming(t)}
              />
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
    search !== '' || statusFilter !== FILTER_ALL || bankFilter !== FILTER_ALL || currencyFilter !== FILTER_ALL;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos detectados"
        description="Revisa y confirma los consumos importados desde tus correos"
        action={
          <Button variant="outline" onClick={() => setSyncOpen(true)}>
            <RefreshCw className="mr-2 h-4 w-4" /> Sincronizar
          </Button>
        }
      />

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
              La sincronización corre automáticamente cada 15 minutos desde Google Apps Script. Para forzarla ahora,
              abre tu proyecto en script.google.com y ejecuta la función syncKoraPayBankEmails.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => window.open('https://script.google.com', '_blank')}>Abrir Apps Script</Button>
          </DialogFooter>
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
    </div>
  );
}
