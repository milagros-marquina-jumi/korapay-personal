'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { MoneyField } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TalentIncomeDistribution } from '@/lib/api.types';

const schema = z.object({
  date: z.string().min(1, 'Requerido'),
  paymentType: z.enum(['Mensual', 'Gratificación', 'Liquidación', 'CTS', 'Extra']),
  companyName: z.string().optional(),
  clientName: z.string().optional(),
  salary: z.string().optional(),
  amountWithDiscount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido'),
  amountReceived: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido'),
  amountRetained: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido'),
  status: z.enum(['PAID', 'PENDING', 'PARTIAL', 'OVERDUE', 'CANCELLED']),
  notes: z.string().optional(),
});

export type DistributionFormValues = z.infer<typeof schema>;

interface Props {
  distribution?: TalentIncomeDistribution | null;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (values: DistributionFormValues) => Promise<void> | void;
  isPending?: boolean;
  /** Si true, muestra los campos empresa/cliente (para distribuciones sueltas sin contrato) */
  loose?: boolean;
}

export function DistributionFormDialog({
  distribution,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSubmit,
  isPending,
  loose = false,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const editing = !!distribution;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DistributionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      paymentType: loose ? 'CTS' : 'Mensual',
      status: 'PAID',
    },
  });

  useEffect(() => {
    if (open && distribution) {
      reset({
        date: distribution.date ? distribution.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        paymentType: (distribution.paymentType as DistributionFormValues['paymentType']) ?? 'Mensual',
        companyName: distribution.companyName ?? '',
        clientName: distribution.clientName ?? '',
        salary: distribution.salary ? Number(distribution.salary).toString() : '',
        amountWithDiscount: Number(distribution.amountWithDiscount).toFixed(2),
        amountReceived: Number(distribution.amountReceived).toFixed(2),
        amountRetained: Number(distribution.amountRetained).toFixed(2),
        status: (distribution.status as DistributionFormValues['status']) ?? 'PAID',
        notes: distribution.notes ?? '',
      });
    }
  }, [open, distribution, reset]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar pago' : 'Nuevo pago'}</DialogTitle>
          <DialogDescription>Pago del mes: sueldo, montos y estado.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(async (v) => {
            await onSubmit(v);
            if (!editing) reset();
            setOpen(false);
          })}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Mes del pago</Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo de pago</Label>
              <Select
                value={watch('paymentType')}
                onValueChange={(v) => setValue('paymentType', v as DistributionFormValues['paymentType'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mensual">Mensual</SelectItem>
                  <SelectItem value="Gratificación">Gratificación</SelectItem>
                  <SelectItem value="Liquidación">Liquidación</SelectItem>
                  <SelectItem value="CTS">CTS</SelectItem>
                  <SelectItem value="Extra">Extra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loose && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="companyName">Empresa</Label>
                <Input id="companyName" placeholder="Ej. NTT DATA" {...register('companyName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName">Cliente</Label>
                <Input id="clientName" placeholder="Ej. BCP" {...register('clientName')} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="salary">Sueldo</Label>
              <MoneyField control={control} name="salary" id="salary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountWithDiscount">Con descuento (le llega)</Label>
              <MoneyField control={control} name="amountWithDiscount" id="amountWithDiscount" />
              {errors.amountWithDiscount && (
                <p className="text-xs text-destructive">{errors.amountWithDiscount.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amountReceived">Recibí (MIMOTECH)</Label>
              <MoneyField control={control} name="amountReceived" id="amountReceived" />
              {errors.amountReceived && <p className="text-xs text-destructive">{errors.amountReceived.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountRetained">Se quedó (talento)</Label>
              <MoneyField control={control} name="amountRetained" id="amountRetained" />
              {errors.amountRetained && <p className="text-xs text-destructive">{errors.amountRetained.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={watch('status')}
              onValueChange={(v) => setValue('status', v as DistributionFormValues['status'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAID">Pagado</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="PARTIAL">Parcial</SelectItem>
                <SelectItem value="OVERDUE">Vencido</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <input type="hidden" {...register('paymentType')} value={watch('paymentType')} />
          <input type="hidden" {...register('status')} value={watch('status')} />

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
