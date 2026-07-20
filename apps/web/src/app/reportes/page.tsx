'use client';
import { formatMoney } from '@korapay/domain';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
export default function ReportesPage() {
  const { data: kpi } = useQuery({
    queryKey: ['dashboard', 'personal'],
    queryFn: () => apiFetch<Record<string, string>>('/dashboard?workspaceId=personal'),
  });
  return (
    <div className="space-y-6">
      {' '}
      <div>
        {' '}
        <h1 className="font-display text-2xl font-bold">Reportes</h1>{' '}
        <p className="text-sm text-muted-foreground">Resumen y analisis financiero</p>{' '}
      </div>{' '}
      <div className="grid gap-6 lg:grid-cols-2">
        {' '}
        <div className="rounded-xl border bg-card p-6">
          {' '}
          <h2 className="font-display text-lg font-semibold mb-4">Resumen General</h2>{' '}
          <div className="space-y-3">
            {' '}
            {[
              {
                label: 'Patrimonio',
                value: kpi?.patrimonio,
                color: 'text-primary',
              },
              {
                label: 'Ingresos',
                value: kpi?.ingresos,
                color: 'text-success',
              },
              {
                label: 'Egresos',
                value: kpi?.egresos,
                color: 'text-destructive',
              },
              {
                label: 'Disponible',
                value: kpi?.disponible,
                color: 'text-info',
              },
              { label: 'Ahorro', value: kpi?.ahorro, color: 'text-teal' },
              {
                label: 'Por Cobrar',
                value: kpi?.porCobrar,
                color: 'text-warning',
              },
              {
                label: 'Vencido',
                value: kpi?.vencido,
                color: 'text-destructive',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                {' '}
                <span className="text-sm text-muted-foreground">{label}</span>{' '}
                <span className={`text-sm font-semibold ${color}`}>
                  {' '}
                  {value ? formatMoney(value, 'PEN') : 'S/ 0.00'}{' '}
                </span>{' '}
              </div>
            ))}{' '}
          </div>{' '}
        </div>{' '}
        <div className="rounded-xl border bg-card p-6">
          {' '}
          <h2 className="font-display text-lg font-semibold mb-4">MIMOTECH</h2>{' '}
          <div className="space-y-3">
            {' '}
            {[
              {
                label: 'Ingresos',
                value: kpi?.ingresos ?? '0',
                color: 'text-success',
              },
              {
                label: 'Costos',
                value: kpi?.costosMimotech ?? '0',
                color: 'text-destructive',
              },
              {
                label: 'Pagos al equipo',
                value: kpi?.pagosEquipo ?? '0',
                color: 'text-warning',
              },
              {
                label: 'Utilidad',
                value: kpi?.utilidadMimotech ?? '0',
                color: 'text-teal',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                {' '}
                <span className="text-sm text-muted-foreground">{label}</span>{' '}
                <span className={`text-sm font-semibold ${color}`}> {formatMoney(value, 'PEN')} </span>{' '}
              </div>
            ))}{' '}
          </div>{' '}
        </div>{' '}
      </div>{' '}
    </div>
  );
}
