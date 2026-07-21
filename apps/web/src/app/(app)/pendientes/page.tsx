'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { PageHeader } from '@/components/layout/page-header';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { PendingItem } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
  kind: z.enum(['COBRAR', 'PAGAR']),
  concept: z.string().min(1, 'Requerido'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto invalido'),
  currency: z.enum(['PEN', 'USD']),
  dueDate: z.string().min(1, 'Requerido'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function PendingFormDialog({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      kind: 'COBRAR',
      concept: '',
      amount: '',
      currency: 'PEN',
      dueDate: new Date().toISOString().slice(0, 10),
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiFetch('/pending-items', { method: 'POST', body: JSON.stringify({ ...values, workspaceId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingItems(workspaceId) });
      toast.success('Pendiente creado');
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo pendiente</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo pendiente</DialogTitle>
          <DialogDescription>Registra un cobro o pago pendiente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select defaultValue="COBRAR" onValueChange={(v) => setValue('kind', v as FormValues['kind'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COBRAR">Por cobrar</SelectItem>
                  <SelectItem value="PAGAR">Por pagar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Vencimiento</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
              {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concept">Concepto</Label>
            <Input id="concept" {...register('concept')} />
            {errors.concept && <p className="text-xs text-destructive">{errors.concept.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input id="amount" inputMode="decimal" placeholder="0.00" {...register('amount')} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select defaultValue="PEN" onValueChange={(v) => setValue('currency', v as 'PEN' | 'USD')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEN">Soles (S/)</SelectItem>
                  <SelectItem value="USD">Dolares ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MarkPaidButton({ workspaceId, item }: { workspaceId: string; item: PendingItem }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`/pending-items/${item.id}/payments?workspaceId=${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify({ amount: item.amount, date: new Date().toISOString().slice(0, 10) }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingItems(workspaceId) });
      toast.success('Marcado como pagado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Button variant="outline" size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
      {mutation.isPending ? 'Guardando...' : 'Marcar pagado'}
    </Button>
  );
}

export default function PendientesPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.pendingItems(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<PendingItem[]>(`/pending-items?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const items = useMemo(() => {
    const all = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((i) => i.concept.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pendientes"
        description="Cobros y pagos pendientes"
        action={activeWorkspaceId ? <PendingFormDialog workspaceId={activeWorkspaceId} /> : null}
      />

      <DataTableToolbar search={search} onSearchChange={setSearch} placeholder="Buscar pendientes..." />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : items.length ? (
        <div className="space-y-3">
          {items.map((item) => {
            const currency = item.currency as 'PEN' | 'USD';
            return (
              <Card key={item.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.kind === 'COBRAR' ? 'success' : 'destructive'}>
                        {item.kind === 'COBRAR' ? 'Por cobrar' : 'Por pagar'}
                      </Badge>
                      <StatusBadge status={item.status} />
                    </div>
                    <CardTitle className="text-base">{item.concept}</CardTitle>
                  </div>
                  <p className="text-xl font-bold tabular-nums">{formatMoney(item.amount, currency)}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Vence: {new Date(item.dueDate).toLocaleDateString('es-PE')}
                  </p>
                </CardContent>
                {activeWorkspaceId && item.status !== 'PAID' && (
                  <CardFooter>
                    <MarkPaidButton workspaceId={activeWorkspaceId} item={item} />
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Sin pendientes"
          description="No tienes cobros ni pagos pendientes."
          action={activeWorkspaceId ? <PendingFormDialog workspaceId={activeWorkspaceId} /> : undefined}
        />
      )}
    </div>
  );
}
