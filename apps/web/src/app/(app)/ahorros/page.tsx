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
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { SavingGoal } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const goalSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  targetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto invalido'),
  currency: z.enum(['PEN', 'USD']),
  targetDate: z.string().optional(),
  monthlyRecommend: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Monto invalido')
    .optional()
    .or(z.literal('')),
});

type GoalFormValues = z.infer<typeof goalSchema>;

const entrySchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto invalido'),
  type: z.enum(['CONTRIBUTION', 'WITHDRAWAL']),
  date: z.string().min(1, 'Requerido'),
});

type EntryFormValues = z.infer<typeof entrySchema>;

function GoalFormDialog({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      targetAmount: '',
      currency: 'PEN',
      targetDate: '',
      monthlyRecommend: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: GoalFormValues) => {
      const payload: Record<string, unknown> = {
        name: values.name,
        targetAmount: values.targetAmount,
        currency: values.currency,
        workspaceId,
      };
      if (values.targetDate) payload.targetDate = values.targetDate;
      if (values.monthlyRecommend) payload.monthlyRecommend = values.monthlyRecommend;
      return apiFetch('/saving-goals', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingGoals(workspaceId) });
      toast.success('Meta creada');
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nueva meta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva meta</DialogTitle>
          <DialogDescription>Define una meta de ahorro y su objetivo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Monto objetivo</Label>
              <Input id="targetAmount" inputMode="decimal" placeholder="0.00" {...register('targetAmount')} />
              {errors.targetAmount && <p className="text-xs text-destructive">{errors.targetAmount.message}</p>}
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
              <Label htmlFor="targetDate">Fecha objetivo</Label>
              <Input id="targetDate" type="date" {...register('targetDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyRecommend">Aporte mensual</Label>
              <Input id="monthlyRecommend" inputMode="decimal" placeholder="0.00" {...register('monthlyRecommend')} />
              {errors.monthlyRecommend && <p className="text-xs text-destructive">{errors.monthlyRecommend.message}</p>}
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

function EntryFormDialog({ workspaceId, goalId }: { workspaceId: string; goalId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      amount: '',
      type: 'CONTRIBUTION',
      date: new Date().toISOString().slice(0, 10),
    },
  });

  const mutation = useMutation({
    mutationFn: (values: EntryFormValues) =>
      apiFetch(`/saving-goals/${goalId}/entries?workspaceId=${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.savingGoals(workspaceId) });
      toast.success('Aporte registrado');
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Registrar aporte
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar aporte</DialogTitle>
          <DialogDescription>Agrega un aporte o retiro a esta meta.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input id="amount" inputMode="decimal" placeholder="0.00" {...register('amount')} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select defaultValue="CONTRIBUTION" onValueChange={(v) => setValue('type', v as EntryFormValues['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTRIBUTION">Aporte</SelectItem>
                  <SelectItem value="WITHDRAWAL">Retiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
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

export default function AhorrosPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.savingGoals(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<SavingGoal[]>(`/saving-goals?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const goals = useMemo(() => {
    const all = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((g) => g.name.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ahorros"
        description="Metas de ahorro y su progreso"
        action={activeWorkspaceId ? <GoalFormDialog workspaceId={activeWorkspaceId} /> : null}
      />

      <DataTableToolbar search={search} onSearchChange={setSearch} placeholder="Buscar metas..." />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : goals.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => {
            const currency = goal.currency as 'PEN' | 'USD';
            return (
              <Card key={goal.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <CardTitle className="text-base">{goal.name}</CardTitle>
                  <StatusBadge status={goal.status} />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold tabular-nums">
                      {formatMoney(goal.currentAmount ?? '0.00', currency)}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatMoney(goal.targetAmount, currency)}
                    </span>
                  </div>
                  <Progress value={goal.progress ?? 0} />
                  <p className="text-xs text-muted-foreground">{Math.round(goal.progress ?? 0)}% completado</p>
                  {goal.targetDate && (
                    <p className="text-xs text-muted-foreground">
                      Fecha objetivo: {new Date(goal.targetDate).toLocaleDateString('es-PE')}
                    </p>
                  )}
                </CardContent>
                {activeWorkspaceId && (
                  <CardFooter>
                    <EntryFormDialog workspaceId={activeWorkspaceId} goalId={goal.id} />
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Sin metas de ahorro"
          description="Crea tu primera meta para empezar a ahorrar."
          action={activeWorkspaceId ? <GoalFormDialog workspaceId={activeWorkspaceId} /> : undefined}
        />
      )}
    </div>
  );
}
