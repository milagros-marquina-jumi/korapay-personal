'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { Talent } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  email: z.string().email('Correo invalido').optional().or(z.literal('')),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type FormValues = z.infer<typeof schema>;

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function NewTalentDialog({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', status: 'ACTIVE' },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiFetch('/talents', { method: 'POST', body: JSON.stringify({ ...values, workspaceId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talents(workspaceId) });
      toast.success('Talento creado');
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo talento</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo talento</DialogTitle>
          <DialogDescription>Registra un talento del equipo Mimotalents.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" placeholder="Opcional" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" placeholder="Opcional" {...register('phone')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select defaultValue="ACTIVE" onValueChange={(v) => setValue('status', v as FormValues['status'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="INACTIVE">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

export default function MimotalentsPage() {
  const { activeWorkspaceId } = useWorkspace();

  const { data: talents, isLoading } = useQuery({
    queryKey: queryKeys.talents(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Talent[]>(`/talents?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mimotalents"
        description="Gestion de talentos y contratos"
        action={activeWorkspaceId ? <NewTalentDialog workspaceId={activeWorkspaceId} /> : null}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : talents?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {talents.map((talent) => (
            <Link key={talent.id} href={`/mimotalents/${talent.id}`} className="block">
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-5">
                  <Avatar className="size-12">
                    <AvatarFallback className="bg-brand-soft text-brand">{initials(talent.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium">{talent.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={talent.status} />
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        {talent.contracts?.length ?? 0} contratos
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="No hay talentos registrados"
          description="Crea el primer talento del equipo Mimotalents."
        />
      )}
    </div>
  );
}
