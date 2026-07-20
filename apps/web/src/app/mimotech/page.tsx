'use client';
import { formatMoney } from '@korapay/domain';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownCircle, ArrowUpCircle, Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Transaction {
  id: string;
  concept: string;
  type: string;
  amountOriginal: string;
  date: string;
  status: string;
  project?: { name: string };
  application?: { name: string };
}
export default function MimotechPage() {
  const { data: kpi } = useQuery({
    queryKey: ['dashboard', 'mimotech'],
    queryFn: () =>
      apiFetch<{
        ingresos: string;
        costosMimotech: string;
        pagosEquipo: string;
        utilidadMimotech: string;
      }>('/dashboard?workspaceId=mimotech'),
  });
  const { data: transactions } = useQuery({
    queryKey: ['transactions', 'mimotech'],
    queryFn: () =>
      apiFetch<{ data: Transaction[] }>('/transactions?workspaceId=mimotech&pageSize=20&sortBy=date&sortOrder=desc'),
  });
  return (
    <div className="space-y-6">
      {' '}
      <div className="flex items-center justify-between">
        {' '}
        <div>
          {' '}
          <h1 className="font-display text-2xl font-bold">MIMOTECH</h1>{' '}
          <p className="text-sm text-muted-foreground">Ingresos, costos y pagos del negocio</p>{' '}
        </div>{' '}
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {' '}
          <Plus className="h-4 w-4" /> Nuevo{' '}
        </button>{' '}
      </div>{' '}
      {}{' '}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {' '}
        {[
          {
            label: 'Ingresos',
            value: kpi?.ingresos,
            icon: ArrowUpCircle,
            color: 'text-success',
          },
          {
            label: 'Costos',
            value: kpi?.costosMimotech,
            icon: ArrowDownCircle,
            color: 'text-destructive',
          },
          {
            label: 'Pagos Equipo',
            value: kpi?.pagosEquipo,
            icon: ArrowDownCircle,
            color: 'text-warning',
          },
          {
            label: 'Utilidad',
            value: kpi?.utilidadMimotech,
            icon: ArrowUpCircle,
            color: 'text-teal',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-5 shadow-sm">
            {' '}
            <div className="flex items-center justify-between">
              {' '}
              <span className="text-xs font-medium text-muted-foreground">{label}</span>{' '}
              <Icon className={`h-5 w-5 ${color}`} />{' '}
            </div>{' '}
            <p className="mt-2 font-display text-2xl font-bold">
              {' '}
              {value ? formatMoney(value, 'PEN') : 'S/ 0.00'}{' '}
            </p>{' '}
          </div>
        ))}{' '}
      </div>{' '}
      {}{' '}
      <div className="rounded-xl border bg-card">
        {' '}
        <div className="border-b px-6 py-4">
          {' '}
          <h2 className="font-display text-lg font-semibold">Movimientos MIMOTECH</h2>{' '}
        </div>{' '}
        <div className="divide-y">
          {' '}
          {transactions?.data.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-6 py-3">
              {' '}
              <div className="flex items-center gap-3">
                {' '}
                {tx.type === 'INCOME' ? (
                  <ArrowUpCircle className="h-4 w-4 text-success" />
                ) : (
                  <ArrowDownCircle className="h-4 w-4 text-destructive" />
                )}{' '}
                <div>
                  {' '}
                  <p className="text-sm font-medium">{tx.concept}</p>{' '}
                  <p className="text-xs text-muted-foreground">
                    {' '}
                    {tx.project?.name ?? tx.application?.name ?? '-'} · {new Date(tx.date).toLocaleDateString(
                      'es-PE',
                    )}{' '}
                  </p>{' '}
                </div>{' '}
              </div>{' '}
              <p className={`text-sm font-semibold ${tx.type === 'INCOME' ? 'text-success' : 'text-destructive'}`}>
                {' '}
                {tx.type === 'INCOME' ? '+' : '-'}
                {formatMoney(tx.amountOriginal, 'PEN')}{' '}
              </p>{' '}
            </div>
          ))}{' '}
        </div>{' '}
      </div>{' '}
    </div>
  );
}
