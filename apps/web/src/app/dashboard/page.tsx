'use client';
import { formatMoney } from '@korapay/domain';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Clock, PiggyBank, Wallet } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface KpiData {
  patrimonio: string;
  ingresos: string;
  egresos: string;
  disponible: string;
  ahorro: string;
  porCobrar: string;
  porPagar: string;
  vencido: string;
  costosMimotech: string;
  pagosEquipo: string;
  utilidadMimotech: string;
  saldoMimotalents: string;
}
const kpiCards = [
  {
    key: 'patrimonio' as const,
    label: 'Patrimonio',
    icon: Wallet,
    color: 'text-primary',
  },
  {
    key: 'ingresos' as const,
    label: 'Ingresos',
    icon: ArrowUpCircle,
    color: 'text-success',
  },
  {
    key: 'egresos' as const,
    label: 'Egresos',
    icon: ArrowDownCircle,
    color: 'text-destructive',
  },
  {
    key: 'disponible' as const,
    label: 'Disponible',
    icon: Wallet,
    color: 'text-info',
  },
  {
    key: 'ahorro' as const,
    label: 'Ahorro',
    icon: PiggyBank,
    color: 'text-teal',
  },
  {
    key: 'porCobrar' as const,
    label: 'Por Cobrar',
    icon: Clock,
    color: 'text-warning',
  },
  {
    key: 'vencido' as const,
    label: 'Vencido',
    icon: AlertTriangle,
    color: 'text-destructive',
  },
  {
    key: 'utilidadMimotech' as const,
    label: 'Utilidad MIMOTECH',
    icon: ArrowUpCircle,
    color: 'text-success',
  },
];
export default function DashboardPage() {
  const { data: kpi, isLoading } = useQuery({
    queryKey: ['dashboard', 'personal'],
    queryFn: () => apiFetch<KpiData>('/dashboard?workspaceId=personal'),
  });
  return (
    <div className="space-y-8">
      {' '}
      <div>
        {' '}
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>{' '}
        <p className="text-sm text-muted-foreground">Resumen de tus finanzas</p>{' '}
      </div>{' '}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {' '}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}{' '}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {' '}
          {kpiCards.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              {' '}
              <div className="flex items-center justify-between">
                {' '}
                <span className="text-xs font-medium text-muted-foreground">{label}</span>{' '}
                <Icon className={`h-5 w-5 ${color}`} />{' '}
              </div>{' '}
              <p className="mt-2 font-display text-2xl font-bold">
                {' '}
                {kpi ? formatMoney(kpi[key], 'PEN') : 'S/ 0.00'}{' '}
              </p>{' '}
            </div>
          ))}{' '}
        </div>
      )}{' '}
      {} <RecentTransactions />{' '}
    </div>
  );
}
function RecentTransactions() {
  const { data, isLoading } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () =>
      apiFetch<{
        data: Array<{
          id: string;
          concept: string;
          type: string;
          amountOriginal: string;
          date: string;
          status: string;
        }>;
      }>('/transactions?workspaceId=personal&pageSize=5&sortBy=date&sortOrder=desc'),
  });
  return (
    <div className="rounded-xl border bg-card">
      {' '}
      <div className="flex items-center justify-between border-b px-6 py-4">
        {' '}
        <h2 className="font-display text-lg font-semibold">Ultimos movimientos</h2>{' '}
        <a href="/movimientos" className="text-sm font-medium text-primary hover:underline">
          {' '}
          Ver todos{' '}
        </a>{' '}
      </div>{' '}
      {isLoading ? (
        <div className="space-y-3 p-6">
          {' '}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}{' '}
        </div>
      ) : (
        <div className="divide-y">
          {' '}
          {data?.data.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-6 py-3">
              {' '}
              <div>
                {' '}
                <p className="text-sm font-medium">{tx.concept}</p>{' '}
                <p className="text-xs text-muted-foreground"> {new Date(tx.date).toLocaleDateString('es-PE')} </p>{' '}
              </div>{' '}
              <div className="text-right">
                {' '}
                <p
                  className={`text-sm font-semibold ${tx.type === 'INCOME' ? 'text-success' : tx.type === 'EXPENSE' ? 'text-destructive' : 'text-muted-foreground'}`}
                >
                  {' '}
                  {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}{' '}
                  {formatMoney(tx.amountOriginal, 'PEN')}{' '}
                </p>{' '}
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                    tx.status === 'PAID' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}
                >
                  {' '}
                  {tx.status === 'PAID' ? 'Pagado' : tx.status}{' '}
                </span>{' '}
              </div>{' '}
            </div>
          )) ?? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground"> No hay movimientos recientes </div>
          )}{' '}
        </div>
      )}{' '}
    </div>
  );
}
