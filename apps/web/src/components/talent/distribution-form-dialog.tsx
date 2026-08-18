'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Calculator } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { MoneyField } from '@/components/ui/money-input';
import { MonthInput } from '@/components/ui/month-input';
import { SearchSelect } from '@/components/ui/search-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TalentIncomeDistribution } from '@/lib/api.types';
import { avisoReparto } from '@/lib/payment-split';
import { useGlobalCatalog } from '@/lib/use-global-catalog';
import { SplitCalculator } from './split-calculator';

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
  loose?: boolean;
  defaultSalary?: string | null;
}

export function DistributionFormDialog({
  distribution,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSubmit,
  isPending,
  loose = false,
  defaultSalary,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [calcAbierta, setCalcAbierta] = useState(false);
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
      date: `${new Date().toISOString().slice(0, 7)}-01`,
      paymentType: loose ? 'CTS' : 'Mensual',
      status: 'PAID',
    },
  });

  const { companyOptions, clientOptionsFor, createCompany, createClient, companyByName } = useGlobalCatalog({
    enabled: open,
  });

  const montos = {
    salary: watch('salary'),
    amountWithDiscount: watch('amountWithDiscount'),
    amountReceived: watch('amountReceived'),
    amountRetained: watch('amountRetained'),
  };
  const avisoMontos = avisoReparto(montos);

  const empresaSel = companyByName(watch('companyName'));
  const opcionesCliente = clientOptionsFor(empresaSel?.id);

  useEffect(() => {
    if (open && !distribution) {
      reset({
        date: `${new Date().toISOString().slice(0, 7)}-01`,
        paymentType: loose ? 'CTS' : 'Mensual',
        status: 'PAID',
        salary: defaultSalary ? Number(defaultSalary).toString() : '',
      });
      return;
    }
    if (open && distribution) {
      reset({
        date: distribution.date ? distribution.date.slice(0, 10) : `${new Date().toISOString().slice(0, 7)}-01`,
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
  }, [open, distribution, reset, defaultSalary, loose]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        onInteractOutside={(e) => {
          if ((e.target as HTMLElement | null)?.closest('[data-calculadora]')) e.preventDefault();
        }}
        onFocusOutside={(e) => {
          if ((e.target as HTMLElement | null)?.closest('[data-calculadora]')) e.preventDefault();
        }}
      >
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
              <MonthInput id="date" value={watch('date') ?? ''} onChange={(v) => setValue('date', v)} />
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
                <Label>Empresa</Label>
                <SearchSelect
                  placeholder="Selecciona empresa"
                  searchPlaceholder="Buscar o escribir para crear..."
                  value={watch('companyName') ?? ''}
                  onValueChange={(v) => setValue('companyName', v)}
                  options={companyOptions}
                  onCreate={async (nombre) => {
                    await createCompany(nombre);
                    setValue('companyName', nombre);
                    toast.success(`Empresa "${nombre}" creada`);
                  }}
                  createLabel="Crear empresa"
                  clearable
                />
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <SearchSelect
                  placeholder="Selecciona cliente"
                  searchPlaceholder="Buscar o escribir para crear..."
                  value={watch('clientName') ?? ''}
                  onValueChange={(v) => setValue('clientName', v)}
                  options={opcionesCliente}
                  onCreate={async (nombre) => {
                    await createClient(nombre, empresaSel?.id);
                    setValue('clientName', nombre);
                    toast.success(`Cliente "${nombre}" creado`);
                  }}
                  createLabel="Crear cliente"
                  clearable
                />
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

          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs">Reparto entre MIMOTECH y el talento</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setCalcAbierta((v) => !v)}
            >
              <Calculator className="mr-1 size-3.5" />
              {calcAbierta ? 'Ocultar' : 'Calculadora'}
            </Button>
          </div>

          {avisoMontos && <p className="rounded-md bg-warning/10 px-3 py-2 text-warning text-xs">{avisoMontos}</p>}

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
        {calcAbierta && (
          <SplitCalculator
            values={montos}
            onApply={(campo, valor) => setValue(campo, valor, { shouldValidate: true })}
            onClose={() => setCalcAbierta(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
