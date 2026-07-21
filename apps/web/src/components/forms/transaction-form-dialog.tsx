'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { MoneyInput } from '@/components/ui/money-input';
import { MultiSelect } from '@/components/ui/multi-select';
import { SearchSelect } from '@/components/ui/search-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { BankCatalog, Category, Company, PaymentMethodCatalog, Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const TYPE_OPTIONS = [
  { value: 'INCOME', label: 'Ingreso' },
  { value: 'EXPENSE', label: 'Egreso' },
  { value: 'SAVING', label: 'Ahorro' },
  { value: 'BUSINESS_COST', label: 'Costo Mimotech' },
  { value: 'TEAM_PAYMENT', label: 'Pago equipo' },
] as const;

const TYPES_BY_WORKSPACE: Record<string, string[]> = {
  PERSONAL: ['INCOME', 'EXPENSE'],
  SHARED: ['INCOME', 'EXPENSE'],
};

const schema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'SAVING', 'BUSINESS_COST', 'TEAM_PAYMENT']),
  concept: z.string().min(1, 'Requerido'),
  amount: z.string().regex(/^\d{1,10}(\.\d{1,3})?$/, 'Máx. 10 enteros y 3 decimales'),
  currency: z.enum(['PEN', 'USD']),
  date: z.string().min(1, 'Requerido'),
  status: z.enum(['PAID', 'PENDING', 'OVERDUE', 'PARTIAL']),
  categoryId: z.string().optional(),
  companyId: z.string().optional(),
  paymentTags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceFrequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  recurrenceEndDate: z.string().optional(),
  recurrenceCount: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  workspaceId: string;
  workspaceType?: string;
  defaultType?: FormValues['type'];
  trigger?: ReactNode;
  onCreated?: (id: string) => void;
  transaction?: Transaction | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TransactionFormDialog({
  workspaceId,
  workspaceType,
  defaultType = 'EXPENSE',
  trigger,
  onCreated,
  transaction,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const editing = !!transaction;
  const queryClient = useQueryClient();
  const allowedTypes = TYPES_BY_WORKSPACE[workspaceType ?? ''];
  const typeOptions = allowedTypes ? TYPE_OPTIONS.filter((t) => allowedTypes.includes(t.value)) : TYPE_OPTIONS;

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories(workspaceId),
    queryFn: () => apiFetch<Category[]>(`/categories?workspaceId=${workspaceId}`),
    enabled: open,
  });
  const { data: banks } = useQuery({
    queryKey: queryKeys.banks(),
    queryFn: () => apiFetch<BankCatalog[]>('/banks'),
    enabled: open,
  });
  const { data: paymentMethods } = useQuery({
    queryKey: queryKeys.paymentMethods(),
    queryFn: () => apiFetch<PaymentMethodCatalog[]>('/payment-methods'),
    enabled: open,
  });
  const showCompany = workspaceType === 'EMPLOYMENT';
  const { data: companies } = useQuery({
    queryKey: queryKeys.companies(workspaceId),
    queryFn: () => apiFetch<Company[]>(`/companies?workspaceId=${workspaceId}`),
    enabled: open && showCompany,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultType,
      concept: '',
      amount: '',
      currency: 'PEN',
      date: new Date().toISOString().slice(0, 10),
      status: 'PENDING',
      isRecurring: false,
    },
  });

  const isRecurring = watch('isRecurring');

  useEffect(() => {
    if (open && transaction) {
      reset({
        type: (transaction.type as FormValues['type']) ?? defaultType,
        concept: transaction.concept,
        amount: Number(transaction.amountOriginal).toString(),
        currency: (transaction.currency as 'PEN' | 'USD') ?? 'PEN',
        date: transaction.date.slice(0, 10),
        status: (transaction.status as FormValues['status']) ?? 'PENDING',
        categoryId: transaction.categoryId ?? undefined,
        companyId: transaction.companyId ?? undefined,
        paymentTags: transaction.tags ?? [],
        notes: transaction.notes ?? '',
        dueDate: transaction.dueDate ? transaction.dueDate.slice(0, 10) : '',
        isRecurring: false,
      });
    }
  }, [open, transaction, reset, defaultType]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const { recurrenceCount, paymentTags, ...rest } = values;
      if (editing && transaction) {
        const editPayload = {
          type: rest.type,
          concept: rest.concept,
          amount: rest.amount,
          currency: rest.currency,
          date: rest.date,
          status: rest.status,
          categoryId: rest.categoryId,
          companyId: rest.companyId,
          notes: rest.notes,
          dueDate: values.dueDate || undefined,
          tags: paymentTags?.length ? paymentTags : undefined,
        };
        return apiFetch<{ id: string }>(`/transactions/${transaction.id}?workspaceId=${workspaceId}`, {
          method: 'PATCH',
          body: JSON.stringify(editPayload),
        });
      }
      const payload = {
        ...rest,
        workspaceId,
        tags: paymentTags?.length ? paymentTags : undefined,
        recurrenceInterval: values.isRecurring ? 1 : undefined,
        recurrenceFrequency: values.isRecurring ? values.recurrenceFrequency : undefined,
        recurrenceEndDate: values.isRecurring ? values.recurrenceEndDate || undefined : undefined,
        recurrenceCount: values.isRecurring && recurrenceCount ? Number(recurrenceCount) : undefined,
        dueDate: values.dueDate || undefined,
      };
      return apiFetch<{ id: string }>('/transactions', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', workspaceId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(workspaceId) });
      toast.success(editing ? 'Movimiento actualizado' : 'Movimiento creado');
      if (!editing && created?.id) onCreated?.(created.id);
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar movimiento' : 'Nuevo movimiento'}</DialogTitle>
          <DialogDescription>Registra un ingreso, egreso u otro movimiento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select defaultValue={defaultType} onValueChange={(v) => setValue('type', v as FormValues['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" type="date" {...register('date')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concept">Concepto</Label>
            <Input id="concept" placeholder="Ej. Pago de alquiler, sueldo, compra..." {...register('concept')} />
            {errors.concept && <p className="text-xs text-destructive">{errors.concept.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <MoneyInput
                id="amount"
                value={watch('amount') ?? ''}
                onValueChange={(raw) => setValue('amount', raw, { shouldValidate: true })}
              />
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
                  <SelectItem value="USD">Dólares ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <SearchSelect
              placeholder="Opcional"
              searchPlaceholder="Buscar categoría..."
              value={watch('categoryId') ?? ''}
              onValueChange={(v) => setValue('categoryId', v)}
              options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>

          {showCompany && (
            <div className="space-y-2">
              <Label>Empresa</Label>
              <SearchSelect
                placeholder="Opcional"
                searchPlaceholder="Buscar empresa..."
                value={watch('companyId') ?? ''}
                onValueChange={(v) => setValue('companyId', v)}
                options={(companies ?? []).map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Medios de pago / Banco</Label>
            <MultiSelect
              placeholder="Selecciona uno o varios"
              searchPlaceholder="Buscar medio o banco..."
              selected={watch('paymentTags') ?? []}
              onChange={(vals) => setValue('paymentTags', vals)}
              groups={[
                { label: 'Medios de pago', options: (paymentMethods ?? []).map((p) => p.name) },
                { label: 'Bancos', options: (banks ?? []).map((b) => b.name) },
              ]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" rows={2} placeholder="Detalle opcional del movimiento" {...register('notes')} />
          </div>

          {editing && (
            <div className="space-y-2">
              <Label htmlFor="dueDate">Vencimiento (opcional)</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
            </div>
          )}

          {!editing && (
            <div className="space-y-3 rounded-lg border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isRecurring">Pago recurrente</Label>
                  <p className="text-xs text-muted-foreground">
                    {isRecurring
                      ? 'La fecha de arriba es el inicio. Se generará un movimiento por cada periodo.'
                      : 'Se repite periódicamente y genera un movimiento por periodo.'}
                  </p>
                </div>
                <Switch id="isRecurring" checked={!!isRecurring} onCheckedChange={(v) => setValue('isRecurring', v)} />
              </div>

              {!isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Vencimiento (opcional)</Label>
                  <Input id="dueDate" type="date" {...register('dueDate')} />
                </div>
              )}

              {isRecurring && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Frecuencia</Label>
                      <Select
                        defaultValue="MONTHLY"
                        onValueChange={(v) => setValue('recurrenceFrequency', v as FormValues['recurrenceFrequency'])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WEEKLY">Semanal</SelectItem>
                          <SelectItem value="MONTHLY">Mensual</SelectItem>
                          <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                          <SelectItem value="YEARLY">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recurrenceCount">Nº de repeticiones</Label>
                      <Input
                        id="recurrenceCount"
                        inputMode="numeric"
                        placeholder="Ej. 12"
                        {...register('recurrenceCount')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recurrenceEndDate">O fecha de fin (opcional)</Label>
                    <Input id="recurrenceEndDate" type="date" {...register('recurrenceEndDate')} />
                  </div>
                </>
              )}
            </div>
          )}

          <input type="hidden" {...register('amount')} />
          <input type="hidden" {...register('status')} value={watch('status')} />

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
