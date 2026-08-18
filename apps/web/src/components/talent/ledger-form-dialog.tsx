'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyField } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { TalentLedgerEntry } from '@/lib/api.types';
import { avisoDeuda, DEBT_STATUS_OPTIONS, normalizarDeuda } from '@/lib/debt-status';

const money = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido')
  .or(z.literal(''));

const schema = z.object({
  date: z.string().min(1, 'Requerido'),
  type: z.enum(['EGRESO', 'DEUDA']),
  debtOwner: z.enum(['TALENT', 'MINE']),
  paidAmount: money,
  debtAmount: money,
  pendingAmount: money,
  status: z.string().min(1, 'Requerido'),
  description: z.string().optional(),
});

export type LedgerFormValues = z.infer<typeof schema>;

function etiquetasDeuda(viewer: 'ADMIN' | 'TALENT', talentName?: string, adminName?: string) {
  const talento = talentName?.trim() || 'el talento';
  const admin = adminName?.trim() || 'la empresa';
  if (viewer === 'TALENT') {
    return { talentDebe: `Yo le debo a ${admin}`, adminDebe: `${admin} me debe` };
  }
  return { talentDebe: `${talento} me debe`, adminDebe: `Yo le debo a ${talento}` };
}

const STATUS_EGRESO = [
  { value: 'PAID', label: 'Gasto normal' },
  { value: 'NUNCA_PAGO', label: 'Se dio por perdido' },
];

interface Props {
  entry?: TalentLedgerEntry;
  defaultType?: 'EGRESO' | 'DEUDA';
  viewer?: 'ADMIN' | 'TALENT';
  talentName?: string;
  adminName?: string;
  trigger?: ReactNode;
  onSubmit: (values: LedgerFormValues) => Promise<void>;
  isPending?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  lockType?: boolean;
}

export function LedgerFormDialog({
  entry,
  defaultType = 'DEUDA',
  viewer = 'ADMIN',
  talentName,
  adminName,
  trigger,
  onSubmit,
  isPending,
  open: controlledOpen,
  onOpenChange,
  lockType = false,
}: Readonly<Props>) {
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
      type: (entry?.type as 'EGRESO' | 'DEUDA') ?? defaultType,
      debtOwner: (entry?.debtOwner as 'TALENT' | 'MINE') ?? 'TALENT',
      paidAmount: entry?.paidAmount ?? '',
      debtAmount: entry?.debtAmount ?? '',
      pendingAmount: entry?.pendingAmount ?? '',
      status: entry?.status ?? (defaultType === 'DEUDA' ? 'PENDING' : 'PAID'),
      description: entry?.description ?? '',
    },
  });

  useEffect(() => {
    if (open && entry) {
      reset({
        date: entry.date.slice(0, 10),
        type: entry.type as 'EGRESO' | 'DEUDA',
        debtOwner: (entry.debtOwner as 'TALENT' | 'MINE') ?? 'TALENT',
        paidAmount: entry.paidAmount,
        debtAmount: entry.debtAmount,
        pendingAmount: entry.pendingAmount,
        status: entry.status,
        description: entry.description ?? '',
      });
    }
  }, [open, entry, reset]);

  const esDeuda = watch('type') === 'DEUDA';
  const etiquetas = etiquetasDeuda(viewer, talentName, adminName);
  const aviso = esDeuda
    ? avisoDeuda({
        status: watch('status'),
        debtAmount: watch('debtAmount'),
        pendingAmount: watch('pendingAmount'),
      })
    : null;

  const submit = handleSubmit(async (values) => {
    const limpio = esDeuda
      ? { ...values, paidAmount: '0', pendingAmount: normalizarDeuda(values) }
      : { ...values, debtAmount: '0', pendingAmount: '0' };
    await onSubmit(limpio);
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
              <Select
                value={watch('type')}
                disabled={lockType}
                onValueChange={(v) => {
                  const tipo = v as 'EGRESO' | 'DEUDA';
                  setValue('type', tipo);
                  const permitidos = (tipo === 'DEUDA' ? DEBT_STATUS_OPTIONS : STATUS_EGRESO).map((s) => s.value);
                  if (!permitidos.includes(watch('status'))) {
                    setValue('status', tipo === 'DEUDA' ? 'PENDING' : 'PAID');
                  }
                }}
              >
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

          {esDeuda && (
            <div className="space-y-2">
              <Label>¿De quién es la deuda?</Label>
              <Select value={watch('debtOwner')} onValueChange={(v) => setValue('debtOwner', v as 'TALENT' | 'MINE')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TALENT">{etiquetas.talentDebe}</SelectItem>
                  <SelectItem value="MINE">{etiquetas.adminDebe}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {esDeuda ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ledger-debt">Deuda</Label>
                <MoneyField control={control} name="debtAmount" id="ledger-debt" />
                <p className="text-[11px] text-muted-foreground">Lo que el talento te debe.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ledger-pending">Falta pagar</Label>
                <MoneyField control={control} name="pendingAmount" id="ledger-pending" />
                <p className="text-[11px] text-muted-foreground">De esa deuda, cuánto sigue sin devolver.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="ledger-paid">Monto desembolsado</Label>
              <MoneyField control={control} name="paidAmount" id="ledger-paid" />
              <p className="text-[11px] text-muted-foreground">
                Lo que invertiste en esta persona. No se cobra, es gasto de MIMOTECH.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={watch('status')} onValueChange={(v) => setValue('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(esDeuda ? DEBT_STATUS_OPTIONS : STATUS_EGRESO).map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!esDeuda && (
              <p className="text-[11px] text-muted-foreground">
                El dinero ya salió. Marca "Se dio por perdido" solo si el talento se fue sin devolver nada.
              </p>
            )}
            {aviso && (
              <p className="flex items-start gap-1.5 text-[11px] text-warning">
                <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{aviso}</span>
              </p>
            )}
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
