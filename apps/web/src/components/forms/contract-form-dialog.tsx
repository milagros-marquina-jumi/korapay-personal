'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { MoneyField } from '@/components/ui/money-input';
import { SearchSelect } from '@/components/ui/search-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { Company, EmploymentContract } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
  position: z.string().optional(),
  startDate: z.string().min(1, 'Requerido'),
  endDate: z.string().optional(),
  companyId: z.string().optional(),
  type: z.string().optional(),
  salary: z.string().optional(),
  currency: z.enum(['PEN', 'USD']),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  workspaceId: string;
  trigger?: ReactNode;
  contract?: EmploymentContract | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (id: string) => void;
}

export function ContractFormDialog({
  workspaceId,
  trigger,
  contract,
  open: controlledOpen,
  onOpenChange,
  onSaved,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const queryClient = useQueryClient();
  const editing = !!contract;

  const { data: companies } = useQuery({
    queryKey: queryKeys.companies(workspaceId),
    queryFn: () => apiFetch<Company[]>(`/companies?workspaceId=${workspaceId}`),
    enabled: open,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { position: '', startDate: new Date().toISOString().slice(0, 10), currency: 'PEN' },
  });

  useEffect(() => {
    if (open && contract) {
      reset({
        position: contract.position ?? '',
        startDate: contract.startDate.slice(0, 10),
        endDate: contract.endDate ? contract.endDate.slice(0, 10) : '',
        companyId: contract.companyId ?? undefined,
        type: contract.type ?? '',
        salary: contract.salary ? Number(contract.salary).toString() : '',
        currency: (contract.currency as 'PEN' | 'USD') ?? 'PEN',
        notes: contract.notes ?? '',
      });
    }
  }, [open, contract, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        workspaceId,
        position: values.position || undefined,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        companyId: values.companyId || undefined,
        type: values.type || undefined,
        salary: values.salary || undefined,
        currency: values.currency,
        notes: values.notes || undefined,
      };
      if (editing && contract) {
        return apiFetch<EmploymentContract>(`/employment-contracts/${contract.id}?workspaceId=${workspaceId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
      return apiFetch<EmploymentContract>('/employment-contracts', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employmentContracts(workspaceId) });
      toast.success(editing ? 'Contrato actualizado' : 'Contrato creado');
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
          <DialogTitle>{editing ? 'Editar contrato' : 'Nuevo contrato'}</DialogTitle>
          <DialogDescription>Contrato laboral con empresa, periodo y salario.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label>Empresa</Label>
            <SearchSelect
              placeholder="Selecciona empresa"
              searchPlaceholder="Buscar empresa..."
              value={watch('companyId') ?? ''}
              onValueChange={(v) => setValue('companyId', v)}
              options={(companies ?? []).map((c) => ({ value: c.id, label: c.name }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <Input id="position" placeholder="Ej. Desarrollador Fullstack" {...register('position')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Inicio</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fin</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
              <p className="text-xs text-muted-foreground">Vacío si el contrato sigue activo</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="salary">Salario</Label>
              <MoneyField control={control} name="salary" id="salary" />
            </div>
            <div className="space-y-2">
              <Label>Tipo de pago</Label>
              <Select value={watch('type') ?? ''} onValueChange={(v) => setValue('type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planilla">Planilla</SelectItem>
                  <SelectItem value="RxH">RxH</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <CollapsibleSection label="Ver más opciones">
            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" rows={2} placeholder="Detalle opcional" {...register('notes')} />
            </div>
          </CollapsibleSection>

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
