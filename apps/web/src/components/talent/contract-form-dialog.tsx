'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
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
import { MoneyField } from '@/components/ui/money-input';
import { SearchSelect } from '@/components/ui/search-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { GlobalClient, GlobalCompany, TalentContract } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
  position: z.string().optional(),
  companyName: z.string().optional(),
  clientName: z.string().optional(),
  paymentType: z.enum(['Planilla', 'RxH', 'Transferencia']).optional(),
  rate: z.string().optional(),
  currency: z.enum(['PEN', 'USD']),
  startDate: z.string().min(1, 'Requerido'),
  endDate: z.string().optional(),
  status: z.enum(['ACTIVE', 'FINISHED']),
  contractTerm: z.string().optional(),
  notes: z.string().optional(),
});

export type ContractFormValues = z.infer<typeof schema>;

interface Props {
  contract?: TalentContract | null;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (values: ContractFormValues) => Promise<void> | void;
  isPending?: boolean;
}

export function TalentContractFormDialog({
  contract,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSubmit,
  isPending,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const editing = !!contract;

  const { data: companies } = useQuery({
    queryKey: queryKeys.globalCompanies(),
    queryFn: () => apiFetch<GlobalCompany[]>('/global-companies'),
    enabled: open,
  });
  const { data: clients } = useQuery({
    queryKey: queryKeys.globalClients(),
    queryFn: () => apiFetch<GlobalClient[]>('/global-clients'),
    enabled: open,
  });

  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'PEN', status: 'ACTIVE', startDate: new Date().toISOString().slice(0, 10) },
  });

  const empresaSel = (companies ?? []).find((c) => c.name === watch('companyName'));
  const opcionesCliente = useMemo(() => {
    const todos = clients ?? [];
    if (!empresaSel) return todos.map((c) => ({ value: c.name, label: c.name }));
    const suyos = todos.filter((c) => c.globalCompanyId === empresaSel.id);
    const resto = todos.filter((c) => c.globalCompanyId !== empresaSel.id);
    return [
      ...suyos.map((c) => ({ value: c.name, label: c.name, group: 'De esta empresa' })),
      ...resto.map((c) => ({ value: c.name, label: c.name, group: 'Otros clientes' })),
    ];
  }, [clients, empresaSel]);

  useEffect(() => {
    if (open && contract) {
      reset({
        position: contract.position ?? '',
        companyName: contract.companyName ?? '',
        clientName: contract.clientName ?? '',
        paymentType: (contract.paymentType as ContractFormValues['paymentType']) ?? undefined,
        rate: contract.rate ? Number(contract.rate).toString() : '',
        currency: (contract.currency as 'PEN' | 'USD') ?? 'PEN',
        startDate: contract.startDate.slice(0, 10),
        endDate: contract.endDate ? contract.endDate.slice(0, 10) : '',
        status: (contract.status as ContractFormValues['status']) ?? 'ACTIVE',
        contractTerm: contract.contractTerm ?? '',
        notes: contract.notes ?? '',
      });
    }
  }, [open, contract, reset]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar contrato' : 'Nuevo contrato'}</DialogTitle>
          <DialogDescription>Contrato del talento con empresa, cliente y sueldo.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(async (v) => {
            await onSubmit(v);
            if (!editing) reset();
            setOpen(false);
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <Input id="position" placeholder="Ej. Programador Frontend" {...register('position')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <SearchSelect
                placeholder="Selecciona empresa"
                searchPlaceholder="Buscar o escribir para crear..."
                value={watch('companyName') ?? ''}
                onValueChange={(v) => setValue('companyName', v)}
                options={(companies ?? []).map((c) => ({ value: c.name, label: c.name }))}
                onCreate={async (nombre) => {
                  await apiFetch<GlobalCompany>('/global-companies', {
                    method: 'POST',
                    body: JSON.stringify({ name: nombre }),
                  });
                  await queryClient.invalidateQueries({ queryKey: queryKeys.globalCompanies() });
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
                  await apiFetch<GlobalClient>('/global-clients', {
                    method: 'POST',
                    body: JSON.stringify({ name: nombre, globalCompanyId: empresaSel?.id }),
                  });
                  await queryClient.invalidateQueries({ queryKey: queryKeys.globalClients() });
                  setValue('clientName', nombre);
                  toast.success(`Cliente "${nombre}" creado`);
                }}
                createLabel="Crear cliente"
                clearable
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rate">Sueldo</Label>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <MoneyField control={control} name="rate" id="rate" />
                </div>
                <CurrencyToggle
                  value={(watch('currency') ?? 'PEN') as 'PEN' | 'USD'}
                  onChange={(v) => setValue('currency', v)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de pago</Label>
              <Select
                value={watch('paymentType') ?? ''}
                onValueChange={(v) => setValue('paymentType', v as ContractFormValues['paymentType'])}
              >
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Inicio</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={watch('status')}
                onValueChange={(v) => setValue('status', v as ContractFormValues['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="FINISHED">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <CollapsibleSection label="Ver más opciones">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="endDate">Fin</Label>
                <Input id="endDate" type="date" {...register('endDate')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractTerm">Plazo del contrato</Label>
              <Input id="contractTerm" placeholder="Ej. 6 meses luego indefinido" {...register('contractTerm')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" rows={2} placeholder="Detalle opcional" {...register('notes')} />
            </div>
          </CollapsibleSection>

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
