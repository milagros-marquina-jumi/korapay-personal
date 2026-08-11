'use client';

import { formatMoney } from '@korapay/domain';
import { KPICard, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Lock,
  ReceiptText,
  TrendingUp,
  Users,
} from 'lucide-react';
import { CategoryDonut, MonthlyBar, type MonthlyPoint } from '@/components/charts';
import { PageShell } from '@/components/layout/page-shell';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/api';
import type { BusinessReports, MonthlySummary, PersonalReports, TaxObligation } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function PersonalReportsView({ workspaceId }: { workspaceId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.personalReports(workspaceId),
    queryFn: () => apiFetch<PersonalReports>(`/reports/personal?workspaceId=${workspaceId}`),
    enabled: !!workspaceId,
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    );
  }

  const donutData = data.expenseByCategory.slice(0, 8).map((c) => ({ name: c.name, value: Number(c.total) }));
  const barData: MonthlyPoint[] = data.incomeVsExpense.slice(-12).map((m) => ({
    label: `${MONTHS[m.month - 1]} ${String(m.year).slice(2)}`,
    ingresos: Number(m.income),
    egresos: Number(m.expense),
  }));

  const fixed = Number(data.fixedVsVariable.fixed);
  const variable = Number(data.fixedVsVariable.variable);
  const totalFixedVar = fixed + variable;
  const fixedPct = totalFixedVar > 0 ? (fixed / totalFixedVar) * 100 : 0;

  const maxSaving = Math.max(1, ...data.savingsEvolution.map((s) => Number(s.total)));

  return (
    <Tabs defaultValue="categoria">
      <TabsList>
        <TabsTrigger value="categoria">Gastos por categoría</TabsTrigger>
        <TabsTrigger value="mes">Ingresos vs egresos</TabsTrigger>
        <TabsTrigger value="ahorro">Evolución de ahorros</TabsTrigger>
        <TabsTrigger value="fijo">Fijo vs no fijo</TabsTrigger>
      </TabsList>

      <TabsContent value="categoria" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {donutData.length ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <CategoryDonut data={donutData} />
                <div className="divide-y">
                  {data.expenseByCategory.map((c) => (
                    <div key={c.name} className="flex items-center justify-between py-2 text-sm">
                      <span className="truncate">{c.name}</span>
                      <span className="tabular-nums font-medium">{formatMoney(c.total, 'PEN')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Sin gastos registrados</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="mes" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs egresos por mes</CardTitle>
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

      <TabsContent value="ahorro" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Evolución de ahorros por mes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.savingsEvolution.length ? (
              <div className="space-y-2">
                {data.savingsEvolution.map((s) => (
                  <div key={`${s.year}-${s.month}`} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs capitalize text-muted-foreground">{s.label}</span>
                    <div className="h-6 flex-1 overflow-hidden rounded bg-muted">
                      <div
                        className="h-full rounded bg-brand/70"
                        style={{ width: `${(Number(s.total) / maxSaving) * 100}%` }}
                      />
                    </div>
                    <span className="w-32 shrink-0 text-right text-sm font-medium tabular-nums">
                      {formatMoney(s.total, 'PEN')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Sin saldos de ahorro registrados</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="fijo" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Gasto fijo vs no fijo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <KPICard
                label="Gasto fijo"
                value={formatMoney(data.fixedVsVariable.fixed, 'PEN')}
                icon={Lock}
                color="text-warning"
              />
              <KPICard
                label="Gasto no fijo"
                value={formatMoney(data.fixedVsVariable.variable, 'PEN')}
                icon={TrendingUp}
                color="text-info"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Fijo {Math.round(fixedPct)}%</span>
                <span>No fijo {Math.round(100 - fixedPct)}%</span>
              </div>
              <Progress value={fixedPct} />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function BusinessReportsView({ workspaceId }: { workspaceId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.businessReports(workspaceId),
    queryFn: () => apiFetch<BusinessReports>(`/reports/business?workspaceId=${workspaceId}`),
    enabled: !!workspaceId,
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const costDonut = data.costByApp.slice(0, 8).map((c) => ({ name: c.name, value: Number(c.total) }));

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Ingresos" value={formatMoney(data.income, 'PEN')} icon={ArrowUpRight} color="text-success" />
        <KPICard label="Costos" value={formatMoney(data.cost, 'PEN')} icon={ArrowDownRight} color="text-coral" />
        <KPICard label="Pagos equipo" value={formatMoney(data.teamPayment, 'PEN')} icon={Users} color="text-info" />
        <KPICard label="Utilidad" value={formatMoney(data.utility, 'PEN')} icon={Landmark} color="text-brand" />
      </div>

      <Tabs defaultValue="costos">
        <TabsList>
          <TabsTrigger value="costos">Costos por aplicación</TabsTrigger>
          <TabsTrigger value="equipo">Pagos por persona</TabsTrigger>
          <TabsTrigger value="talentos">Talentos</TabsTrigger>
        </TabsList>

        <TabsContent value="costos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Costos por aplicación</CardTitle>
            </CardHeader>
            <CardContent>
              {costDonut.length ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <CategoryDonut data={costDonut} />
                  <div className="divide-y">
                    {data.costByApp.map((c) => (
                      <div key={c.name} className="flex items-center justify-between py-2 text-sm">
                        <span className="truncate">{c.name}</span>
                        <span className="font-medium tabular-nums">{formatMoney(c.total, 'PEN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin costos registrados</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagos de equipo por persona</CardTitle>
            </CardHeader>
            <CardContent>
              {data.teamByPerson.length ? (
                <div className="divide-y">
                  {data.teamByPerson.map((p) => (
                    <div key={p.name} className="flex items-center justify-between py-2 text-sm">
                      <span className="truncate">{p.name}</span>
                      <span className="font-medium tabular-nums">{formatMoney(p.total, 'PEN')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin pagos de equipo</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="talentos" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              label="Pagado a talentos"
              value={formatMoney(data.talent.paid, 'PEN')}
              icon={ArrowDownRight}
              color="text-coral"
            />
            <KPICard
              label="Deuda"
              value={formatMoney(data.talent.debt, 'PEN')}
              icon={ReceiptText}
              color="text-warning"
            />
            <KPICard
              label="Falta pagar"
              value={formatMoney(data.talent.pending, 'PEN')}
              icon={AlertTriangle}
              color="text-destructive"
            />
            <KPICard
              label="Saldo talentos"
              value={formatMoney(data.talent.balance, 'PEN')}
              icon={Landmark}
              color="text-brand"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmploymentReportsView({ workspaceId }: { workspaceId: string }) {
  const { data: summary, isLoading } = useQuery({
    queryKey: queryKeys.monthlySummary(workspaceId, { type: 'INCOME' }),
    queryFn: () => apiFetch<MonthlySummary>(`/transactions/monthly-summary?workspaceId=${workspaceId}`),
    enabled: !!workspaceId,
  });
  const { data: renta } = useQuery({
    queryKey: queryKeys.taxObligations(workspaceId),
    queryFn: () => apiFetch<TaxObligation[]>(`/tax-obligations?workspaceId=${workspaceId}`),
    enabled: !!workspaceId,
  });

  if (isLoading || !summary) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const byCompany = new Map<string, number>();
  let totalIncome = 0;
  const barData: MonthlyPoint[] = [];
  for (const period of summary.data) {
    barData.push({
      label: `${MONTHS[period.month - 1]} ${String(period.year).slice(2)}`,
      ingresos: Number(period.totalNet),
      egresos: 0,
    });
    for (const c of period.companies) {
      byCompany.set(c.name, (byCompany.get(c.name) ?? 0) + Number(c.net));
      totalIncome += Number(c.net);
    }
  }
  const companyDonut = [...byCompany.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const bars = barData.slice(0, 12).reverse();

  const rentaRows = renta ?? [];
  const rentaPaid = rentaRows.filter((r) => r.status === 'PAID').reduce((s, r) => s + Number(r.amount), 0);
  const rentaPending = rentaRows.filter((r) => r.status !== 'PAID').reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Ingresos totales"
          value={formatMoney(String(totalIncome), 'PEN')}
          icon={ArrowUpRight}
          color="text-success"
        />
        <KPICard label="Empresas" value={String(byCompany.size)} icon={Landmark} color="text-brand" />
        <KPICard
          label="Renta pagada"
          value={formatMoney(String(rentaPaid), 'PEN')}
          icon={ArrowDownRight}
          color="text-info"
        />
        <KPICard
          label="Renta pendiente"
          value={formatMoney(String(rentaPending), 'PEN')}
          icon={AlertTriangle}
          color="text-warning"
        />
      </div>

      <Tabs defaultValue="empresa">
        <TabsList>
          <TabsTrigger value="empresa">Ingresos por empresa</TabsTrigger>
          <TabsTrigger value="mes">Ingresos por mes</TabsTrigger>
          <TabsTrigger value="renta">Renta</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos por empresa</CardTitle>
            </CardHeader>
            <CardContent>
              {companyDonut.length ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <CategoryDonut data={companyDonut} />
                  <div className="divide-y">
                    {companyDonut.map((c) => (
                      <div key={c.name} className="flex items-center justify-between py-2 text-sm">
                        <span className="truncate">{c.name}</span>
                        <span className="font-medium tabular-nums">{formatMoney(String(c.value), 'PEN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin ingresos registrados</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos por mes</CardTitle>
            </CardHeader>
            <CardContent>
              {bars.length ? (
                <MonthlyBar data={bars} />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin datos suficientes</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renta" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Obligaciones de renta</CardTitle>
            </CardHeader>
            <CardContent>
              {rentaRows.length ? (
                <div className="divide-y">
                  {rentaRows.map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="truncate">{r.name}</span>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={r.status} />
                        <span className="w-28 text-right font-medium tabular-nums">{formatMoney(r.amount, 'PEN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin obligaciones de renta</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ReportesPage() {
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  const isBusiness = activeWorkspace?.type === 'BUSINESS';
  const isEmployment = activeWorkspace?.type === 'EMPLOYMENT';
  const isPersonal = activeWorkspace?.type === 'PERSONAL' || activeWorkspace?.type === 'SHARED';

  return (
    <PageShell title="Reportes" description="Resumen y análisis financiero">
      {activeWorkspaceId && isBusiness ? (
        <BusinessReportsView workspaceId={activeWorkspaceId} />
      ) : activeWorkspaceId && isEmployment ? (
        <EmploymentReportsView workspaceId={activeWorkspaceId} />
      ) : activeWorkspaceId && isPersonal ? (
        <PersonalReportsView workspaceId={activeWorkspaceId} />
      ) : (
        <p className="text-sm text-muted-foreground">Selecciona un workspace para ver sus reportes.</p>
      )}
    </PageShell>
  );
}
