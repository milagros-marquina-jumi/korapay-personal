'use client';

import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  workspaceId: string;
  keys?: readonly (readonly unknown[])[];
}

export function RefreshButton({ workspaceId, keys }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const cargando = useIsFetching({ queryKey: ['transactions', workspaceId] }) > 0;

  const refrescar = async () => {
    const objetivos = keys ?? [
      ['transactions', workspaceId],
      ['dashboard', workspaceId],
    ];
    await Promise.all(objetivos.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    toast.success('Datos actualizados');
  };

  return (
    <Button variant="outline" onClick={refrescar} disabled={cargando} aria-label="Actualizar datos">
      <RefreshCw className={cn('mr-2 h-4 w-4', cargando && 'animate-spin')} aria-hidden />
      Actualizar
    </Button>
  );
}
