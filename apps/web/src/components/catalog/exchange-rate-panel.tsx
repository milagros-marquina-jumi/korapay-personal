'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import type { ExchangeRateInfo } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, todayLocal } from '@/lib/utils';

export function ExchangeRatePanel() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayLocal);
  const [rate, setRate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: latest } = useQuery({
    queryKey: queryKeys.exchangeRate(),
    queryFn: () => apiFetch<ExchangeRateInfo | null>('/exchange-rate'),
  });
  const { data: historyPage } = useQuery({
    queryKey: queryKeys.exchangeRateHistory(page, limit),
    queryFn: () =>
      apiFetch<{ data: ExchangeRateInfo[]; total: number; page: number; totalPages: number }>(
        `/exchange-rate/history?page=${page}&limit=${limit}`,
      ),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.exchangeRate() });
    queryClient.invalidateQueries({ queryKey: ['exchange-rate', 'history'] });
  };

  const refresh = useMutation({
    mutationFn: () => apiFetch<ExchangeRateInfo>('/exchange-rate/refresh', { method: 'POST' }),
    onSuccess: (r) => {
      invalidate();
      toast.success(`SUNAT: 1 USD = ${r.rate} PEN`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveManual = useMutation({
    mutationFn: () => apiFetch('/exchange-rate', { method: 'PUT', body: JSON.stringify({ date, rate }) }),
    onSuccess: () => {
      invalidate();
      toast.success('Tipo de cambio guardado');
      setRate('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tipo de cambio</CardTitle>
        <Button size="sm" variant="outline" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
          <RefreshCw className={`mr-1 h-4 w-4 ${refresh.isPending ? 'animate-spin' : ''}`} /> Actualizar desde SUNAT
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-2xl font-bold tabular-nums">
          {latest ? `1 ${latest.from} = ${latest.rate} ${latest.to}` : 'Sin tipo de cambio'}
          {latest && <span className="ml-2 text-sm font-normal text-muted-foreground">{formatDate(latest.date)}</span>}
        </p>

        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            saveManual.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="er-date">Fecha</Label>
            <Input id="er-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="er-rate">Tipo (USD → PEN)</Label>
            <Input
              id="er-rate"
              inputMode="decimal"
              placeholder="3.408"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-32"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={saveManual.isPending || !rate}>
            Guardar manual
          </Button>
        </form>

        {historyPage && historyPage.data.length > 0 && (
          <>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>USD → PEN</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyPage.data.map((h) => (
                    <TableRow key={h.date}>
                      <TableCell>{formatDate(h.date)}</TableCell>
                      <TableCell className="tabular-nums">{h.rate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {historyPage.totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Página {historyPage.page} de {historyPage.totalPages} ({historyPage.total} registros)
                </span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= historyPage.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
