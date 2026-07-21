'use client';

import { formatMoney } from '@korapay/domain';
import { KPICard } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet } from 'lucide-react';
import { CategoryDonut, IncomeExpenseArea, type IncomeExpensePoint } from '@/components/charts';
import { PageHeader } from '@/components/layout/page-header';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { DashboardSummary, Paginated, Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function DashboardPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();

  const { data: summary, isLoading } = useQuery({
    queryKey: queryKeys.dashboard(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<DashboardSummary>(`/dashboard?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const { data: txPage } = useQuery({
    queryKey: queryKeys.transactions(activeWorkspaceId ?? '', { recent: true }),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/transactions?workspaceId=${activeWorkspaceId}&pageSize=200&sortBy=date&sortOrder=desc`,
      ),
    enabled: !!activeWorkspaceId,
  });

  const transactions = txPage?.data ?? [];

  const monthly = new Map<string, IncomeExpensePoint>();
  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    const point = monthly.get(key) ?? { label, ingresos: 0, egresos: 0 };
    const amount = Number(t.amountBase);
    if (t.type === 'INCOME') point.ingresos += amount;
    else if (t.type === 'EXPENSE' || t.type === 'BUSINESS_COST' || t.type === 'TEAM_PAYMENT') point.egresos += amount;
    monthly.set(key, point);
  }
  const areaData = [...monthly.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([, v]) => v);

  const byCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'EXPENSE' && t.type !== 'BUSINESS_COST' && t.type !== 'TEAM_PAYMENT') continue;
    const name = t.category?.name ?? 'Sin categoría';
    byCategory.set(name, (byCategory.get(name) ?? 0) + Number(t.amountBase));
  }
  const donutData = [...byCategory.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const recent = transactions.slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={activeWorkspace ? `Resumen de ${activeWorkspace.name}` : 'Resumen financiero'}
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !summary ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <KPICard
              label="Ingresos"
              value={formatMoney(summary.ingresos, 'PEN')}
              icon={ArrowUpRight}
              color="text-success"
            />
            <KPICard
              label="Egresos"
              value={formatMoney(summary.egresos, 'PEN')}
              icon={ArrowDownRight}
              color="text-destructive"
            />
            <KPICard
              label="Disponible"
              value={formatMoney(summary.disponible, 'PEN')}
              icon={Wallet}
              color="text-info"
            />
            <KPICard label="Ahorro" value={formatMoney(summary.ahorro, 'PEN')} icon={PiggyBank} color="text-brand" />
          </>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ingresos vs Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            {areaData.length ? (
              <IncomeExpenseArea data={areaData} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Sin datos suficientes</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gastos por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {donutData.length ? (
              <CategoryDonut data={donutData} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Sin gastos registrados</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos recientes</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {recent.length ? (
            recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{t.concept}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(t.date)} · {t.category?.name ?? 'Sin categoría'}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    t.type === 'INCOME' ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {t.type === 'INCOME' ? '+' : '-'}
                  {formatMoney(t.amountOriginal, t.currency as 'PEN' | 'USD')}
                </span>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin movimientos</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
