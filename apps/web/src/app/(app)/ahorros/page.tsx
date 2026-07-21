'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { PageHeader } from '@/components/layout/page-header';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import type { SavingBalancesMonthly } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

export default function AhorrosPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [year, setYear] = useState(FILTER_ALL);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.savingBalances(activeWorkspaceId ?? '', { year }),
    queryFn: () =>
      apiFetch<SavingBalancesMonthly>(
        `/reports/saving-balances?workspaceId=${activeWorkspaceId}${year !== FILTER_ALL ? `&year=${year}` : ''}`,
      ),
    enabled: !!activeWorkspaceId,
  });

  const yearOptions = useMemo(
    () => (data?.years ?? []).map((y) => ({ value: String(y), label: String(y) })),
    [data?.years],
  );

  const periods = useMemo(() => {
    const rows = data?.data ?? [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows
      .map((p) => ({ ...p, accounts: p.accounts.filter((a) => a.bucket.toLowerCase().includes(q)) }))
      .filter((p) => p.accounts.length > 0);
  }, [data?.data, search]);

  return (
    <div className="space-y-6">
      <PageHeader title="Ahorros" description="Saldo de tus cuentas de ahorro por mes" />

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar cuenta..."
        showClear={search !== '' || year !== FILTER_ALL}
        onClear={() => {
          setSearch('');
          setYear(FILTER_ALL);
        }}
        filters={
          <FilterSelect
            value={year}
            onValueChange={setYear}
            options={yearOptions}
            placeholder="Año"
            allLabel="Todos los años"
          />
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : periods.length ? (
        <div className="space-y-4">
          {periods.map((period) => (
            <Card key={`${period.year}-${period.month}`} className="overflow-hidden">
              <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
                <p className="text-sm font-semibold capitalize">{period.label}</p>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total ahorrado</p>
                  <p className="font-semibold tabular-nums text-brand">{formatMoney(period.total, 'PEN')}</p>
                </div>
              </div>
              <div className="divide-y">
                {period.accounts.map((account) => (
                  <div
                    key={`${account.bucket}-${account.currency}`}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium">{account.bucket}</span>
                      {account.bank && <span className="shrink-0 text-xs text-muted-foreground">{account.bank}</span>}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {account.currency === 'USD' && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatMoney(account.amount, 'USD')}
                        </span>
                      )}
                      <span className="w-28 text-right text-sm font-semibold tabular-nums">
                        {formatMoney(account.amountBase, 'PEN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin ahorros" description="No hay saldos de ahorro registrados para el periodo." />
      )}
    </div>
  );
}
