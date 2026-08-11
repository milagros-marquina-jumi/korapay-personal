'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL } from '@/components/data-table/filter-select';
import { MonthYearFilter } from '@/components/data-table/month-year-filter';
import { PageShell } from '@/components/layout/page-shell';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import type { SavingBalancesMonthly } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

export default function AhorrosPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [year, setYear] = useState(FILTER_ALL);
  const [month, setMonth] = useState(FILTER_ALL);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.savingBalances(activeWorkspaceId ?? '', { year }),
    queryFn: () =>
      apiFetch<SavingBalancesMonthly>(
        `/reports/saving-balances?workspaceId=${activeWorkspaceId}${year !== FILTER_ALL ? `&year=${year}` : ''}`,
      ),
    enabled: !!activeWorkspaceId,
  });

  const periods = useMemo(() => {
    let rows = data?.data ?? [];
    if (month !== FILTER_ALL) rows = rows.filter((p) => p.month === Number(month));
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows
        .map((p) => ({ ...p, accounts: p.accounts.filter((a) => a.bucket.toLowerCase().includes(q)) }))
        .filter((p) => p.accounts.length > 0);
    }
    return rows;
  }, [data?.data, search, month]);

  return (
    <PageShell title="Ahorros" description="Saldo de tus cuentas de ahorro por mes">
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
    </PageShell>
  );
}
