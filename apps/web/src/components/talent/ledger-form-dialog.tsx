'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyField } from '@/components/ui/money-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { TalentLedgerEntry } from '@/lib/api.types';

const money = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido')
  .or(z.literal(''));

const schema = z.object({
  date: z.string().min(1, 'Requerido'),
  type: z.enum(['EGRESO', 'DEUDA']),
  category: z.string().optional(),
  paidAmount: money,
  debtAmount: money,
  pendingAmount: money,
  status: z.string().min(1, 'Requerido'),
  description: z.string().optional(),
});

export type LedgerFormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  { value: 'PAID', label: 'Pagado' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PARTIAL', label: 'Parcial' },
  { value: 'OVERDUE', label: 'Vencido' },
  { value: 'NUNCA_PAGO', label: 'Nunca pagó (pérdida)' },
];

const CATEGORY_OPTIONS = [
  { value: 'EDUCACION', label: 'Educación (Cibertec, ISIL...)' },
  { value: 'SUSCRIPCION', label: 'Suscripción (Platzi...)' },
  { value: 'TRABAJO', label: 'Trabajo (prueba técnica, entrevista)' },
  { value: 'ALQUILER', label: 'Alquiler' },
  { value: 'PRESTAMO', label: 'Préstamo' },
  { value: 'MOBILIARIO', label: 'Mobiliario' },
  { value: 'EQUIPO', label: 'Equipo (laptop, monitor...)' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'COMIDA', label: 'Comida' },
  { value: 'FRAUDE', label: 'Fraude' },
  { value: 'OTRO', label: 'Otro' },
];

interface Props {
  entry?: TalentLedgerEntry;
  trigger?: ReactNode;
  onSubmit: (values: LedgerFormValues) => Promise<void>;
  isPending?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LedgerFormDialog({ entry, trigger, onSubmit, isPending, open: controlledOpen, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const isEdit = !!entry;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LedgerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: entry?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      type: (entry?.type as 'EGRESO' | 'DEUDA') ?? 'EGRESO',
      category: entry?.category ?? '',
      paidAmount: entry?.paidAmount ?? '',
      debtAmount: entry?.debtAmount ?? '',
      pendingAmount: entry?.pendingAmount ?? '',
      status: entry?.status ?? 'PENDING',
      description: entry?.description ?? '',
    },
  });

  useEffect(() => {
    if (open && entry) {
      reset({
        date: entry.date.slice(0, 10),
        type: entry.type as 'EGRESO' | 'DEUDA',
        category: entry.category ?? '',
        paidAmount: entry.paidAmount,
        debtAmount: entry.debtAmount,
        pendingAmount: entry.pendingAmount,
        status: entry.status,
        description: entry.description ?? '',
      });
    }
  }, [open, entry, reset]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
    if (!isEdit) reset();
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>{trigger ?? <Button>Nuevo registro</Button>}</DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar registro' : 'Nuevo registro'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ledger-date">Fecha</Label>
              <Input id="ledger-date" type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={watch('type')} onValueChange={(v) => setValue('type', v as 'EGRESO' | 'DEUDA')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EGRESO">Egreso</SelectItem>
                  <SelectItem value="DEUDA">Deuda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={watch('category') ?? ''} onValueChange={(v) => setValue('category', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ledger-paid">Pagado</Label>
              <MoneyField control={control} name="paidAmount" id="ledger-paid" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ledger-debt">Deuda</Label>
              <MoneyField control={control} name="debtAmount" id="ledger-debt" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ledger-pending">Falta pagar</Label>
              <MoneyField control={control} name="pendingAmount" id="ledger-pending" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={watch('status')} onValueChange={(v) => setValue('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ledger-desc">Descripción</Label>
            <Textarea id="ledger-desc" rows={2} placeholder="Detalle del movimiento" {...register('description')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
