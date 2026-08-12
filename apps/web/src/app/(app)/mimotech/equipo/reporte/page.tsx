'use client';

import { formatMoney } from '@korapay/domain';
import { KPICard } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Percent, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { PersonBar, type PersonBarDatum } from '@/components/charts/person-bar';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/api';
import type { BusinessReports } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

function ReporteEquipoContent() {
  const { activeWorkspaceId } = useWorkspace();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.businessReports(activeWorkspaceId ?? '', {}),
    queryFn: () => apiFetch<BusinessReports>(`/reports/business?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const porPersona = data.teamByPerson ?? [];
  const totalEquipo = porPersona.reduce((s, p) => s + Number(p.total), 0);
  const totalIngresos = Number(data.income ?? 0);
  const pesoSobreIngresos = totalIngresos > 0 ? (totalEquipo / totalIngresos) * 100 : 0;

  const barras: PersonBarDatum[] = porPersona.map((p) => ({ name: p.name, value: Number(p.total) }));

  const anios = (data.yearlyTotals ?? []).filter((y) => Number(y.teamPayment) > 0);
  const meses = (data.monthlyFlow ?? []).filter((m) => Number(m.teamPayment) > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          label="Total pagado"
          value={formatMoney(String(totalEquipo), 'PEN')}
          icon={Wallet}
          color="text-destructive"
          tooltip="Suma de todos los pagos al equipo directo"
        />
        <KPICard
          label="Colaboradores"
          value={String(porPersona.length)}
          icon={Users}
          color="text-info"
          tooltip="Personas que recibieron al menos un pago"
        />
        <KPICard
          label="Sobre ingresos"
          value={`${pesoSobreIngresos.toFixed(1)}%`}
          icon={Percent}
          color="text-warning"
          tooltip="Qué parte de los ingresos de MIMOTECH se va en pagos al equipo"
        />
      </div>

      <Tabs defaultValue="persona">
        <TabsList>
          <TabsTrigger value="persona">Por colaborador</TabsTrigger>
          <TabsTrigger value="anio">Por año</TabsTrigger>
          <TabsTrigger value="mes">Por mes</TabsTrigger>
        </TabsList>

        <TabsContent value="persona" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagos por colaborador</CardTitle>
            </CardHeader>
            <CardContent>
              {barras.length ? (
                <PersonBar data={barras} />
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin pagos registrados.</p>
              )}
            </CardContent>
          </Card>

          {porPersona.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detalle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <th className="px-3 py-2.5 font-medium">Colaborador</th>
                        <th className="px-3 py-2.5 text-right font-medium">Total pagado</th>
                        <th className="px-3 py-2.5 text-right font-medium">% del equipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {porPersona.map((p) => (
                        <tr key={p.name} className="border-b last:border-0">
                          <td className="px-3 py-2.5 font-medium">{p.name}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(p.total, 'PEN')}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                            {totalEquipo > 0 ? ((Number(p.total) / totalEquipo) * 100).toFixed(1) : '0.0'}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 bg-muted/30 font-semibold">
                        <td className="px-3 py-2.5">Total</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {formatMoney(String(totalEquipo), 'PEN')}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">100.0%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="anio" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagos al equipo por año</CardTitle>
            </CardHeader>
            <CardContent>
              {anios.length ? (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <th className="px-3 py-2.5 font-medium">Año</th>
                        <th className="px-3 py-2.5 text-right font-medium">Pagos al equipo</th>
                        <th className="px-3 py-2.5 text-right font-medium">Ingresos</th>
                        <th className="px-3 py-2.5 text-right font-medium">% sobre ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anios.map((y) => {
                        const ing = Number(y.income);
                        const eq = Number(y.teamPayment);
                        return (
                          <tr key={y.year} className="border-b last:border-0">
                            <td className="px-3 py-2.5 font-semibold">{y.year}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(y.teamPayment, 'PEN')}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                              {formatMoney(y.income, 'PEN')}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">
                              {ing > 0 ? ((eq / ing) * 100).toFixed(1) : '0.0'}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin pagos registrados.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagos al equipo por mes</CardTitle>
            </CardHeader>
            <CardContent>
              {meses.length ? (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <th className="px-3 py-2.5 font-medium">Mes</th>
                        <th className="px-3 py-2.5 text-right font-medium">Pagos al equipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meses.map((m) => (
                        <tr key={m.label} className="border-b last:border-0">
                          <td className="px-3 py-2.5 capitalize">{m.label}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(m.teamPayment, 'PEN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">Sin pagos registrados.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ReporteEquipoPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <PageShell
        title="Reporte de colaboradores"
        description="Pagos al equipo directo de MIMOTECH"
        action={
          <Button asChild variant="outline">
            <Link href="/mimotech/equipo">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Link>
          </Button>
        }
      >
        <ReporteEquipoContent />
      </PageShell>
    </WorkspaceGate>
  );
}
