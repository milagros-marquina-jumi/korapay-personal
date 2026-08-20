'use client';

import { formatMoney } from '@korapay/domain';
import { KPICard, StatusBadge, statusLabel } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Copy, CopyPlus, Eye, Pencil, Plus, Server, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { MonthYearFilter } from '@/components/data-table/month-year-filter';
import { DuplicateMonthDialog } from '@/components/forms/duplicate-month-dialog';
import { DuplicateTransactionDialog } from '@/components/forms/duplicate-transaction-dialog';
import { TransactionFormDialog } from '@/components/forms/transaction-form-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IconAction } from '@/components/ui/icon-action';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Application, Paginated, Project, Transaction } from '@/lib/api.types';
import { MONTH_NAMES } from '@/lib/months';
import { queryKeys } from '@/lib/query-keys';
import { useDefaultYear } from '@/lib/use-default-year';
import { cn, formatDate, formatMonthYear } from '@/lib/utils';

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  PAID: 'success',
  PENDING: 'warning',
  OVERDUE: 'destructive',
  PARTIAL: 'warning',
  CANCELLED: 'secondary',
};

function CostosContent() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const ws = activeWorkspaceId ?? '';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(FILTER_ALL);
  const [applicationId, setApplicationId] = useState<string>(FILTER_ALL);
  const [projectId, setProjectId] = useState<string>(FILTER_ALL);
  const [bankFilter, setBankFilter] = useState<string>(FILTER_ALL);
  const [medioFilter, setMedioFilter] = useState<string>(FILTER_ALL);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [usdDetail, setUsdDetail] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState<Transaction | null>(null);
  const [duplicating, setDuplicating] = useState<Transaction | null>(null);
  const [duplicatingMonth, setDuplicatingMonth] = useState<{ year: number; month: number; count: number } | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [touched, setTouched] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.transactions(ws, { type: 'BUSINESS_COST', all: true }),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/transactions${buildQuery({
          workspaceId: ws,
          type: 'BUSINESS_COST',
          page: 1,
          pageSize: 500,
          sortBy: 'date',
          sortOrder: 'desc',
        })}`,
      ),
    enabled: !!ws,
  });

  const { data: applications } = useQuery({
    queryKey: queryKeys.applications(ws),
    queryFn: () => apiFetch<Application[]>(`/applications?workspaceId=${ws}`),
    enabled: !!ws,
  });

  const { data: projects } = useQuery({
    queryKey: queryKeys.projects(ws),
    queryFn: () => apiFetch<Project[]>(`/projects?workspaceId=${ws}`),
    enabled: !!ws,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/transactions/${id}?workspaceId=${ws}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', ws] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(ws) });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status: newStatus }: { id: string; status: string }) =>
      apiFetch(`/transactions/${id}?workspaceId=${ws}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', ws] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(ws) });
    },
  });

  const statusOptions = useMemo(() => {
    const distinct = [...new Set((data?.data ?? []).map((tx) => tx.status))];
    return distinct.map((value) => ({ value, label: statusLabel(value) }));
  }, [data?.data]);

  const applicationOptions = useMemo(
    () => (applications ?? []).map((a) => ({ value: a.id, label: a.name })),
    [applications],
  );
  const projectOptions = useMemo(() => (projects ?? []).map((p) => ({ value: p.id, label: p.name })), [projects]);
  const bankOptions = useMemo(() => {
    const banks = [...new Set((data?.data ?? []).map((tx) => tx.tags?.[0]).filter(Boolean))] as string[];
    return banks.map((b) => ({ value: b, label: b }));
  }, [data?.data]);
  const medioOptions = useMemo(() => {
    const medios = [...new Set((data?.data ?? []).map((tx) => tx.tags?.[1]).filter(Boolean))] as string[];
    return medios.map((m) => ({ value: m, label: m }));
  }, [data?.data]);
  const appName = (id?: string | null) => applications?.find((a) => a.id === id)?.name;

  const monthGroups = useMemo(() => {
    const all = data?.data ?? [];
    const groups = new Map<string, Transaction[]>();
    for (const tx of all) {
      const key = formatMonthYear(tx.date);
      const list = groups.get(key) ?? [];
      list.push(tx);
      groups.set(key, list);
    }
    return [...groups.entries()].map(([label, txs]) => ({
      label,
      year: new Date(txs[0]?.date ?? '').getUTCFullYear(),
      month: new Date(txs[0]?.date ?? '').getUTCMonth() + 1,
      txs,
      total: txs.reduce((s, tx) => s + Number(tx.amountBase), 0),
    }));
  }, [data?.data]);

  const years = useMemo(() => [...new Set(monthGroups.map((g) => g.year))].sort((a, b) => b - a), [monthGroups]);
  const [year, setYear] = useDefaultYear(years);
  const [month, setMonth] = useState(FILTER_ALL);

  const filteredGroups = useMemo(() => {
    return monthGroups.filter((g) => {
      if (year !== FILTER_ALL && g.year !== Number(year)) return false;
      if (month !== FILTER_ALL && g.month !== Number(month)) return false;
      return true;
    });
  }, [monthGroups, year, month]);

  const allRows = useMemo(() => {
    let filtered = filteredGroups.flatMap((g) => g.txs);
    if (status !== FILTER_ALL) filtered = filtered.filter((tx) => tx.status === status);
    if (applicationId !== FILTER_ALL) filtered = filtered.filter((tx) => tx.applicationId === applicationId);
    if (projectId !== FILTER_ALL)
      filtered = filtered.filter((tx) => (tx.projects ?? []).some((p) => p.id === projectId));
    if (bankFilter !== FILTER_ALL) filtered = filtered.filter((tx) => (tx.tags?.[0] ?? '') === bankFilter);
    if (medioFilter !== FILTER_ALL) filtered = filtered.filter((tx) => (tx.tags?.[1] ?? '') === medioFilter);
    const q = search.trim().toLowerCase();
    if (q) filtered = filtered.filter((tx) => (tx.concept ?? '').toLowerCase().includes(q));
    return filtered;
  }, [filteredGroups, status, applicationId, projectId, bankFilter, medioFilter, search]);

  const totalCostos = allRows.reduce((sum, tx) => sum + Number(tx.amountBase), 0);

  const currentKey = useMemo(
    () => `${(MONTH_NAMES[new Date().getUTCMonth()] ?? 'enero').toLowerCase()}/${new Date().getUTCFullYear()}`,
    [],
  );
  const defaultKey = useMemo(() => {
    if (!filteredGroups.length) return null;
    const current = filteredGroups.find((g) => g.label.toLowerCase() === currentKey);
    return (current ?? filteredGroups[0]!)?.label ?? null;
  }, [filteredGroups, currentKey]);

  const filtering =
    search.trim() !== '' ||
    status !== FILTER_ALL ||
    applicationId !== FILTER_ALL ||
    projectId !== FILTER_ALL ||
    month !== FILTER_ALL;

  const isOpen = (label: string) => {
    if (touched) return expandedMonths.has(label);
    if (filtering) return true;
    return label === defaultKey;
  };

  const toggle = (label: string) => {
    const willClose = isOpen(label);
    setExpandedMonths(willClose ? new Set() : new Set([label]));
    setTouched(true);
  };

  const hasFilters =
    search !== '' ||
    status !== FILTER_ALL ||
    applicationId !== FILTER_ALL ||
    projectId !== FILTER_ALL ||
    bankFilter !== FILTER_ALL ||
    year !== FILTER_ALL ||
    month !== FILTER_ALL;

  return (
    <PageShell
      title="Costos de infraestructura"
      description="Costos de aplicaciones y servicios de MIMOTECH"
      action={
        ws && (
          <TransactionFormDialog
            workspaceId={ws}
            defaultType="BUSINESS_COST"
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuevo costo
              </Button>
            }
          />
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          label="Total costos"
          value={formatMoney(String(totalCostos), 'PEN')}
          icon={Server}
          color="text-destructive"
        />
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar costos..."
        showClear={hasFilters}
        onClear={() => {
          setSearch('');
          setStatus(FILTER_ALL);
          setApplicationId(FILTER_ALL);
          setProjectId(FILTER_ALL);
          setBankFilter(FILTER_ALL);
          setMedioFilter(FILTER_ALL);
          setYear(FILTER_ALL);
          setMonth(FILTER_ALL);
        }}
        filters={
          <>
            <MonthYearFilter year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} years={years} />
            <FilterSelect
              value={status}
              onValueChange={setStatus}
              options={statusOptions}
              placeholder="Estado"
              allLabel="Todo estado"
            />
            <FilterSelect
              value={applicationId}
              onValueChange={setApplicationId}
              options={applicationOptions}
              placeholder="Aplicacion"
              allLabel="Toda app"
            />
            <FilterSelect
              value={projectId}
              onValueChange={setProjectId}
              options={projectOptions}
              placeholder="Proyecto"
              allLabel="Todo proyecto"
            />
            <FilterSelect
              value={bankFilter}
              onValueChange={setBankFilter}
              options={bankOptions}
              placeholder="Banco"
              allLabel="Todo banco"
            />
            <FilterSelect
              value={medioFilter}
              onValueChange={setMedioFilter}
              options={medioOptions}
              placeholder="Medio de pago"
              allLabel="Todo medio"
            />
          </>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : filteredGroups.length ? (
        <div className="space-y-3">
          {filteredGroups.map((group) => {
            const open = isOpen(group.label);
            return (
              <Card key={group.label} className="overflow-hidden">
                <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(group.label)}
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300',
                        open && 'rotate-180',
                      )}
                    />
                    <span className="truncate text-sm font-semibold capitalize">{group.label}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {group.txs.length} costo{group.txs.length !== 1 ? 's' : ''}
                    </span>
                  </button>
                  <span className="text-sm font-semibold tabular-nums text-destructive">
                    {formatMoney(String(group.total), 'PEN')}
                  </span>
                  <IconAction
                    icon={CopyPlus}
                    label="Copiar el mes completo"
                    onClick={() =>
                      setDuplicatingMonth({ year: group.year, month: group.month, count: group.txs.length })
                    }
                  />
                </div>
                {open && (
                  <div className="divide-y">
                    {group.txs.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                        <span className="w-20 shrink-0 text-muted-foreground">{formatDate(tx.date)}</span>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{appName(tx.applicationId) ?? tx.concept}</span>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1">
                            {(tx.projects ?? []).map((p) => (
                              <span
                                key={p.id}
                                className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                              >
                                {p.name}
                              </span>
                            ))}
                            {tx.tags?.[0] && (
                              <span className="text-[10px] text-muted-foreground/60">{tx.tags?.[0]}</span>
                            )}
                            {tx.tags?.[1] && (
                              <span className="text-[10px] text-muted-foreground/50">{tx.tags?.[1]}</span>
                            )}
                          </div>
                        </div>
                        <span className="w-28 shrink-0 text-right font-semibold tabular-nums text-destructive">
                          {formatMoney(tx.amountBase, 'PEN')}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (tx.status === 'PENDING' || tx.status === 'PAID') {
                              toggleStatusMutation.mutate({
                                id: tx.id,
                                status: tx.status === 'PENDING' ? 'PAID' : 'PENDING',
                              });
                            }
                          }}
                          className="shrink-0"
                          title={
                            tx.status === 'PENDING'
                              ? 'Marcar como pagado'
                              : tx.status === 'PAID'
                                ? 'Marcar como pendiente'
                                : undefined
                          }
                        >
                          <Badge
                            variant={STATUS_VARIANTS[tx.status] ?? 'secondary'}
                            className={
                              tx.status === 'PENDING' || tx.status === 'PAID' ? 'cursor-pointer hover:opacity-80' : ''
                            }
                          >
                            {statusLabel(tx.status)}
                          </Badge>
                        </button>
                        <div className="flex shrink-0 gap-1.5">
                          <IconAction icon={Eye} label="Ver detalle" onClick={() => setDetailOpen(tx)} />
                          <IconAction icon={Pencil} label="Editar" onClick={() => setEditing(tx)} />
                          <IconAction icon={Copy} label="Copiar a otro mes" onClick={() => setDuplicating(tx)} />
                          <IconAction
                            icon={Trash2}
                            label="Eliminar"
                            destructive
                            onClick={async () => {
                              const ok = await confirm({
                                title: 'Eliminar costo',
                                description: `Se eliminara "${appName(tx.applicationId) ?? tx.concept}".`,
                                confirmLabel: 'Eliminar',
                                destructive: true,
                              });
                              if (ok) removeMutation.mutate(tx.id);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sin costos que mostrar.</p>
      )}

      <Dialog open={usdDetail !== null} onOpenChange={(next) => !next && setUsdDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conversion a soles</DialogTitle>
            <DialogDescription>
              {usdDetail ? (appName(usdDetail.applicationId) ?? usdDetail.concept) : ''}
            </DialogDescription>
          </DialogHeader>
          {usdDetail && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monto en dolares</span>
                <span className="font-semibold tabular-nums">{formatMoney(usdDetail.amountOriginal, 'USD')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tipo de cambio del {formatDate(usdDetail.date)}</span>
                <span className="font-medium tabular-nums">S/ {Number(usdDetail.exchangeRate ?? 0).toFixed(3)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-medium">Total en soles</span>
                <span className="font-semibold tabular-nums text-brand">
                  {formatMoney(usdDetail.amountBase, 'PEN')}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen !== null} onOpenChange={(next) => !next && setDetailOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del costo</DialogTitle>
            <DialogDescription>
              {detailOpen ? (appName(detailOpen.applicationId) ?? detailOpen.concept) : ''}
            </DialogDescription>
          </DialogHeader>
          {detailOpen && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fecha</span>
                <span className="font-medium">{formatMonthYear(detailOpen.date)}</span>
              </div>
              {(detailOpen.projects ?? []).length > 0 && (
                <div className="flex items-start justify-between gap-4">
                  <span className="shrink-0 text-muted-foreground">
                    {(detailOpen.projects ?? []).length > 1 ? 'Proyectos' : 'Proyecto'}
                  </span>
                  <span className="text-right font-medium">
                    {(detailOpen.projects ?? []).map((p) => p.name).join(', ')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estado</span>
                <StatusBadge status={detailOpen.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Monto</span>
                <span className="font-semibold tabular-nums">
                  {detailOpen.currency === 'USD'
                    ? formatMoney(detailOpen.amountOriginal, 'USD')
                    : formatMoney(detailOpen.amountBase, 'PEN')}
                </span>
              </div>
              {detailOpen.currency === 'USD' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tipo de cambio</span>
                    <span className="font-medium tabular-nums">
                      S/ {Number(detailOpen.exchangeRate ?? 0).toFixed(3)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="font-medium">Total en soles</span>
                    <span className="font-semibold tabular-nums">{formatMoney(detailOpen.amountBase, 'PEN')}</span>
                  </div>
                </>
              )}
              {detailOpen.description && (
                <div className="border-t pt-2">
                  <span className="text-xs font-medium text-muted-foreground">Desglose</span>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{detailOpen.description}</p>
                </div>
              )}
              {detailOpen.notes && (
                <div className="border-t pt-2">
                  <span className="text-xs font-medium text-muted-foreground">Tarjeta / Cuenta</span>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{detailOpen.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {ws && (
        <DuplicateTransactionDialog
          workspaceId={ws}
          transaction={duplicating}
          onOpenChange={(next) => !next && setDuplicating(null)}
        />
      )}

      {ws && (
        <DuplicateMonthDialog
          workspaceId={ws}
          type="BUSINESS_COST"
          open={duplicatingMonth !== null}
          source={duplicatingMonth}
          onOpenChange={(next) => !next && setDuplicatingMonth(null)}
        />
      )}

      {ws && editing && (
        <TransactionFormDialog
          workspaceId={ws}
          defaultType="BUSINESS_COST"
          transaction={editing}
          open={!!editing}
          onOpenChange={(next) => !next && setEditing(null)}
        />
      )}
    </PageShell>
  );
}

export default function CostosPage() {
  return (
    <WorkspaceGate type={['BUSINESS']}>
      <CostosContent />
    </WorkspaceGate>
  );
}
