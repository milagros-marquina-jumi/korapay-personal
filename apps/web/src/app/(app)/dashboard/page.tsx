'use client';

import { formatMoney, WorkspaceType } from '@korapay/domain';
import { KPICard } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, PiggyBank, Wallet } from 'lucide-react';
import { CategoryDonut } from '@/components/charts/category-donut';
import { IncomeExpenseArea, type IncomeExpensePoint } from '@/components/charts/income-expense-area';
import { PageShell } from '@/components/layout/page-shell';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { DashboardSummary, Paginated, Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const SIN_CATEGORIA = 'Sin categoría';

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
    const name = t.category?.name ?? SIN_CATEGORIA;
    byCategory.set(name, (byCategory.get(name) ?? 0) + Number(t.amountBase));
  }
  // Sin categorias reales el donut solo muestra "Sin categoria": no aporta nada.
  const categorized = [...byCategory.keys()].some((name) => name !== SIN_CATEGORIA);
  const donutData = categorized
    ? [...byCategory.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    : [];

  const isBusiness = activeWorkspace?.type === WorkspaceType.BUSINESS;
  const recent = transactions.slice(0, 6);

  return (
    <PageShell
      title="Dashboard"
      description={activeWorkspace ? `Resumen de ${activeWorkspace.name}` : 'Resumen financiero'}
    >
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
              tooltip="Suma de todos los movimientos de tipo Ingreso en el periodo"
            />
            {isBusiness ? (
              <>
                <KPICard
                  label="Costos"
                  value={formatMoney(summary.costosMimotech, 'PEN')}
                  icon={ArrowDownRight}
                  color="text-coral"
                  tooltip="Servicios e infraestructura (AWS, Render, Fly, Cloudflare)"
                />
                <KPICard
                  label="Pagos equipo"
                  value={formatMoney(summary.pagosEquipo, 'PEN')}
                  icon={Wallet}
                  color="text-info"
                  tooltip="Pagos realizados a los colaboradores de MIMOTECH"
                />
                <KPICard
                  label="Utilidad"
                  value={formatMoney(summary.utilidadMimotech, 'PEN')}
                  icon={PiggyBank}
                  color="text-brand"
                  tooltip="Ingresos menos costos y pagos al equipo"
                />
              </>
            ) : (
              <>
                <KPICard
                  label="Egresos"
                  value={formatMoney(summary.egresos, 'PEN')}
                  icon={ArrowDownRight}
                  color="text-destructive"
                  tooltip="Suma de todos los movimientos de tipo Egreso en el periodo"
                />
                <KPICard
                  label="Disponible"
                  value={formatMoney(summary.disponible, 'PEN')}
                  icon={Wallet}
                  color="text-info"
                  tooltip="Saldo actual de tus cuentas (balance inicial + ingresos pagados - egresos pagados)"
                />
                <KPICard
                  label="Ahorro"
                  value={formatMoney(summary.ahorro, 'PEN')}
                  icon={PiggyBank}
                  color="text-brand"
                  tooltip="Suma de todos los movimientos de tipo Ahorro en el periodo"
                />
              </>
            )}
          </>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className={donutData.length ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <CardHeader>
            <CardTitle>{donutData.length ? 'Ingresos vs Egresos' : 'Evolución de ingresos'}</CardTitle>
          </CardHeader>
          <CardContent>
            {areaData.length ? (
              <IncomeExpenseArea data={areaData} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Sin datos suficientes</p>
            )}
          </CardContent>
        </Card>
        {donutData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Gastos por categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryDonut data={donutData} />
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos recientes</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {recent.length ? (
            recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" title={t.concept}>
                    {t.concept}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDate(t.date)} · {t.category?.name ?? 'Sin categoría'}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    t.type === 'INCOME' ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {t.type === 'INCOME' ? '+' : '-'}
                  {formatMoney(t.amountBase, 'PEN')}
                </span>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin movimientos</p>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
