'use client';
import { formatMoney } from '@korapay/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Filter, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Transaction {
  id: string;
  concept: string;
  type: string;
  amountOriginal: string;
  currency: string;
  date: string;
  status: string;
  account?: { name: string };
  category?: { name: string };
}
export default function MovimientosPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, search],
    queryFn: () =>
      apiFetch<{
        data: Transaction[];
        pagination: { total: number; totalPages: number; page: number };
      }>(
        `/transactions?workspaceId=personal&page=${page}&pageSize=20&sortBy=date&sortOrder=desc${search ? `&search=${search}` : ''}`,
      ),
  });
  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch('/transactions', {
        method: 'POST',
        body: JSON.stringify({ ...body, workspaceId: 'personal' }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });
  return (
    <div className="space-y-6">
      {' '}
      <div className="flex items-center justify-between">
        {' '}
        <div>
          {' '}
          <h1 className="font-display text-2xl font-bold">Movimientos</h1>{' '}
          <p className="text-sm text-muted-foreground">Todos tus ingresos y egresos</p>{' '}
        </div>{' '}
        <button
          type="button"
          onClick={() =>
            createMutation.mutate({
              type: 'INCOME',
              concept: 'Nuevo ingreso',
              date: new Date().toISOString().split('T')[0],
              amount: '100.00',
              currency: 'PEN',
              status: 'PAID',
            })
          }
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {' '}
          <Plus className="h-4 w-4" /> Nuevo Movimiento{' '}
        </button>{' '}
      </div>{' '}
      {}{' '}
      <div className="flex flex-wrap gap-3">
        {' '}
        <div className="relative flex-1 max-w-sm">
          {' '}
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />{' '}
          <input
            type="text"
            placeholder="Buscar movimientos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-4 text-sm"
          />{' '}
        </div>{' '}
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-accent"
        >
          {' '}
          <Filter className="h-4 w-4" /> Filtros{' '}
        </button>{' '}
      </div>{' '}
      {}{' '}
      <div className="overflow-hidden rounded-xl border bg-card">
        {' '}
        <div className="overflow-x-auto">
          {' '}
          <table className="w-full">
            {' '}
            <thead className="border-b bg-muted/50">
              {' '}
              <tr>
                {' '}
                {['Fecha', 'Concepto', 'Categoria', 'Cuenta', 'Tipo', 'Monto', 'Estado'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    {' '}
                    {h}{' '}
                  </th>
                ))}{' '}
              </tr>{' '}
            </thead>{' '}
            <tbody className="divide-y">
              {' '}
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {' '}
                    <td className="px-4 py-3" colSpan={7}>
                      {' '}
                      <div className="h-6 animate-pulse rounded bg-muted" />{' '}
                    </td>{' '}
                  </tr>
                ))
              ) : data?.data.length ? (
                data.data.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30">
                    {' '}
                    <td className="px-4 py-3 text-sm">{new Date(tx.date).toLocaleDateString('es-PE')}</td>{' '}
                    <td className="px-4 py-3 text-sm font-medium">{tx.concept}</td>{' '}
                    <td className="px-4 py-3 text-sm text-muted-foreground">{tx.category?.name ?? '-'}</td>{' '}
                    <td className="px-4 py-3 text-sm text-muted-foreground">{tx.account?.name ?? '-'}</td>{' '}
                    <td className="px-4 py-3 text-sm">
                      {' '}
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          tx.type === 'INCOME' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {' '}
                        {tx.type === 'INCOME' ? 'Ingreso' : 'Egreso'}{' '}
                      </span>{' '}
                    </td>{' '}
                    <td
                      className={`px-4 py-3 text-sm font-semibold ${tx.type === 'INCOME' ? 'text-success' : 'text-destructive'}`}
                    >
                      {' '}
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {formatMoney(tx.amountOriginal, tx.currency as 'PEN' | 'USD')}{' '}
                    </td>{' '}
                    <td className="px-4 py-3 text-sm">
                      {' '}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          tx.status === 'PAID' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {' '}
                        {tx.status === 'PAID' ? 'Pagado' : tx.status}{' '}
                      </span>{' '}
                    </td>{' '}
                  </tr>
                ))
              ) : (
                <tr>
                  {' '}
                  <td className="px-4 py-8 text-center text-sm text-muted-foreground" colSpan={7}>
                    {' '}
                    No se encontraron movimientos{' '}
                  </td>{' '}
                </tr>
              )}{' '}
            </tbody>{' '}
          </table>{' '}
        </div>{' '}
        {}{' '}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            {' '}
            <span className="text-sm text-muted-foreground"> {data.pagination.total} resultados </span>{' '}
            <div className="flex gap-2">
              {' '}
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
              >
                {' '}
                Anterior{' '}
              </button>{' '}
              <span className="flex items-center px-3 text-sm">
                {' '}
                {page} / {data.pagination.totalPages}{' '}
              </span>{' '}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
              >
                {' '}
                Siguiente{' '}
              </button>{' '}
            </div>{' '}
          </div>
        )}{' '}
      </div>{' '}
    </div>
  );
}
