'use client';

import { formatMoney } from '@korapay/domain';
import { KPICard } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  PiggyBank,
  ReceiptText,
  Wallet,
  WalletCards,
} from 'lucide-react';
import { CategoryDonut, MonthlyBar, type MonthlyPoint } from '@/components/charts';
import { PageHeader } from '@/components/layout/page-header';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/api';
import type { DashboardSummary, Paginated, Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function ReportesPage() {
  const { activeWorkspaceId } = useWorkspace();

  const { data: summary, isLoading } = useQuery({
    queryKey: queryKeys.dashboard(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<DashboardSummary>(`/dashboard?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const { data: txPage } = useQuery({
    queryKey: queryKeys.transactions(activeWorkspaceId ?? '', { reports: true }),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/transactions?workspaceId=${activeWorkspaceId}&pageSize=500&sortBy=date&sortOrder=desc`,
      ),
    enabled: !!activeWorkspaceId,
  });

  const transactions = txPage?.data ?? [];

  const monthly = new Map<string, MonthlyPoint>();
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
  const barData = [...monthly.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([, v]) => v);

  const byCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'EXPENSE') continue;
    const name = t.category?.name ?? 'Sin categoría';
    byCategory.set(name, (byCategory.get(name) ?? 0) + Number(t.amountBase));
  }
  const donutData = [...byCategory.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" description="Resumen y análisis financiero" />

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="mes">Por mes</TabsTrigger>
          <TabsTrigger value="categoria">Por categoría</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading || !summary ? (
              Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
            ) : (
              <>
                <KPICard
                  label="Patrimonio"
                  value={formatMoney(summary.patrimonio, 'PEN')}
                  icon={Landmark}
                  color="text-brand"
                />
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
                <KPICard label="Ahorro" value={formatMoney(summary.ahorro, 'PEN')} icon={PiggyBank} color="text-teal" />
                <KPICard
                  label="Por cobrar"
                  value={formatMoney(summary.porCobrar, 'PEN')}
                  icon={WalletCards}
                  color="text-info"
                />
                <KPICard
                  label="Por pagar"
                  value={formatMoney(summary.porPagar, 'PEN')}
                  icon={ReceiptText}
                  color="text-warning"
                />
                <KPICard
                  label="Vencido"
                  value={formatMoney(summary.vencido, 'PEN')}
                  icon={AlertTriangle}
                  color="text-destructive"
                />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="mes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos vs Egresos por mes</CardTitle>
            </CardHeader>
            <CardContent>
              {barData.length ? (
                <MonthlyBar data={barData} />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin datos suficientes</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categoria" className="mt-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
