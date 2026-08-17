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
import { apiFetch } from '@/lib/api';
import type { Application } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  provider: z.string().optional(),
  category: z.string().optional(),
  url: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  workspaceId: string;
  trigger?: ReactNode;
  application?: Application | null;
  onSaved?: (id: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ApplicationFormDialog({
  workspaceId,
  trigger,
  application,
  onSaved,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const queryClient = useQueryClient();
  const editing = !!application;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', provider: '', category: '', url: '' },
  });

  useEffect(() => {
    if (open && application) {
      reset({
        name: application.name,
        provider: application.provider ?? '',
        category: application.category ?? '',
        url: application.url ?? '',
      });
    }
  }, [open, application, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        workspaceId,
        name: values.name,
        provider: values.provider || undefined,
        category: values.category || undefined,
        url: values.url || undefined,
      };
      if (editing && application) {
        return apiFetch<Application>(`/applications/${application.id}?workspaceId=${workspaceId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
      return apiFetch<Application>('/applications', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.applications(workspaceId) });
      toast.success(editing ? 'Aplicación actualizada' : 'Aplicación creada');
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
          <DialogTitle>{editing ? 'Editar aplicación' : 'Nueva aplicación'}</DialogTitle>
          <DialogDescription>Aplicación o servicio de MIMOTECH asociado a tus gastos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Ej. Vercel, GitHub, Figma" {...register('name')} />
            <p className="text-muted-foreground text-xs">Cómo la reconoces tú al revisar los costos.</p>
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <CollapsibleSection label="Ver más opciones">
            <div className="space-y-2">
              <Label htmlFor="provider">Proveedor</Label>
              <Input id="provider" placeholder="Opcional" {...register('provider')} />
              <p className="text-muted-foreground text-xs">
                Quién te cobra, si no coincide con el nombre. Ej. la app es "Fly" y el proveedor "Fly.io".
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input id="url" placeholder="https://" {...register('url')} />
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
