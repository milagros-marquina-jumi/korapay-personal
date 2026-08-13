'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { MoneyField } from '@/components/ui/money-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { TaxObligation } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const schema = z
  .object({
    name: z.string().min(1, 'Requerido'),
    year: z.string().optional(),
    dueDate: z.string().min(1, 'Requerido'),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido'),
    status: z.enum(['PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED']),
    installments: z.string().optional(),
    paidInstallments: z.string().optional(),
    notes: z.string().optional(),
  })
  // No se puede haber pagado mas cuotas de las que existen.
  .refine(
    (v) => {
      const total = Number(v.installments || 0);
      const pagadas = Number(v.paidInstallments || 0);
      if (!pagadas) return true;
      return total > 0 && pagadas <= total;
    },
    { message: 'No puede superar el total de cuotas', path: ['paidInstallments'] },
  );

type FormValues = z.infer<typeof schema>;

interface Props {
  workspaceId: string;
  trigger?: ReactNode;
  obligation?: TaxObligation | null;
  onSaved?: (id: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TaxObligationFormDialog({
  workspaceId,
  trigger,
  obligation,
  onSaved,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const queryClient = useQueryClient();
  const editing = !!obligation;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      year: String(new Date().getFullYear()),
      dueDate: new Date().toISOString().slice(0, 10),
      amount: '',
      status: 'PENDING',
    },
  });

  useEffect(() => {
    if (open && obligation) {
      reset({
        name: obligation.name,
        year: obligation.year ? String(obligation.year) : '',
        dueDate: obligation.dueDate.slice(0, 10),
        amount: Number(obligation.amount).toFixed(2),
        status: (obligation.status as FormValues['status']) ?? 'PENDING',
        installments: obligation.installments ? String(obligation.installments) : '',
        paidInstallments: obligation.paidInstallments ? String(obligation.paidInstallments) : '',
        notes: obligation.notes ?? '',
      });
    }
  }, [open, obligation, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        workspaceId,
        name: values.name,
        year: values.year ? Number(values.year) : undefined,
        dueDate: values.dueDate,
        amount: values.amount,
        status: values.status,
        installments: values.installments ? Number(values.installments) : undefined,
        paidInstallments: values.paidInstallments ? Number(values.paidInstallments) : undefined,
        notes: values.notes || undefined,
      };
      if (editing && obligation) {
        return apiFetch<TaxObligation>(`/tax-obligations/${obligation.id}?workspaceId=${workspaceId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
      return apiFetch<TaxObligation>('/tax-obligations', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taxObligations(workspaceId) });
      toast.success(editing ? 'Obligación actualizada' : 'Obligación creada');
      if (!editing && result?.id) onSaved?.(result.id);
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
          <DialogTitle>{editing ? 'Editar obligación' : 'Nueva obligación'}</DialogTitle>
          <DialogDescription>Renta anual u otra obligación tributaria, con cuotas y vencimiento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Concepto</Label>
            <Input id="name" placeholder="Ej. Renta Anual 2026" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Vencimiento</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
              {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Total a pagar</Label>
              <MoneyField control={control} name="amount" id="amount" />
              {errors.amount ? (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">Con intereses, si es en cuotas</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              defaultValue={obligation?.status ?? 'PENDING'}
              onValueChange={(v) => setValue('status', v as FormValues['status'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="PARTIAL">Parcial</SelectItem>
                <SelectItem value="PAID">Pagado</SelectItem>
                <SelectItem value="OVERDUE">Vencido</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CollapsibleSection label="Ver más opciones">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="year">Año</Label>
                <Input id="year" inputMode="numeric" placeholder="2026" {...register('year')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installments">Cuotas</Label>
                <Input id="installments" inputMode="numeric" placeholder="Ej. 12" {...register('installments')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidInstallments">Cuotas pagadas</Label>
              <Input id="paidInstallments" inputMode="numeric" placeholder="Ej. 3" {...register('paidInstallments')} />
              {errors.paidInstallments && <p className="text-destructive text-xs">{errors.paidInstallments.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="Detalle opcional (ej. 12 cuotas FIN: 30/06/2026)"
                {...register('notes')}
              />
            </div>
          </CollapsibleSection>

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
