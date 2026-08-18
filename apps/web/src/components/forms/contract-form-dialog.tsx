'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { MultiSelectCreatable } from '@/components/ui/multi-select-creatable';
import { SearchSelect } from '@/components/ui/search-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { Company, EmploymentContract } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useGlobalCatalog } from '@/lib/use-global-catalog';
import { formatDate } from '@/lib/utils';

const schema = z
  .object({
    position: z.string().optional(),
    startDate: z.string().min(1, 'Requerido'),
    endDate: z.string().optional(),
    companyId: z.string().optional(),
    type: z.string().optional(),
    salary: z.string().optional(),
    currency: z.enum(['PEN', 'USD']),
    notes: z.string().optional(),
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, {
    path: ['endDate'],
    message: 'La fecha de fin no puede ser anterior a la de inicio',
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

  const { companies: globalCompanies, clientOptionsFor } = useGlobalCatalog({ enabled: open, valueBy: 'id' });

  const { data: contratos } = useQuery({
    queryKey: queryKeys.employmentContracts(workspaceId),
    queryFn: () => apiFetch<EmploymentContract[]>(`/employment-contracts?workspaceId=${workspaceId}`),
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

  const companyIdSeleccionada = watch('companyId');
  const previos = useMemo(
    () =>
      (contratos ?? [])
        .filter((c) => c.companyId === companyIdSeleccionada && c.id !== contract?.id)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [contratos, companyIdSeleccionada, contract?.id],
  );

  const [clientIds, setClientIds] = useState<string[]>([]);
  const [nuevosClientes, setNuevosClientes] = useState<string[]>([]);

  const empresaSel = (companies ?? []).find((c) => c.id === companyIdSeleccionada);
  const globalCompanyId =
    empresaSel?.globalCompanyId ??
    (globalCompanies ?? []).find((g) => g.name.toLowerCase() === (empresaSel?.name ?? '').toLowerCase())?.id ??
    null;

  const opcionesCliente = clientOptionsFor(globalCompanyId);

  const inicioElegido = watch('startDate');
  const posicionNueva = previos.filter((c) => c.startDate.slice(0, 10) < (inicioElegido ?? '')).length + 1;

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
      setClientIds((contract.clients ?? []).map((c) => c.id));
      setNuevosClientes([]);
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
        clientIds,
        newClientNames: nuevosClientes,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.globalClients() });
      queryClient.invalidateQueries({ queryKey: queryKeys.globalCompanies() });
      if (!editing && result?.id) onSaved?.(result.id);
      reset();
      setClientIds([]);
      setNuevosClientes([]);
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
              searchPlaceholder="Buscar o escribir para crear..."
              value={watch('companyId') ?? ''}
              onValueChange={(v) => setValue('companyId', v)}
              options={(companies ?? []).map((c) => ({ value: c.id, label: c.name }))}
              onCreate={async (nombre) => {
                const creada = await apiFetch<Company>('/companies', {
                  method: 'POST',
                  body: JSON.stringify({ workspaceId, name: nombre }),
                });
                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: queryKeys.companies(workspaceId) }),
                  queryClient.invalidateQueries({ queryKey: queryKeys.globalCompanies() }),
                ]);
                setValue('companyId', creada.id);
                toast.success(`Empresa "${nombre}" creada`);
              }}
              createLabel="Crear empresa"
            />
            {previos.length > 0 && (
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="font-medium text-xs">
                  Ya tienes {previos.length} {previos.length === 1 ? 'contrato' : 'contratos'} con esta empresa
                </p>
                <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                  {previos.map((c) => (
                    <li key={c.id} className="tabular-nums">
                      {formatDate(c.startDate)} — {c.endDate ? formatDate(c.endDate) : 'sigue activo'}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Este será el contrato {posicionNueva} de {previos.length + 1}. Se ordenan solos por fecha de inicio,
                  no hace falta numerarlos en el cargo.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Clientes</Label>
            <MultiSelectCreatable
              options={opcionesCliente}
              selected={clientIds}
              onChange={setClientIds}
              nuevos={nuevosClientes}
              onNuevosChange={setNuevosClientes}
              placeholder="Sin clientes"
              searchPlaceholder="Buscar o escribir para crear..."
            />
            <p className="text-[11px] text-muted-foreground">
              Los clientes nuevos se guardan también en el catálogo global de la empresa.
            </p>
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
              {errors.endDate ? (
                <p className="text-xs text-destructive">{errors.endDate.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Vacío si el contrato sigue activo</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="salary">Salario</Label>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <MoneyField control={control} name="salary" id="salary" />
                </div>
                <CurrencyToggle value={watch('currency')} onChange={(v) => setValue('currency', v)} />
              </div>
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
