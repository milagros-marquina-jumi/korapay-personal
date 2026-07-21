'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { Profile } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { profileInitials, useProfile } from '@/lib/use-profile';

const schema = z.object({
  name: z.string().min(1, 'Requerido').max(80),
  email: z.string().email('Correo inválido'),
});

type FormValues = z.infer<typeof schema>;

export default function PerfilPage() {
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '' },
  });

  useEffect(() => {
    if (profile) reset({ name: profile.name, email: profile.email });
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiFetch<Profile>('/profile', { method: 'PATCH', body: JSON.stringify(values) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.profile(), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
      toast.success('Perfil actualizado');
      reset({ name: updated.name, email: updated.email });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Mi perfil" description="Tu información personal" />

      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading || !profile ? (
            <Skeleton className="h-40 w-full rounded-xl" />
          ) : (
            <>
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarFallback className="bg-brand-soft text-xl font-semibold text-brand">
                    {profileInitials(profile.name) || 'KP'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-display text-lg font-semibold">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="max-w-md space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" placeholder="Tu nombre completo" {...register('name')} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo</Label>
                  <Input id="email" type="email" placeholder="tucorreo@ejemplo.com" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <Button type="submit" disabled={mutation.isPending || !isDirty}>
                  {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
