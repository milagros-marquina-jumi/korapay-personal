'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
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
import type {
  Application,
  BankCatalog,
  Category,
  Company,
  PaymentMethodCatalog,
  Person,
  Project,
  Transaction,
} from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { buildTags, isFixedExpense, splitTags } from '@/lib/transaction-tags';

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
  amountGross: z
    .string()
    .regex(/^\d{1,10}(\.\d{1,3})?$/, 'Máx. 10 enteros y 3 decimales')
    .optional()
    .or(z.literal('')),
  currency: z.enum(['PEN', 'USD']),
  date: z.string().min(1, 'Requerido'),
  status: z.enum(['PAID', 'PENDING', 'OVERDUE', 'PARTIAL']),
  categoryId: z.string().optional(),
  companyId: z.string().optional(),
  applicationId: z.string().optional(),
  projectIds: z.array(z.string()).optional(),
  personId: z.string().optional(),
  paymentMethod: z.string().optional(),
  bank: z.string().optional(),
  isFixed: z.boolean().optional(),
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
  // Medios de pago y bancos comparten el campo tags; se distinguen por su catalogo de origen.
  const catalogs = useMemo(
    () => ({
      paymentMethods: new Set((paymentMethods ?? []).map((p) => p.name)),
      banks: new Set((banks ?? []).map((b) => b.name)),
    }),
    [paymentMethods, banks],
  );
  const catalogsReady = !!paymentMethods && !!banks;

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
      amountGross: '',
      currency: 'PEN',
      date: new Date().toISOString().slice(0, 10),
      status: 'PENDING',
      isRecurring: false,
    },
  });

  const isRecurring = watch('isRecurring');
  const currentType = watch('type');
  const currentStatus = watch('status');
  const showBusinessFields = currentType === 'BUSINESS_COST';
  const showTeamFields = currentType === 'TEAM_PAYMENT';
  const showDueDate = currentStatus === 'PENDING' || currentStatus === 'PARTIAL' || currentStatus === 'OVERDUE';
  const { data: applications } = useQuery({
    queryKey: queryKeys.applications(workspaceId),
    queryFn: () => apiFetch<Application[]>(`/applications?workspaceId=${workspaceId}`),
    enabled: open && showBusinessFields,
  });
  const { data: projects } = useQuery({
    queryKey: queryKeys.projects(workspaceId),
    queryFn: () => apiFetch<Project[]>(`/projects?workspaceId=${workspaceId}`),
    enabled: open && showBusinessFields,
  });
  const { data: people } = useQuery({
    queryKey: queryKeys.people(workspaceId),
    queryFn: () => apiFetch<Person[]>(`/people?workspaceId=${workspaceId}&kind=TEAM`),
    enabled: open && showTeamFields,
  });

  useEffect(() => {
    if (open && !transaction) {
      reset({
        type: defaultType,
        concept: '',
        amount: '',
        amountGross: '',
        currency: 'PEN',
        date: new Date().toISOString().slice(0, 10),
        status: 'PENDING',
        categoryId: undefined,
        companyId: undefined,
        applicationId: undefined,
        projectIds: [],
        personId: undefined,
        paymentMethod: '',
        bank: '',
        isFixed: false,
        notes: '',
        dueDate: '',
        isRecurring: false,
      });
    }
    // Los catalogos deciden si un tag es medio de pago o banco: sin ellos no se puede repartir.
    if (open && transaction && catalogsReady) {
      const split = splitTags(transaction.tags, catalogs);
      reset({
        type: (transaction.type as FormValues['type']) ?? defaultType,
        concept: transaction.concept,
        amount: Number(transaction.amountOriginal).toString(),
        amountGross: transaction.amountGross ? Number(transaction.amountGross).toString() : '',
        currency: (transaction.currency as 'PEN' | 'USD') ?? 'PEN',
        date: transaction.date.slice(0, 10),
        status: (transaction.status as FormValues['status']) ?? 'PENDING',
        categoryId: transaction.categoryId ?? undefined,
        companyId: transaction.companyId ?? undefined,
        applicationId: transaction.applicationId ?? undefined,
        projectIds: transaction.projects?.map((p) => p.id) ?? [],
        personId: transaction.personId ?? undefined,
        paymentMethod: split.paymentMethod ?? '',
        bank: split.bank ?? '',
        isFixed: isFixedExpense(transaction.tags),
        notes: transaction.notes ?? '',
        dueDate: transaction.dueDate ? transaction.dueDate.slice(0, 10) : '',
        isRecurring: false,
      });
    }
  }, [open, transaction, reset, defaultType, catalogsReady, catalogs]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const { recurrenceCount, paymentMethod, bank, projectIds, personId, isFixed, ...rest } = values;
      const finalTags = buildTags({
        isFixedExpense: isFixed ?? false,
        applyExpenseType: rest.type === 'EXPENSE',
        paymentMethod,
        bank,
        // Los tags ajenos a los catalogos (cargos, meses heredados) se conservan tal cual.
        rest: splitTags(transaction?.tags, catalogs).rest,
      });
      const isBusinessCost = rest.type === 'BUSINESS_COST';
      const isTeamPayment = rest.type === 'TEAM_PAYMENT';
      if (editing && transaction) {
        const editPayload = {
          type: rest.type,
          concept: rest.concept,
          amount: rest.amount,
          amountGross: rest.amountGross || null,
          currency: rest.currency,
          date: rest.date,
          status: rest.status,
          categoryId: rest.categoryId || null,
          companyId: showCompany ? rest.companyId || null : undefined,
          applicationId: isBusinessCost ? (rest.applicationId ?? null) : undefined,
          projectIds: isBusinessCost ? (projectIds ?? []) : undefined,
          personId: isTeamPayment ? (personId ?? null) : undefined,
          notes: rest.notes ?? '',
          dueDate: showDueDate ? values.dueDate || null : null,
          tags: finalTags,
        };
        return apiFetch<{ id: string }>(`/transactions/${transaction.id}?workspaceId=${workspaceId}`, {
          method: 'PATCH',
          body: JSON.stringify(editPayload),
        });
      }
      const payload = {
        ...rest,
        workspaceId,
        amountGross: rest.amountGross || undefined,
        applicationId: isBusinessCost ? rest.applicationId : undefined,
        projectIds: isBusinessCost && projectIds?.length ? projectIds : undefined,
        personId: isTeamPayment ? personId : undefined,
        tags: finalTags.length ? finalTags : undefined,
        recurrenceInterval: values.isRecurring ? 1 : undefined,
        recurrenceFrequency: values.isRecurring ? values.recurrenceFrequency : undefined,
        recurrenceEndDate: values.isRecurring ? values.recurrenceEndDate || undefined : undefined,
        recurrenceCount: values.isRecurring && recurrenceCount ? Number(recurrenceCount) : undefined,
        dueDate: showDueDate ? values.dueDate || undefined : undefined,
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
      <DialogContent className="flex max-h-[88vh] w-[min(42rem,95vw)] max-w-none flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{editing ? 'Editar movimiento' : 'Nuevo movimiento'}</DialogTitle>
          <DialogDescription>Registra un ingreso, egreso u otro movimiento.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={watch('type')}
                onValueChange={(v) => setValue('type', v as FormValues['type'], { shouldValidate: true })}
              >
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
            <div className="space-y-1.5">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" type="date" {...register('date')} />
            </div>
            <div className="space-y-1.5">
              <Label>Moneda</Label>
              <Select value={watch('currency')} onValueChange={(v) => setValue('currency', v as 'PEN' | 'USD')}>
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

          <div className="space-y-1.5">
            <Label htmlFor="concept">Concepto</Label>
            <Input
              id="concept"
              list="concept-suggestions"
              placeholder="Ej. Sueldo, Gratificación, CTS..."
              {...register('concept')}
            />
            <datalist id="concept-suggestions">
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
            {errors.concept && <p className="text-xs text-destructive">{errors.concept.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amountGross">Monto bruto</Label>
              <MoneyInput
                id="amountGross"
                value={watch('amountGross') ?? ''}
                onValueChange={(raw) => setValue('amountGross', raw)}
              />
              <p className="text-xs text-muted-foreground">Antes de descuentos. Vacío si no hubo.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Monto neto</Label>
              <MoneyInput
                id="amount"
                value={watch('amount') ?? ''}
                onValueChange={(raw) => setValue('amount', raw, { shouldValidate: true })}
              />
              <p className="text-xs text-muted-foreground">Lo que realmente recibiste.</p>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {showCompany && (
              <div className="space-y-1.5">
                <Label>Empresa</Label>
                <SearchSelect
                  placeholder="Selecciona empresa"
                  searchPlaceholder="Buscar empresa..."
                  value={watch('companyId') ?? ''}
                  onValueChange={(v) => setValue('companyId', v)}
                  options={(companies ?? []).map((c) => ({ value: c.id, label: c.name }))}
                  clearable
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <SearchSelect
                placeholder="Opcional"
                searchPlaceholder="Buscar categoría..."
                value={watch('categoryId') ?? ''}
                onValueChange={(v) => setValue('categoryId', v)}
                options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
                clearable
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Medio de pago</Label>
              <SearchSelect
                placeholder="Opcional"
                searchPlaceholder="Buscar medio de pago..."
                value={watch('paymentMethod') ?? ''}
                onValueChange={(v) => setValue('paymentMethod', v)}
                options={(paymentMethods ?? []).map((p) => ({ value: p.name, label: p.name }))}
                clearable
              />
            </div>
            <div className="space-y-1.5">
              <Label>Banco</Label>
              <SearchSelect
                placeholder="Opcional"
                searchPlaceholder="Buscar banco..."
                value={watch('bank') ?? ''}
                onValueChange={(v) => setValue('bank', v)}
                options={(banks ?? []).map((b) => ({ value: b.name, label: b.name }))}
                clearable
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={watch('status')} onValueChange={(v) => setValue('status', v as FormValues['status'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="PAID">Pagado</SelectItem>
                <SelectItem value="PARTIAL">Parcial</SelectItem>
                <SelectItem value="OVERDUE">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {watch('type') === 'EXPENSE' && (
            <label
              htmlFor="isFixed"
              className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <Checkbox
                id="isFixed"
                checked={watch('isFixed') ?? false}
                onCheckedChange={(v) => setValue('isFixed', v === true)}
                className="mt-0.5"
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium">Gasto fijo</span>
                <span className="block text-xs text-muted-foreground">
                  Se repite cada mes con un monto similar (alquiler, servicios). Solo clasifica el gasto en los
                  reportes.
                </span>
              </span>
            </label>
          )}

          {showTeamFields && (
            <div className="space-y-2">
              <Label>Persona (equipo)</Label>
              <SearchSelect
                placeholder="Selecciona a quién es el pago"
                searchPlaceholder="Buscar persona..."
                value={watch('personId') ?? ''}
                onValueChange={(v) => {
                  setValue('personId', v);
                  const name = people?.find((p) => p.id === v)?.name;
                  if (name) setValue('concept', `Pago ${name}`, { shouldValidate: true });
                }}
                options={(people ?? []).map((p) => ({ value: p.id, label: p.name }))}
              />
            </div>
          )}

          <CollapsibleSection label="Ver más opciones">
            {showBusinessFields && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Aplicación</Label>
                  <SearchSelect
                    placeholder="Opcional"
                    searchPlaceholder="Buscar aplicación..."
                    value={watch('applicationId') ?? ''}
                    onValueChange={(v) => setValue('applicationId', v)}
                    options={(applications ?? []).map((a) => ({ value: a.id, label: a.name }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Proyecto(s)</Label>
                  <MultiSelect
                    placeholder="Uno o varios"
                    searchPlaceholder="Buscar proyecto..."
                    selected={
                      (watch('projectIds') ?? [])
                        .map((id) => projects?.find((p) => p.id === id)?.name)
                        .filter(Boolean) as string[]
                    }
                    onChange={(names) => {
                      const ids = names.map((n) => projects?.find((p) => p.name === n)?.id).filter(Boolean) as string[];
                      setValue('projectIds', ids);
                    }}
                    groups={[{ label: 'Proyectos', options: (projects ?? []).map((p) => p.name) }]}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="Detalle opcional: número de cuenta, acuerdo, referencia..."
                {...register('notes')}
              />
            </div>

            {showDueDate && (
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Fecha límite de pago</Label>
                <Input id="dueDate" type="date" {...register('dueDate')} />
                <p className="text-xs text-muted-foreground">
                  Si llega esa fecha y sigue sin pagarse, se marcará como vencido automáticamente.
                </p>
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
                  <Switch
                    id="isRecurring"
                    checked={!!isRecurring}
                    onCheckedChange={(v) => setValue('isRecurring', v)}
                  />
                </div>

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
                      <Label htmlFor="recurrenceEndDate">O fecha de fin</Label>
                      <Input id="recurrenceEndDate" type="date" {...register('recurrenceEndDate')} />
                    </div>
                  </>
                )}
              </div>
            )}
          </CollapsibleSection>

          <input type="hidden" {...register('amount')} />

          <DialogFooter className="shrink-0 border-t pt-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending || !catalogsReady}>
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
