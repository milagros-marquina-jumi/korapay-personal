'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownCircle, TrendingUp, Users } from 'lucide-react';
import { CategoryDonut, MonthlyBar, type MonthlyPoint } from '@/components/charts';
import { TransactionFormDialog } from '@/components/forms/transaction-form-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import type { DashboardSummary, Paginated, Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const TYPE_LABELS: Record<string, string> = {
  BUSINESS_COST: 'Costo',
  TEAM_PAYMENT: 'Pago equipo',
};

export default function MimotechPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();

  const { data: summary, isLoading } = useQuery({
    queryKey: queryKeys.dashboard(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<DashboardSummary>(`/dashboard?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const { data: txPage } = useQuery({
    queryKey: queryKeys.transactions(activeWorkspaceId ?? '', { mimotech: true }),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/transactions?workspaceId=${activeWorkspaceId}&pageSize=200&sortBy=date&sortOrder=desc`,
      ),
    enabled: !!activeWorkspaceId,
  });

  const transactions = txPage?.data ?? [];
  const businessTx = transactions.filter((t) => t.type === 'BUSINESS_COST' || t.type === 'TEAM_PAYMENT');

  const byConcept = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'BUSINESS_COST') continue;
    const name = t.concept || 'Sin concepto';
    byConcept.set(name, (byConcept.get(name) ?? 0) + Number(t.amountBase));
  }
  const donutData = [...byConcept.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const monthly = new Map<string, MonthlyPoint>();
  for (const t of businessTx) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    const point = monthly.get(key) ?? { label, ingresos: 0, egresos: 0 };
    const amount = Number(t.amountBase);
    if (t.type === 'BUSINESS_COST') point.ingresos += amount;
    else if (t.type === 'TEAM_PAYMENT') point.egresos += amount;
    monthly.set(key, point);
  }
  const barData = [...monthly.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([, v]) => v);

  return (
    <div className="space-y-6">
      <PageHeader
        title="MIMOTECH"
        description={activeWorkspace ? `Costos y pagos de ${activeWorkspace.name}` : 'Costos y pagos del negocio'}
        action={
          activeWorkspaceId ? (
            <TransactionFormDialog
              workspaceId={activeWorkspaceId}
              defaultType="BUSINESS_COST"
              trigger={<Button>Nuevo costo</Button>}
            />
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading || !summary ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <KPICard
              label="Costos"
              value={formatMoney(summary.costosMimotech, 'PEN')}
              icon={ArrowDownCircle}
              color="text-destructive"
            />
            <KPICard
              label="Pagos equipo"
              value={formatMoney(summary.pagosEquipo, 'PEN')}
              icon={Users}
              color="text-warning"
            />
            <KPICard
              label="Utilidad"
              value={formatMoney(summary.utilidadMimotech, 'PEN')}
              icon={TrendingUp}
              color="text-success"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Costos por aplicacion</CardTitle>
          </CardHeader>
          <CardContent>
            {donutData.length ? (
              <CategoryDonut data={donutData} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Sin costos registrados</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Costos vs Pagos por mes</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length ? (
              <MonthlyBar data={barData} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Sin datos suficientes</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Costos y pagos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {businessTx.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessTx.slice(0, 12).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(t.date).toLocaleDateString('es-PE')}
                    </TableCell>
                    <TableCell className="font-medium">{t.concept}</TableCell>
                    <TableCell>
                      <Badge variant={t.type === 'TEAM_PAYMENT' ? 'warning' : 'destructive'}>
                        {TYPE_LABELS[t.type] ?? t.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-destructive">
                      -{formatMoney(t.amountOriginal, t.currency as 'PEN' | 'USD')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={<ArrowDownCircle className="h-10 w-10" />}
              title="Sin costos ni pagos"
              description="Registra el primer costo del negocio para verlo aqui."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
