'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge, statusLabel } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Undo2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { IconAction } from '@/components/ui/icon-action';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyField } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { PendingItem } from '@/lib/api.types';
import { PENDING_KIND_LABELS } from '@/lib/labels';
import { queryKeys } from '@/lib/query-keys';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { cn, formatDate, formatDurationExact } from '@/lib/utils';

const schema = z.object({
  kind: z.enum(['COBRAR', 'PAGAR']),
  concept: z.string().min(1, 'Requerido'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido'),
  currency: z.enum(['PEN', 'USD']),
  issuedDate: z.string().optional(),
  dueDate: z.string().min(1, 'Requerido'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface PendingFormProps {
  workspaceId: string;
  onCreated?: (id: string) => void;
  item?: PendingItem;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function PendingFormDialog({ workspaceId, onCreated, item, open: openProp, onOpenChange }: Readonly<PendingFormProps>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const editando = !!item;
  const queryClient = useQueryClient();

  const {
    register,
    control,
    watch,
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
      issuedDate: '',
      dueDate: new Date().toISOString().slice(0, 10),
      notes: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      kind: (item?.kind as FormValues['kind']) ?? 'COBRAR',
      concept: item?.concept ?? '',
      amount: item?.amount ?? '',
      currency: (item?.currency as FormValues['currency']) ?? 'PEN',
      issuedDate: item?.issuedDate ? item.issuedDate.slice(0, 10) : '',
      dueDate: item?.dueDate ? item.dueDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: item?.notes ?? '',
    });
  }, [open, item, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      editando
        ? apiFetch<PendingItem>(`/pending-items/${item.id}?workspaceId=${workspaceId}`, {
            method: 'PATCH',
            body: JSON.stringify(values),
          })
        : apiFetch<PendingItem>('/pending-items', {
            method: 'POST',
            body: JSON.stringify({ ...values, workspaceId }),
          }),
    onSuccess: (guardado) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingItems(workspaceId) });
      toast.success(editando ? 'Pendiente actualizado' : 'Pendiente creado');
      reset();
      setOpen(false);
      if (!editando && guardado?.id) onCreated?.(guardado.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {openProp === undefined && (
        <DialogTrigger asChild>
          <Button>Nuevo pendiente</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar pendiente' : 'Nuevo pendiente'}</DialogTitle>
          <DialogDescription>Registra un cobro o pago pendiente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={watch('kind')} onValueChange={(v) => setValue('kind', v as FormValues['kind'])}>
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
              <Label htmlFor="issuedDate">Fecha del préstamo</Label>
              <Input id="issuedDate" type="date" {...register('issuedDate')} />
              <p className="text-[11px] text-muted-foreground">Cuándo se prestó o se generó el cobro.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Vencimiento</Label>
            <Input id="dueDate" type="date" {...register('dueDate')} />
            {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="concept">Concepto</Label>
            <Input id="concept" placeholder="Ej. Pago pendiente, cobro por realizar" {...register('concept')} />
            {errors.concept && <p className="text-xs text-destructive">{errors.concept.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <MoneyField control={control} name="amount" id="amount" />
              </div>
              <CurrencyToggle
                value={(watch('currency') ?? 'PEN') as 'PEN' | 'USD'}
                onChange={(v) => setValue('currency', v)}
              />
            </div>
            {errors.amount && <p className="text-destructive text-xs">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" rows={2} placeholder="Detalle opcional" {...register('notes')} />
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

function UndoPaidButton({ workspaceId, item }: Readonly<{ workspaceId: string; item: PendingItem }>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => apiFetch(`/pending-items/${item.id}/payments?workspaceId=${workspaceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingItems(workspaceId) });
      toast.success('Vuelve a estar pendiente');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Button variant="ghost" size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
      <Undo2 className="mr-1.5 size-4" aria-hidden="true" />
      {mutation.isPending ? 'Guardando...' : 'Deshacer pago'}
    </Button>
  );
}

export default function PendientesPage() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { markNew, highlightClass } = useHighlightNew();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<PendingItem | null>(null);
  const [kindFilter, setKindFilter] = useState(FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(FILTER_ALL);
  const [currencyFilter, setCurrencyFilter] = useState(FILTER_ALL);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.pendingItems(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<PendingItem[]>(`/pending-items?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/pending-items/${id}?workspaceId=${activeWorkspaceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingItems(activeWorkspaceId ?? '') });
      toast.success('Pendiente eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const kindOptions = useMemo(() => {
    const values = Array.from(new Set((data ?? []).map((i) => i.kind)));
    return values.map((v) => ({ value: v, label: PENDING_KIND_LABELS[v] ?? v }));
  }, [data]);

  const statusOptions = useMemo(() => {
    const values = Array.from(new Set((data ?? []).map((i) => i.status)));
    return values.map((v) => ({ value: v, label: statusLabel(v) }));
  }, [data]);

  const items = useMemo(() => {
    const all = data ?? [];
    const q = search.trim().toLowerCase();
    return all.filter(
      (i) =>
        (!q || i.concept.toLowerCase().includes(q)) &&
        (kindFilter === FILTER_ALL || i.kind === kindFilter) &&
        (statusFilter === FILTER_ALL || i.status === statusFilter) &&
        (currencyFilter === FILTER_ALL || i.currency === currencyFilter),
    );
  }, [data, search, kindFilter, statusFilter, currencyFilter]);

  const hasFilters =
    search !== '' || kindFilter !== FILTER_ALL || statusFilter !== FILTER_ALL || currencyFilter !== FILTER_ALL;

  const clearFilters = () => {
    setSearch('');
    setKindFilter(FILTER_ALL);
    setStatusFilter(FILTER_ALL);
    setCurrencyFilter(FILTER_ALL);
  };

  return (
    <PageShell
      title="Pendientes"
      description="Cobros y pagos pendientes"
      action={activeWorkspaceId ? <PendingFormDialog workspaceId={activeWorkspaceId} onCreated={markNew} /> : null}
    >
      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar pendientes..."
        showClear={hasFilters}
        onClear={clearFilters}
        filters={
          <>
            <FilterSelect
              value={kindFilter}
              onValueChange={setKindFilter}
              options={kindOptions}
              placeholder="Tipo"
              allLabel="Todo tipo"
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
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : items.length ? (
        <div className="space-y-3">
          {items.map((item) => {
            const currency = item.currency as 'PEN' | 'USD';
            return (
              <Card key={item.id} className={cn(highlightClass(item.id))}>
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
                <CardContent className="space-y-2">
                  <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    {item.issuedDate && (
                      <div className="flex gap-1.5">
                        <dt className="text-muted-foreground">Prestado:</dt>
                        <dd className="font-medium">{formatDate(item.issuedDate)}</dd>
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <dt className="text-muted-foreground">Vence:</dt>
                      <dd className="font-medium">{formatDate(item.dueDate)}</dd>
                    </div>
                    {item.issuedDate && (
                      <div className="flex gap-1.5">
                        <dt className="text-muted-foreground">Plazo:</dt>
                        <dd className="font-medium">{formatDurationExact(item.issuedDate, item.dueDate)}</dd>
                      </div>
                    )}
                  </dl>
                  {item.notes && <p className="whitespace-pre-wrap text-muted-foreground text-sm">{item.notes}</p>}
                </CardContent>
                {activeWorkspaceId && (
                  <CardFooter className="justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {item.status !== 'PAID' ? (
                        <MarkPaidButton workspaceId={activeWorkspaceId} item={item} />
                      ) : (
                        <UndoPaidButton workspaceId={activeWorkspaceId} item={item} />
                      )}
                      <IconAction icon={Pencil} label="Editar" onClick={() => setEditing(item)} />
                    </div>
                    <IconAction
                      icon={Trash2}
                      label="Eliminar"
                      destructive
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Eliminar pendiente',
                          description: `Se eliminará "${item.concept}". Esta acción no se puede deshacer.`,
                          confirmLabel: 'Eliminar',
                          destructive: true,
                        });
                        if (ok) removeMutation.mutate(item.id);
                      }}
                    />
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Sin pendientes" description="No tienes cobros ni pagos pendientes." />
      )}

      {activeWorkspaceId && editing && (
        <PendingFormDialog
          workspaceId={activeWorkspaceId}
          item={editing}
          open
          onOpenChange={(abierto) => {
            if (!abierto) setEditing(null);
          }}
        />
      )}
    </PageShell>
  );
}
