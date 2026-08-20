'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyToggle } from '@/components/ui/currency-toggle';
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
import { SearchSelect } from '@/components/ui/search-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { BankCatalog, Category, PaymentMethodCatalog, RecurrenceRule } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useCatalogCreate } from '@/lib/use-catalog-create';

const schema = z.object({
  concept: z.string().min(1, 'Requerido'),
  amount: z.string().regex(/^\d{1,10}(\.\d{1,3})?$/, 'Monto inválido'),
  currency: z.enum(['PEN', 'USD']),
  frequency: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: z.string().min(1, 'Requerido'),
  categoryId: z.string().optional(),
  paymentMethod: z.string().optional(),
  bank: z.string().optional(),
  notes: z.string().optional(),
  isFixedExpense: z.boolean(),
  endDate: z.string().optional(),
  endAfterCount: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  workspaceId: string;
  trigger?: ReactNode;
  rule?: RecurrenceRule | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function RecurrenceFormDialog({ workspaceId, trigger, rule, open: openProp, onOpenChange }: Readonly<Props>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const editando = !!rule;
  const queryClient = useQueryClient();
  const { createCategory, createBank, createPaymentMethod } = useCatalogCreate(workspaceId);

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
      concept: '',
      amount: '',
      currency: 'PEN',
      frequency: 'MONTHLY',
      startDate: new Date().toISOString().slice(0, 10),
      isFixedExpense: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      concept: rule?.concept ?? '',
      amount: rule?.amount ? Number(rule.amount).toString() : '',
      currency: (rule?.currency as FormValues['currency']) ?? 'PEN',
      frequency: (rule?.frequency as FormValues['frequency']) ?? 'MONTHLY',
      startDate: rule?.nextRunAt ? rule.nextRunAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      categoryId: rule?.categoryId ?? '',
      paymentMethod: rule?.paymentMethod ?? '',
      bank: rule?.bank ?? '',
      notes: rule?.notes ?? '',
      isFixedExpense: rule?.isFixedExpense ?? true,
      endDate: rule?.endDate ? rule.endDate.slice(0, 10) : '',
      endAfterCount: rule?.endAfterCount ? String(rule.endAfterCount) : '',
    });
  }, [open, rule, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        workspaceId,
        type: 'EXPENSE',
        concept: values.concept,
        amount: values.amount,
        currency: values.currency,
        frequency: values.frequency,
        startDate: values.startDate,
        categoryId: values.categoryId || undefined,
        paymentMethod: values.paymentMethod || undefined,
        bank: values.bank || undefined,
        notes: values.notes || undefined,
        isFixedExpense: values.isFixedExpense,
        endDate: values.endDate || undefined,
        endAfterCount: values.endAfterCount ? Number(values.endAfterCount) : undefined,
      };
      return editando && rule
        ? apiFetch(`/recurrences/${rule.id}?workspaceId=${workspaceId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : apiFetch('/recurrences', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurrences(workspaceId) });
      toast.success(editando ? 'Recurrencia actualizada' : 'Recurrencia creada');
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sinLimite = !watch('endDate') && !watch('endAfterCount');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="flex max-h-[88vh] w-[min(34rem,95vw)] max-w-none flex-col overflow-hidden sm:max-w-none">
        <DialogHeader className="shrink-0">
          <DialogTitle>{editando ? 'Editar recurrencia' : 'Nueva recurrencia'}</DialogTitle>
          <DialogDescription>El movimiento se crea solo, como pendiente, en cada periodo.</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto pr-1"
        >
          <div className="space-y-1.5">
            <Label htmlFor="rec-concept">Concepto</Label>
            <Input id="rec-concept" placeholder="Ej. Netflix, Chat GPT, alquiler" {...register('concept')} />
            {errors.concept && <p className="text-destructive text-xs">{errors.concept.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rec-amount">Monto</Label>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <MoneyInput
                    id="rec-amount"
                    value={watch('amount') ?? ''}
                    onValueChange={(raw) => setValue('amount', raw, { shouldValidate: true })}
                  />
                </div>
                <CurrencyToggle value={watch('currency')} onChange={(v) => setValue('currency', v)} />
              </div>
              {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Frecuencia</Label>
              <Select
                value={watch('frequency')}
                onValueChange={(v) => setValue('frequency', v as FormValues['frequency'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Semanal</SelectItem>
                  <SelectItem value="MONTHLY">Mensual</SelectItem>
                  <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                  <SelectItem value="YEARLY">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rec-start">Próximo cobro</Label>
              <Input id="rec-start" type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-destructive text-xs">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <SearchSelect
                placeholder="Opcional"
                searchPlaceholder="Buscar o escribir para crear..."
                value={watch('categoryId') ?? ''}
                onValueChange={(v) => setValue('categoryId', v)}
                options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
                onCreate={async (nombre) => {
                  const creada = await createCategory(nombre);
                  setValue('categoryId', creada.id);
                }}
                createLabel="Crear categoría"
                clearable
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Medio de pago</Label>
              <SearchSelect
                placeholder="Opcional"
                searchPlaceholder="Buscar o escribir para crear..."
                value={watch('paymentMethod') ?? ''}
                onValueChange={(v) => setValue('paymentMethod', v)}
                options={(paymentMethods ?? []).map((p) => ({ value: p.name, label: p.name }))}
                onCreate={async (nombre) => {
                  await createPaymentMethod(nombre);
                  setValue('paymentMethod', nombre);
                }}
                createLabel="Crear medio de pago"
                clearable
              />
            </div>
            <div className="space-y-1.5">
              <Label>Banco</Label>
              <SearchSelect
                placeholder="Opcional"
                searchPlaceholder="Buscar o escribir para crear..."
                value={watch('bank') ?? ''}
                onValueChange={(v) => setValue('bank', v)}
                options={(banks ?? []).map((b) => ({ value: b.name, label: b.name }))}
                onCreate={async (nombre) => {
                  await createBank(nombre);
                  setValue('bank', nombre);
                }}
                createLabel="Crear banco"
                clearable
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label htmlFor="rec-fixed" className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                id="rec-fixed"
                checked={watch('isFixedExpense')}
                onCheckedChange={(v) => setValue('isFixedExpense', v === true)}
              />
              <span className="font-medium">Gasto fijo</span>
            </label>
            <p className="mt-0.5 pl-6 text-muted-foreground text-xs">
              Marcado por defecto: un pago recurrente es un gasto fijo en tus reportes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rec-count">Nº de cobros</Label>
              <Input id="rec-count" inputMode="numeric" placeholder="Ej. 12" {...register('endAfterCount')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rec-end">O fecha de fin</Label>
              <Input id="rec-end" type="date" {...register('endDate')} />
            </div>
          </div>

          {sinLimite && (
            <p className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-muted-foreground text-xs">
              Sin límite seguirá generando hasta que la canceles. Es lo normal para una suscripción.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="rec-notes">Notas</Label>
            <Textarea id="rec-notes" rows={2} placeholder="Detalle opcional" {...register('notes')} />
          </div>

          <DialogFooter className="shrink-0 border-t pt-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
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
