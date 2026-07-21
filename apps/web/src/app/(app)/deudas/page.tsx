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
import { apiFetch } from '@/lib/api';
import type { Debt } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const debtSchema = z.object({
  direction: z.enum(['DEBO', 'ME_DEBEN']),
  concept: z.string().min(1, 'Requerido'),
  originalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto invalido'),
  currency: z.enum(['PEN', 'USD']),
  dueDate: z.string().optional(),
  interestRate: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Valor invalido')
    .optional()
    .or(z.literal('')),
});

type DebtFormValues = z.infer<typeof debtSchema>;

const paymentSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto invalido'),
  date: z.string().min(1, 'Requerido'),
  method: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

function DebtFormDialog({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      direction: 'DEBO',
      concept: '',
      originalAmount: '',
      currency: 'PEN',
      dueDate: '',
      interestRate: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: DebtFormValues) => {
      const payload: Record<string, unknown> = {
        direction: values.direction,
        concept: values.concept,
        originalAmount: values.originalAmount,
        currency: values.currency,
        workspaceId,
      };
      if (values.dueDate) payload.dueDate = values.dueDate;
      if (values.interestRate) payload.interestRate = values.interestRate;
      return apiFetch('/debts', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts(workspaceId) });
      toast.success('Deuda creada');
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nueva deuda</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva deuda</DialogTitle>
          <DialogDescription>Registra lo que debes o lo que te deben.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label>Direccion</Label>
            <Select defaultValue="DEBO" onValueChange={(v) => setValue('direction', v as DebtFormValues['direction'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEBO">Debo</SelectItem>
                <SelectItem value="ME_DEBEN">Me deben</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concept">Concepto</Label>
            <Input id="concept" {...register('concept')} />
            {errors.concept && <p className="text-xs text-destructive">{errors.concept.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="originalAmount">Monto</Label>
              <Input id="originalAmount" inputMode="decimal" placeholder="0.00" {...register('originalAmount')} />
              {errors.originalAmount && <p className="text-xs text-destructive">{errors.originalAmount.message}</p>}
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha vencimiento</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interestRate">Tasa interes (%)</Label>
              <Input id="interestRate" inputMode="decimal" placeholder="0.00" {...register('interestRate')} />
              {errors.interestRate && <p className="text-xs text-destructive">{errors.interestRate.message}</p>}
            </div>
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

function PaymentFormDialog({ workspaceId, debtId }: { workspaceId: string; debtId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      method: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: PaymentFormValues) => {
      const payload: Record<string, unknown> = { amount: values.amount, date: values.date };
      if (values.method) payload.method = values.method;
      return apiFetch(`/debts/${debtId}/payments?workspaceId=${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts(workspaceId) });
      toast.success('Pago registrado');
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Registrar pago
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>Agrega un pago a esta deuda.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input id="amount" inputMode="decimal" placeholder="0.00" {...register('amount')} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Metodo</Label>
            <Input id="method" placeholder="Opcional" {...register('method')} />
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

export default function DeudasPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.debts(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Debt[]>(`/debts?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const debts = useMemo(() => {
    const all = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((d) => d.concept.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deudas"
        description="Gestiona lo que debes y lo que te deben"
        action={activeWorkspaceId ? <DebtFormDialog workspaceId={activeWorkspaceId} /> : null}
      />

      <DataTableToolbar search={search} onSearchChange={setSearch} placeholder="Buscar deudas..." />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : debts.length ? (
        <div className="space-y-3">
          {debts.map((debt) => {
            const currency = debt.currency as 'PEN' | 'USD';
            return (
              <Card key={debt.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={debt.direction === 'DEBO' ? 'destructive' : 'success'}>
                        {debt.direction === 'DEBO' ? 'Debo' : 'Me deben'}
                      </Badge>
                      <StatusBadge status={debt.status} />
                    </div>
                    <CardTitle className="text-base">{debt.concept}</CardTitle>
                  </div>
                  <p className="text-xl font-bold tabular-nums">{formatMoney(debt.originalAmount, currency)}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Saldo: {formatMoney(debt.balance ?? '0.00', currency)} · Pagado:{' '}
                    {formatMoney(debt.totalPaid ?? '0.00', currency)}
                    {debt.dueDate ? ` · Vence: ${new Date(debt.dueDate).toLocaleDateString('es-PE')}` : ''}
                  </p>
                </CardContent>
                {activeWorkspaceId && (
                  <CardFooter>
                    <PaymentFormDialog workspaceId={activeWorkspaceId} debtId={debt.id} />
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Sin deudas"
          description="No tienes deudas registradas."
          action={activeWorkspaceId ? <DebtFormDialog workspaceId={activeWorkspaceId} /> : undefined}
        />
      )}
    </div>
  );
}
