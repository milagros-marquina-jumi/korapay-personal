'use client';

import { formatMoney } from '@korapay/domain';
import { useQuery } from '@tanstack/react-query';
import { HeatmapTable } from '@/components/charts/heatmap-table';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch } from '@/lib/api';
import type { SavingYearlyPivot } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function compact(amount: string | number) {
  return Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function SavingsChartDialog({ open, onOpenChange }: Readonly<Props>) {
  const { activeWorkspaceId } = useWorkspace();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.savingYearlyPivot(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<SavingYearlyPivot>(`/saving-balances/yearly-pivot?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(96rem,97vw)] max-w-none flex-col overflow-hidden sm:max-w-none">
        <DialogHeader className="shrink-0">
          <DialogTitle>Ahorros por año y mes</DialogTitle>
          <DialogDescription>Total ahorrado en cada periodo, expresado en soles</DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="tabla" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="shrink-0 self-start">
              <TabsTrigger value="tabla">Tabla</TabsTrigger>
              <TabsTrigger value="grafico">Gráfico</TabsTrigger>
            </TabsList>

            <TabsContent value="tabla" className="mt-4 min-h-0 flex-1 overflow-auto">
              <PivotGrid data={data} />
            </TabsContent>

            <TabsContent value="grafico" className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
              <YearBars data={data} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PivotGrid({ data }: Readonly<{ data: SavingYearlyPivot }>) {
  if (!data.rows.length) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Aún no hay ahorros registrados.</p>;
  }

  return (
    <HeatmapTable
      rowHeader="Año"
      columns={data.monthNames.map((m) => m.slice(0, 3))}
      rows={data.rows.map((row) => ({
        key: String(row.year),
        label: row.year,
        values: row.months,
        total: row.total,
      }))}
      columnTotals={data.monthTotals}
      grandTotal={data.grandTotal}
      format={compact}
    />
  );
}

function YearBars({ data }: Readonly<{ data: SavingYearlyPivot }>) {
  if (!data.rows.length) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Aún no hay ahorros registrados.</p>;
  }

  const max = Math.max(...data.rows.flatMap((r) => r.months.map(Number)), 1);

  return (
    <div className="space-y-5">
      {data.rows.map((row) => {
        const active = row.months
          .map((amount, i) => ({ amount, name: data.monthNames[i] ?? '' }))
          .filter((m) => Number(m.amount) > 0);
        return (
          <div key={row.year} className="space-y-2">
            <div className="flex items-baseline justify-between border-b pb-1.5">
              <span className="font-display text-sm font-semibold">{row.year}</span>
              <span className="text-sm font-semibold tabular-nums text-brand-strong dark:text-brand">
                {formatMoney(row.total, 'PEN')}
              </span>
            </div>
            {active.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">Sin movimientos registrados.</p>
            ) : (
              <div className="space-y-1">
                {active.map((m) => (
                  <div key={m.name} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs text-muted-foreground">{m.name}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-brand transition-all duration-500 ease-out-soft"
                        style={{ width: `${(Number(m.amount) / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-xs tabular-nums">{compact(m.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
