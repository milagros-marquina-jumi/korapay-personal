'use client';

import { formatMoney } from '@korapay/domain';
import { KPICard } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Banknote, Landmark, ReceiptText, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PersonBar, type PersonBarDatum } from '@/components/charts/person-bar';
import { PivotTable } from '@/components/charts/pivot-table';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/api';
import type { TalentGlobalReport } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

function GlobalReportContent() {
  const { activeWorkspaceId } = useWorkspace();
  const ws = activeWorkspaceId ?? '';
  const [year, setYear] = useState(FILTER_ALL);

  const yearParam = year !== FILTER_ALL ? `&year=${year}` : '';
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.talentGlobalReport(ws, { year }),
    queryFn: () => apiFetch<TalentGlobalReport>(`/talents/report/global?workspaceId=${ws}${yearParam}`),
    enabled: !!ws,
  });

  const incomeColumns = useMemo(() => (data ? data.incomeByPerson.map((p) => p.name) : []), [data]);
  const expenseColumns = useMemo(() => (data ? data.expenseByPerson.map((p) => p.name) : []), [data]);

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const incomeBars: PersonBarDatum[] = data.incomeByPerson.map((p) => ({
    name: p.name,
    value: Number(p.received),
    secondary: Number(p.kept),
  }));
  const expenseBars: PersonBarDatum[] = data.expenseByPerson.map((p) => ({
    name: p.name,
    value: Number(p.paid),
    secondary: Number(p.pending),
  }));

  return (
    <PageShell
      beforeHeader={
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link href="/mimotech/talentos">
            <ArrowLeft className="mr-2 h-4 w-4" /> Talentos
          </Link>
        </Button>
      }
      title="Reporte general de Mimotalents"
      description="Ingresos y egresos por talento, calculados de sus pagos y estado de cuenta"
      action={
        <FilterSelect
          value={year}
          onValueChange={setYear}
          options={data.years.map((y) => ({ value: String(y), label: String(y) }))}
          placeholder="Año"
          allLabel="Todos los años"
        />
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Recibí (MIMOTECH)"
          value={formatMoney(data.totals.received, 'PEN')}
          icon={ArrowDownLeft}
          color="text-info"
        />
        <KPICard
          label="Se quedaron (talentos)"
          value={formatMoney(data.totals.kept, 'PEN')}
          icon={ArrowUpRight}
          color="text-teal"
        />
        <KPICard
          label="Pagado a talentos"
          value={formatMoney(data.totals.paid, 'PEN')}
          icon={Wallet}
          color="text-success"
        />
        <KPICard
          label="Neto (MIMOTECH)"
          value={formatMoney(data.totals.net, 'PEN')}
          icon={Landmark}
          color="text-brand"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard
          label="Sueldo total"
          value={formatMoney(data.totals.salary, 'PEN')}
          icon={Banknote}
          color="text-muted-foreground"
        />
        <KPICard
          label="Deuda total"
          value={formatMoney(data.totals.debt, 'PEN')}
          icon={ReceiptText}
          color="text-warning"
        />
        <KPICard
          label="Falta pagar total"
          value={formatMoney(data.totals.pending, 'PEN')}
          icon={ReceiptText}
          color="text-destructive"
        />
      </div>

      <Tabs defaultValue="ingresos">
        <TabsList>
          <TabsTrigger value="ingresos">Ingresos por persona</TabsTrigger>
          <TabsTrigger value="egresos">Egresos por persona</TabsTrigger>
          <TabsTrigger value="pivot-ingresos">Ingresos por mes</TabsTrigger>
          <TabsTrigger value="pivot-egresos">Egresos por mes</TabsTrigger>
        </TabsList>

        <TabsContent value="ingresos" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos por talento</CardTitle>
            </CardHeader>
            <CardContent>
              {incomeBars.length ? (
                <PersonBar data={incomeBars} color="bg-info" secondaryColor="bg-teal/70" secondaryLabel="Se quedó" />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin ingresos registrados</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Detalle por talento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-3">Talento</th>
                      <th className="p-3 text-right">Sueldo</th>
                      <th className="p-3 text-right">Con descuento</th>
                      <th className="p-3 text-right">Recibí (MIMOTECH)</th>
                      <th className="p-3 text-right">Se quedó (talento)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.incomeByPerson.map((p) => (
                      <tr key={p.talentId} className="border-b last:border-0">
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 text-right tabular-nums">{formatMoney(p.salary, 'PEN')}</td>
                        <td className="p-3 text-right tabular-nums">{formatMoney(p.withDiscount, 'PEN')}</td>
                        <td className="p-3 text-right font-medium tabular-nums text-info">
                          {formatMoney(p.received, 'PEN')}
                        </td>
                        <td className="p-3 text-right tabular-nums">{formatMoney(p.kept, 'PEN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="egresos" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Egresos por talento</CardTitle>
            </CardHeader>
            <CardContent>
              {expenseBars.length ? (
                <PersonBar
                  data={expenseBars}
                  color="bg-success"
                  secondaryColor="bg-destructive/60"
                  secondaryLabel="Falta pagar"
                />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin egresos registrados</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Detalle por talento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-3">Talento</th>
                      <th className="p-3 text-right">Pagado</th>
                      <th className="p-3 text-right">Deuda</th>
                      <th className="p-3 text-right">Falta pagar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenseByPerson.map((p) => (
                      <tr key={p.talentId} className="border-b last:border-0">
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 text-right font-medium tabular-nums text-success">
                          {formatMoney(p.paid, 'PEN')}
                        </td>
                        <td className="p-3 text-right tabular-nums text-warning">{formatMoney(p.debt, 'PEN')}</td>
                        <td className="p-3 text-right tabular-nums text-destructive">
                          {formatMoney(p.pending, 'PEN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pivot-ingresos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos (recibí) por mes y talento</CardTitle>
            </CardHeader>
            <CardContent>
              <PivotTable periods={data.incomePivot} columns={incomeColumns} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pivot-egresos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Egresos (pagado) por mes y talento</CardTitle>
            </CardHeader>
            <CardContent>
              <PivotTable periods={data.expensePivot} columns={expenseColumns} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

export default function GlobalReportPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <GlobalReportContent />
    </WorkspaceGate>
  );
}
