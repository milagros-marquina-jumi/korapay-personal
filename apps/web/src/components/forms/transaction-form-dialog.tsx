'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { Account, Category } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'SAVING', 'BUSINESS_COST', 'TEAM_PAYMENT']),
  concept: z.string().min(1, 'Requerido'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido'),
  currency: z.enum(['PEN', 'USD']),
  date: z.string().min(1, 'Requerido'),
  status: z.enum(['PAID', 'PENDING', 'OVERDUE', 'PARTIAL']),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  workspaceId: string;
  defaultType?: FormValues['type'];
  trigger: ReactNode;
  onCreated?: (id: string) => void;
}

export function TransactionFormDialog({ workspaceId, defaultType = 'EXPENSE', trigger, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories(workspaceId),
    queryFn: () => apiFetch<Category[]>(`/categories?workspaceId=${workspaceId}`),
    enabled: open,
  });
  const { data: accounts } = useQuery({
    queryKey: queryKeys.accounts(workspaceId),
    queryFn: () => apiFetch<Account[]>(`/accounts?workspaceId=${workspaceId}`),
    enabled: open,
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
      currency: 'PEN',
      date: new Date().toISOString().slice(0, 10),
      status: 'PAID',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiFetch<{ id: string }>('/transactions', { method: 'POST', body: JSON.stringify({ ...values, workspaceId }) }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', workspaceId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(workspaceId) });
      toast.success('Movimiento creado');
      if (created?.id) onCreated?.(created.id);
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo movimiento</DialogTitle>
          <DialogDescription>Registra un ingreso, egreso u otro movimiento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select defaultValue={defaultType} onValueChange={(v) => setValue('type', v as FormValues['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Ingreso</SelectItem>
                  <SelectItem value="EXPENSE">Egreso</SelectItem>
                  <SelectItem value="SAVING">Ahorro</SelectItem>
                  <SelectItem value="BUSINESS_COST">Costo Mimotech</SelectItem>
                  <SelectItem value="TEAM_PAYMENT">Pago equipo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" type="date" {...register('date')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concept">Concepto</Label>
            <Input id="concept" {...register('concept')} />
            {errors.concept && <p className="text-xs text-destructive">{errors.concept.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input id="amount" inputMode="decimal" placeholder="0.00" {...register('amount')} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select defaultValue="PEN" onValueChange={(v) => setValue('currency', v as 'PEN' | 'USD')}>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select onValueChange={(v) => setValue('categoryId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cuenta</Label>
              <Select onValueChange={(v) => setValue('accountId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" rows={2} placeholder="Detalle opcional del movimiento" {...register('notes')} />
          </div>

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
