'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL } from '@/components/data-table/filter-select';
import { MonthYearFilter } from '@/components/data-table/month-year-filter';
import { PageShell } from '@/components/layout/page-shell';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { SavingAccountDialog } from '@/components/savings/saving-account-dialog';
import { SavingPeriodDialog } from '@/components/savings/saving-period-dialog';
import { SavingsChartDialog } from '@/components/savings/savings-chart-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconAction } from '@/components/ui/icon-action';
import { apiFetch } from '@/lib/api';
import type { SavingBalanceAccount, SavingBalancePeriod, SavingBalancesMonthly } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useDefaultYear } from '@/lib/use-default-year';
import { cn } from '@/lib/utils';

interface EditingAccount {
  period: SavingBalancePeriod;
  account?: SavingBalanceAccount;
}

export default function AhorrosPage() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [month, setMonth] = useState(FILTER_ALL);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [touched, setTouched] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [editing, setEditing] = useState<EditingAccount | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.savingBalances(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<SavingBalancesMonthly>(`/reports/saving-balances?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const [year, setYear] = useDefaultYear(data?.years);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['saving-balances', activeWorkspaceId] });
    queryClient.invalidateQueries({ queryKey: queryKeys.savingBuckets(activeWorkspaceId ?? '') });
    queryClient.invalidateQueries({ queryKey: queryKeys.savingLastPeriod(activeWorkspaceId ?? '') });
    queryClient.invalidateQueries({ queryKey: queryKeys.savingYearlyPivot(activeWorkspaceId ?? '') });
  };

  const removeAccountMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/saving-balances/${id}?workspaceId=${activeWorkspaceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      toast.success('Cuenta eliminada del periodo');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removePeriodMutation = useMutation({
    mutationFn: ({ year: y, month: m }: { year: number; month: number }) =>
      apiFetch(`/saving-balances/periods/${y}/${m}?workspaceId=${activeWorkspaceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      toast.success('Periodo eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const periods = useMemo(() => {
    let rows = data?.data ?? [];
    if (year !== FILTER_ALL) rows = rows.filter((p) => p.year === Number(year));
    if (month !== FILTER_ALL) rows = rows.filter((p) => p.month === Number(month));
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows
        .map((p) => ({ ...p, accounts: p.accounts.filter((a) => a.bucket.toLowerCase().includes(q)) }))
        .filter((p) => p.accounts.length > 0);
    }
    return rows;
  }, [data?.data, search, month, year]);

  const currentKey = useMemo(() => {
    const now = new Date();
    return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`;
  }, []);

  const defaultKey = useMemo(() => {
    if (!periods.length) return null;
    const current = periods.find((p) => `${p.year}-${p.month}` === currentKey);
    const target = current ?? periods[0];
    return target ? `${target.year}-${target.month}` : null;
  }, [periods, currentKey]);

  const filtering = search.trim() !== '' || month !== FILTER_ALL;

  const isOpen = (key: string) => {
    if (touched) return expanded.has(key);
    if (filtering) return true;
    return key === defaultKey;
  };

  const toggle = (key: string) => {
    const willClose = isOpen(key);
    setExpanded(willClose ? new Set() : new Set([key]));
    setTouched(true);
  };

  const confirmRemoveAccount = async (period: SavingBalancePeriod, account: SavingBalanceAccount) => {
    const ok = await confirm({
      title: 'Quitar cuenta del periodo',
      description: `Se quitará "${account.bucket}" de ${period.label}. El total del mes se recalculará sin ella.`,
      confirmLabel: 'Quitar',
      destructive: true,
    });
    if (ok) removeAccountMutation.mutate(account.id);
  };

  const confirmRemovePeriod = async (period: SavingBalancePeriod) => {
    const ok = await confirm({
      title: 'Eliminar periodo completo',
      description: `Se eliminarán las ${period.accounts.length} cuentas de ${period.label}. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) removePeriodMutation.mutate({ year: period.year, month: period.month });
  };

  return (
    <PageShell
      title="Ahorros"
      description="Saldo de tus cuentas de ahorro por mes"
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setChartOpen(true)}>
            <BarChart3 className="mr-2 h-4 w-4" /> Gráficos
          </Button>
          <Button onClick={() => setPeriodOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo periodo
          </Button>
        </div>
      }
    >
      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar cuenta..."
        showClear={search !== '' || year !== FILTER_ALL || month !== FILTER_ALL}
        onClear={() => {
          setSearch('');
          setYear(FILTER_ALL);
          setMonth(FILTER_ALL);
        }}
        filters={
          <MonthYearFilter
            year={year}
            month={month}
            onYearChange={setYear}
            onMonthChange={setMonth}
            years={data?.years ?? []}
          />
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : periods.length ? (
        <div className="space-y-3">
          {periods.map((period) => {
            const key = `${period.year}-${period.month}`;
            const open = isOpen(key);
            return (
              <Card key={key} className="overflow-hidden">
                <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-spring',
                        open && 'rotate-180',
                      )}
                    />
                    <span className="truncate text-sm font-semibold capitalize">{period.label}</span>
                    {key === currentKey && (
                      <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-strong dark:text-brand">
                        Mes actual
                      </span>
                    )}
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {period.accounts.length} {period.accounts.length === 1 ? 'cuenta' : 'cuentas'}
                    </span>
                  </button>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">Total ahorrado</p>
                    <p className="font-semibold tabular-nums text-brand">{formatMoney(period.total, 'PEN')}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 pl-1">
                    <IconAction icon={Plus} label="Agregar cuenta al periodo" onClick={() => setEditing({ period })} />
                    <IconAction
                      icon={Trash2}
                      label="Eliminar periodo"
                      destructive
                      onClick={() => confirmRemovePeriod(period)}
                    />
                  </div>
                </div>

                <div
                  className="overflow-hidden transition-[max-height] duration-300 ease-out-soft"
                  style={{ maxHeight: open ? `${period.accounts.length * 52 + 8}px` : '0px' }}
                >
                  <div className="divide-y">
                    {period.accounts.map((account) => (
                      <div
                        key={account.id}
                        className="group flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-medium">{account.bucket}</span>
                          {account.bank && (
                            <span className="shrink-0 text-xs text-muted-foreground">{account.bank}</span>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          {account.currency === 'USD' && (
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {formatMoney(account.amount, 'USD')}
                            </span>
                          )}
                          <span className="w-28 text-right text-sm font-semibold tabular-nums">
                            {formatMoney(account.amountBase, 'PEN')}
                          </span>
                          <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                            <IconAction
                              icon={Pencil}
                              label="Editar saldo"
                              onClick={() => setEditing({ period, account })}
                            />
                            <IconAction
                              icon={Trash2}
                              label="Quitar del periodo"
                              destructive
                              onClick={() => confirmRemoveAccount(period, account)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Sin ahorros" description="Crea tu primer periodo con el botón de arriba." />
      )}

      <SavingsChartDialog open={chartOpen} onOpenChange={setChartOpen} />
      <SavingPeriodDialog open={periodOpen} onOpenChange={setPeriodOpen} />
      {editing && (
        <SavingAccountDialog
          open
          onOpenChange={(next) => !next && setEditing(null)}
          year={editing.period.year}
          month={editing.period.month}
          periodLabel={editing.period.label}
          account={editing.account}
          existingBuckets={editing.period.accounts.map((a) => `${a.bucket}|${a.currency}`)}
        />
      )}
    </PageShell>
  );
}
