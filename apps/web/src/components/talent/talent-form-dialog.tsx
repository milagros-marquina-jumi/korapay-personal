'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { Talent } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { estadoEsperado, primerContrato, type TalentDateIssue, validarFechasTalento } from '@/lib/talent-dates';

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  terminationReason: z.enum(['FRAUD', 'ENDED', 'RESIGNED', 'OTHER']).optional().or(z.literal('')),
  role: z.string().optional(),
  startedWithMeAt: z.string().optional(),
  endedWithMeAt: z.string().optional(),
  firstJobAt: z.string().optional(),
  studyPlace: z.string().optional(),
  studyStartAt: z.string().optional(),
  studyEndAt: z.string().optional(),
  slideUrl: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Activo', INACTIVE: 'Inactivo' };
export const TERMINATION_LABELS: Record<string, string> = {
  FRAUD: 'Fraude',
  ENDED: 'Finalizó contrato',
  RESIGNED: 'Renunció',
  OTHER: 'Otro',
};

function Aviso({ issues, field }: Readonly<{ issues: TalentDateIssue[]; field: TalentDateIssue['field'] }>) {
  const propio = issues.filter((i) => i.field === field);
  if (!propio.length) return null;
  return (
    <>
      {propio.map((i) => (
        <p key={i.message} className="flex items-start gap-1.5 text-[11px] text-warning">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{i.message}</span>
        </p>
      ))}
    </>
  );
}

export function TalentFormDialog({
  workspaceId,
  talent,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onCreated,
}: {
  workspaceId: string;
  talent?: Talent | null;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: (id: string) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const editing = !!talent;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', status: 'ACTIVE' },
  });

  const contratoMasAntiguo = primerContrato(talent?.contracts);
  const issues = validarFechasTalento({
    status: watch('status'),
    startedWithMeAt: watch('startedWithMeAt'),
    endedWithMeAt: watch('endedWithMeAt'),
    firstJobAt: contratoMasAntiguo ?? watch('firstJobAt'),
    contracts: talent?.contracts,
  });

  useEffect(() => {
    if (open && talent) {
      reset({
        name: talent.name,
        status: (talent.status as FormValues['status']) ?? 'ACTIVE',
        terminationReason: (talent.terminationReason as FormValues['terminationReason']) ?? '',
        role: talent.role ?? '',
        startedWithMeAt: talent.startedWithMeAt ? talent.startedWithMeAt.slice(0, 10) : '',
        endedWithMeAt: talent.endedWithMeAt ? talent.endedWithMeAt.slice(0, 10) : '',
        firstJobAt: talent.firstJobAt ? talent.firstJobAt.slice(0, 10) : '',
        studyPlace: talent.studyPlace ?? '',
        studyStartAt: talent.studyStartAt ? talent.studyStartAt.slice(0, 10) : '',
        studyEndAt: talent.studyEndAt ? talent.studyEndAt.slice(0, 10) : '',
        slideUrl: talent.slideUrl ?? '',
        email: talent.email ?? '',
        phone: talent.phone ?? '',
        notes: talent.notes ?? '',
      });
    }
  }, [open, talent, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        workspaceId,
        name: values.name,
        status: estadoEsperado(values.endedWithMeAt) === 'INACTIVE' ? 'INACTIVE' : values.status,
        terminationReason: values.terminationReason || undefined,
        role: values.role || undefined,
        startedWithMeAt: values.startedWithMeAt || undefined,
        endedWithMeAt: values.endedWithMeAt || undefined,
        firstJobAt: contratoMasAntiguo ?? values.firstJobAt ?? undefined,
        studyPlace: values.studyPlace || undefined,
        studyStartAt: values.studyStartAt || undefined,
        studyEndAt: values.studyEndAt || undefined,
        slideUrl: values.slideUrl || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        notes: values.notes || undefined,
      };
      if (editing && talent) {
        return apiFetch<Talent>(`/talents/${talent.id}?workspaceId=${workspaceId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
      return apiFetch<Talent>('/talents', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talents(workspaceId) });
      toast.success(editing ? 'Talento actualizado' : 'Talento creado');
      if (!editing && created?.id) onCreated?.(created.id);
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
          <DialogTitle>{editing ? 'Editar talento' : 'Nuevo talento'}</DialogTitle>
          <DialogDescription>Talento tercerizado de MIMOTECH.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" placeholder="Nombre del talento" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                defaultValue={talent?.status ?? 'ACTIVE'}
                onValueChange={(v) => setValue('status', v as FormValues['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="INACTIVE">Inactivo</SelectItem>
                </SelectContent>
              </Select>
              <Aviso issues={issues} field="status" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Input id="role" placeholder="Ej. Programadora, RRHH" {...register('role')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startedWithMeAt">Inicio conmigo</Label>
              <Input id="startedWithMeAt" type="date" {...register('startedWithMeAt')} />
              <p className="text-[11px] text-muted-foreground">Desde cuándo forma parte de MimoTalents.</p>
              <Aviso issues={issues} field="startedWithMeAt" />
            </div>
          </div>

          <CollapsibleSection label="Ver más datos">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstJobAt">Inicio primer trabajo</Label>
                {contratoMasAntiguo ? (
                  <Input id="firstJobAt" type="date" value={contratoMasAntiguo} readOnly className="bg-muted/50" />
                ) : (
                  <Input id="firstJobAt" type="date" {...register('firstJobAt')} />
                )}
                <p className="text-[11px] text-muted-foreground">
                  {contratoMasAntiguo
                    ? 'Sale de su contrato más antiguo, no se escribe a mano.'
                    : 'Solo mientras no tenga contratos: al registrar uno, se toma su fecha.'}
                </p>
                <Aviso issues={issues} field="firstJobAt" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endedWithMeAt">Fin conmigo</Label>
                <Input id="endedWithMeAt" type="date" {...register('endedWithMeAt')} />
                <p className="text-[11px] text-muted-foreground">
                  Vacío mientras siga contigo. Al ponerla, el estado pasa a inactivo.
                </p>
                <Aviso issues={issues} field="endedWithMeAt" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="studyPlace">Lugar de estudio</Label>
                <Input id="studyPlace" placeholder="Ej. Cibertec, ISIL" {...register('studyPlace')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studyStartAt">Inicio de estudios</Label>
                <Input id="studyStartAt" type="date" {...register('studyStartAt')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="studyEndAt">Fin de estudios</Label>
                <Input id="studyEndAt" type="date" {...register('studyEndAt')} />
              </div>
              {watch('status') === 'INACTIVE' && (
                <div className="space-y-2">
                  <Label>Motivo de baja</Label>
                  <Select
                    value={watch('terminationReason') || ''}
                    onValueChange={(v) => setValue('terminationReason', v as FormValues['terminationReason'])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TERMINATION_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slideUrl">Diapositiva (Canva)</Label>
              <Input id="slideUrl" placeholder="https://www.canva.com/..." {...register('slideUrl')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="Opcional" {...register('email')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" placeholder="Opcional" {...register('phone')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" rows={3} placeholder="Notas sobre el talento" {...register('notes')} />
            </div>
          </CollapsibleSection>

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
