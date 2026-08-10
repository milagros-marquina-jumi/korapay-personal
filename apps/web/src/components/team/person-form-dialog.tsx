'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyInput } from '@/components/ui/money-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Person } from '@/lib/api.types';

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  role: z.string().optional(),
  salary: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export type PersonFormValues = z.infer<typeof schema>;

interface Props {
  person?: Person | null;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (values: PersonFormValues) => Promise<void>;
  isPending?: boolean;
}

export function PersonFormDialog({ person, trigger, open: controlledOpen, onOpenChange, onSubmit, isPending }: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const editing = !!person;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', status: 'ACTIVE' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: person?.name ?? '',
        role: person?.role ?? '',
        salary: person?.salary ? Number(person.salary).toString() : '',
        status: (person?.status as 'ACTIVE' | 'INACTIVE') ?? 'ACTIVE',
        email: person?.email ?? '',
        phone: person?.phone ?? '',
        notes: person?.notes ?? '',
      });
    }
  }, [open, person, reset]);

  const submit = async (values: PersonFormValues) => {
    await onSubmit(values);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar miembro' : 'Nuevo miembro'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Ej. Fernando Luis" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Input id="role" placeholder="Ej. Desarrollador" {...register('role')} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={watch('status')}
                onValueChange={(v) => setValue('status', v as PersonFormValues['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="INACTIVE">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">Salario / tarifa de referencia</Label>
            <MoneyInput id="salary" value={watch('salary') ?? ''} onValueChange={(raw) => setValue('salary', raw)} />
          </div>

          <CollapsibleSection label="Ver más opciones">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" placeholder="Opcional" {...register('email')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" placeholder="Opcional" {...register('phone')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" rows={2} placeholder="Detalle opcional" {...register('notes')} />
            </div>
          </CollapsibleSection>

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
