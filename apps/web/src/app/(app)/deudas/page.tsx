'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge, statusLabel } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { PageShell } from '@/components/layout/page-shell';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyToggle } from '@/components/ui/currency-toggle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconAction } from '@/components/ui/icon-action';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { Debt } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { cn, formatDate, todayLocal } from '@/lib/utils';

const debtSchema = z.object({
  direction: z.enum(['DEBO', 'ME_DEBEN']),
  concept: z.string().min(1, 'Requerido'),
  originalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido'),
  currency: z.enum(['PEN', 'USD']),
  dueDate: z.string().optional(),
  interestRate: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Valor inválido')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
});

type DebtFormValues = z.infer<typeof debtSchema>;

const paymentSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido'),
  date: z.string().min(1, 'Requerido'),
  method: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface DebtDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt?: Debt | null;
  onCreated?: (id: string) => void;
}

function DebtFormDialog({ workspaceId, open, onOpenChange, debt, onCreated }: Readonly<DebtDialogProps>) {
  const queryClient = useQueryClient();
  const editing = !!debt;

  const {
    register,
    handleSubmit,
    reset,
    control,
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
      notes: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      direction: (debt?.direction as DebtFormValues['direction']) ?? 'DEBO',
      concept: debt?.concept ?? '',
      originalAmount: debt?.originalAmount ?? '',
      currency: (debt?.currency as 'PEN' | 'USD') ?? 'PEN',
      dueDate: debt?.dueDate ? debt.dueDate.slice(0, 10) : '',
      interestRate: debt?.interestRate ?? '',
      notes: debt?.notes ?? '',
    });
  }, [open, debt, reset]);

  const mutation = useMutation({
    mutationFn: (values: DebtFormValues) => {
      const payload: Record<string, unknown> = {
        direction: values.direction,
        concept: values.concept,
        originalAmount: values.originalAmount,
        currency: values.currency,
        notes: values.notes || undefined,
        dueDate: values.dueDate || undefined,
        interestRate: values.interestRate || undefined,
      };
      if (editing && debt) {
        return apiFetch<Debt>(`/debts/${debt.id}?workspaceId=${workspaceId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
      return apiFetch<Debt>('/debts', { method: 'POST', body: JSON.stringify({ ...payload, workspaceId }) });
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts(workspaceId) });
      toast.success(editing ? 'Deuda actualizada' : 'Deuda creada');
      reset();
      onOpenChange(false);
      if (!editing && saved?.id) onCreated?.(saved.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar deuda' : 'Nueva deuda'}</DialogTitle>
          <DialogDescription>Registra lo que debes o lo que te deben.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="debt-direction">Dirección</Label>
            <Controller
              control={control}
              name="direction"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="debt-direction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEBO">Debo</SelectItem>
                    <SelectItem value="ME_DEBEN">Me deben</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="concept">Concepto</Label>
            <Input id="concept" placeholder="Ej. Préstamo a Juan, Tarjeta de crédito" {...register('concept')} />
            {errors.concept && <p className="text-xs text-destructive">{errors.concept.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="originalAmount">Monto</Label>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <Controller
                    control={control}
                    name="originalAmount"
                    render={({ field }) => (
                      <MoneyInput id="originalAmount" value={field.value} onValueChange={field.onChange} />
                    )}
                  />
                </div>
                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <CurrencyToggle value={field.value as 'PEN' | 'USD'} onChange={field.onChange} />
                  )}
                />
              </div>
              {errors.originalAmount && <p className="text-destructive text-xs">{errors.originalAmount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha vencimiento</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interestRate">Tasa interés (%)</Label>
              <Input id="interestRate" inputMode="decimal" placeholder="0.00" {...register('interestRate')} />
              {errors.interestRate && <p className="text-xs text-destructive">{errors.interestRate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="debt-notes">Notas</Label>
            <Textarea id="debt-notes" rows={2} placeholder="Detalle opcional" {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentFormDialog({
  workspaceId,
  debt,
  open,
  onOpenChange,
}: Readonly<{ workspaceId: string; debt: Debt; open: boolean; onOpenChange: (open: boolean) => void }>) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: '', date: todayLocal(), method: '' },
  });

  useEffect(() => {
    if (open) reset({ amount: '', date: todayLocal(), method: '' });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (values: PaymentFormValues) => {
      const payload: Record<string, unknown> = { amount: values.amount, date: values.date };
      if (values.method) payload.method = values.method;
      return apiFetch(`/debts/${debt.id}/payments?workspaceId=${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts(workspaceId) });
      toast.success('Pago registrado');
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const currency = debt.currency as 'PEN' | 'USD';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            {debt.concept} · Saldo pendiente {formatMoney(debt.balance ?? '0.00', currency)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Monto</Label>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <MoneyInput id="payment-amount" value={field.value} onValueChange={field.onChange} />
                )}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Método</Label>
            <Input id="method" placeholder="Opcional" {...register('method')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentsBreakdown({
  debt,
  onDeletePayment,
}: Readonly<{ debt: Debt; onDeletePayment?: (paymentId: string) => void }>) {
  const [open, setOpen] = useState(false);
  const payments = debt.payments ?? [];
  const currency = debt.currency as 'PEN' | 'USD';

  if (!payments.length) return null;

  return (
    <div className="mt-3 border-t pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown className={cn('h-4 w-4 transition-transform duration-300 ease-spring', open && 'rotate-180')} />
        {payments.length} {payments.length === 1 ? 'pago registrado' : 'pagos registrados'}
      </button>

      <div
        style={{ maxHeight: open ? `${payments.length * 40 + 16}px` : '0px' }}
        className="overflow-hidden transition-[max-height] duration-300 ease-out-soft"
      >
        <div className="mt-2 divide-y rounded-lg border">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="w-24 shrink-0 tabular-nums text-muted-foreground">{formatDate(payment.date)}</span>
              <span className="flex-1 truncate text-xs text-muted-foreground">{payment.method || '—'}</span>
              <span className="w-28 shrink-0 text-right font-semibold tabular-nums text-success">
                {formatMoney(payment.amount, currency)}
              </span>
              <span className="w-8 shrink-0">
                {onDeletePayment && (
                  <IconAction
                    icon={Trash2}
                    label="Eliminar pago"
                    destructive
                    onClick={() => onDeletePayment(payment.id)}
                  />
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DeudasPage() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { markNew, highlightClass } = useHighlightNew();
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState(FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);
  const [currencyFilter, setCurrencyFilter] = useState(FILTER_ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [paying, setPaying] = useState<Debt | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.debts(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Debt[]>(`/debts?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/debts/${id}?workspaceId=${activeWorkspaceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts(activeWorkspaceId ?? '') });
      toast.success('Deuda eliminada');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (paymentId: string) =>
      apiFetch(`/debts/payments/${paymentId}?workspaceId=${activeWorkspaceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.debts(activeWorkspaceId ?? '') });
      toast.success('Pago eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusOptions = useMemo(() => {
    const values = Array.from(new Set((data ?? []).map((d) => d.status)));
    return values.map((v) => ({ value: v, label: statusLabel(v) }));
  }, [data]);

  const debts = useMemo(() => {
    const all = data ?? [];
    const q = search.trim().toLowerCase();
    return all.filter(
      (d) =>
        (!q || d.concept.toLowerCase().includes(q)) &&
        (directionFilter === FILTER_ALL || d.direction === directionFilter) &&
        (statusFilter === FILTER_ALL || d.status === statusFilter) &&
        (currencyFilter === FILTER_ALL || d.currency === currencyFilter),
    );
  }, [data, search, directionFilter, statusFilter, currencyFilter]);

  const hasFilters =
    search !== '' || directionFilter !== FILTER_ALL || statusFilter !== FILTER_ALL || currencyFilter !== FILTER_ALL;

  const clearFilters = () => {
    setSearch('');
    setDirectionFilter(FILTER_ALL);
    setStatusFilter(FILTER_ALL);
    setCurrencyFilter(FILTER_ALL);
  };

  const confirmRemove = async (debt: Debt) => {
    const ok = await confirm({
      title: 'Eliminar deuda',
      description: `Se eliminará "${debt.concept}" junto con sus pagos registrados. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) removeMutation.mutate(debt.id);
  };

  return (
    <PageShell
      title="Deudas"
      description="Gestiona lo que debes y lo que te deben"
      action={
        activeWorkspaceId ? (
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Nueva deuda
          </Button>
        ) : null
      }
    >
      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar deudas..."
        showClear={hasFilters}
        onClear={clearFilters}
        filters={
          <>
            <FilterSelect
              value={directionFilter}
              onValueChange={setDirectionFilter}
              options={[
                { value: 'DEBO', label: 'Debo' },
                { value: 'ME_DEBEN', label: 'Me deben' },
              ]}
              placeholder="Dirección"
              allLabel="Toda dirección"
            />
            <FilterSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={statusOptions}
              placeholder="Estado"
              allLabel="Todo estado"
            />
            <FilterSelect
              value={currencyFilter}
              onValueChange={setCurrencyFilter}
              options={[
                { value: 'PEN', label: 'Soles' },
                { value: 'USD', label: 'Dólares' },
              ]}
              placeholder="Moneda"
              allLabel="Toda moneda"
            />
          </>
        }
      />

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
              <Card key={debt.id} className={cn(highlightClass(debt.id))}>
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
                  <div className="flex shrink-0 items-start gap-1">
                    <p className="text-xl font-bold tabular-nums">{formatMoney(debt.originalAmount, currency)}</p>
                    <div className="flex items-center gap-1.5">
                      <IconAction
                        icon={Pencil}
                        label="Editar deuda"
                        onClick={() => {
                          setEditing(debt);
                          setFormOpen(true);
                        }}
                      />
                      <IconAction
                        icon={Trash2}
                        label="Eliminar deuda"
                        destructive
                        onClick={() => confirmRemove(debt)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Saldo: {formatMoney(debt.balance ?? '0.00', currency)} · Pagado:{' '}
                    {formatMoney(debt.totalPaid ?? '0.00', currency)}
                    {debt.dueDate ? ` · Vence: ${formatDate(debt.dueDate)}` : ''}
                  </p>
                  {debt.notes && <p className="mt-2 whitespace-pre-wrap text-sm">{debt.notes}</p>}
                  <PaymentsBreakdown debt={debt} onDeletePayment={(id) => deletePaymentMutation.mutate(id)} />
                </CardContent>
                {activeWorkspaceId && (
                  <CardFooter>
                    <Button variant="outline" size="sm" onClick={() => setPaying(debt)}>
                      Registrar pago
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Sin deudas" description="No tienes deudas registradas." />
      )}

      {activeWorkspaceId && (
        <DebtFormDialog
          workspaceId={activeWorkspaceId}
          open={formOpen}
          onOpenChange={(next) => {
            setFormOpen(next);
            if (!next) setEditing(null);
          }}
          debt={editing}
          onCreated={markNew}
        />
      )}

      {activeWorkspaceId && paying && (
        <PaymentFormDialog
          workspaceId={activeWorkspaceId}
          debt={paying}
          open
          onOpenChange={(next) => !next && setPaying(null)}
        />
      )}
    </PageShell>
  );
}
