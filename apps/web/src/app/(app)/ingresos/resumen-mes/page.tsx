'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import type { MonthlySummary } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function ResumenMesContent() {
  const { activeWorkspaceId } = useWorkspace();
  const [year, setYear] = useState(FILTER_ALL);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.monthlySummary(activeWorkspaceId ?? '', { year }),
    queryFn: () =>
      apiFetch<MonthlySummary>(
        `/transactions/monthly-summary?workspaceId=${activeWorkspaceId}${year !== FILTER_ALL ? `&year=${year}` : ''}`,
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
      .map((p) => ({ ...p, companies: p.companies.filter((c) => c.name.toLowerCase().includes(q)) }))
      .filter((p) => p.companies.length > 0);
  }, [data?.data, search]);

  return (
    <PageShell title="Resumen por mes" description="Ingresos netos por empresa, agrupados por año y mes">
      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar empresa..."
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
                <div>
                  <p className="text-sm font-semibold">
                    {MONTH_NAMES[period.month - 1]} {period.year}
                  </p>
                  <p className="text-xs text-muted-foreground">{period.companies.length} empresa(s)</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Neto del mes</p>
                  <p className="font-semibold tabular-nums text-success">{formatMoney(period.totalNet, 'PEN')}</p>
                </div>
              </div>
              <div className="divide-y">
                {period.companies.map((company) => (
                  <div key={company.name} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{company.name}</span>
                      <span className="text-xs text-muted-foreground">{company.concept}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={company.status} />
                      <span className="w-28 text-right text-sm font-semibold tabular-nums">
                        {formatMoney(company.net, 'PEN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin ingresos" description="No hay ingresos registrados para el periodo seleccionado." />
      )}
    </PageShell>
  );
}

export default function ResumenMesPage() {
  return (
    <WorkspaceGate type="EMPLOYMENT">
      <ResumenMesContent />
    </WorkspaceGate>
  );
}
