'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardPaste } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { SchedulePasteField, scheduleToPayload, useParsedSchedule } from '@/components/forms/schedule-paste-field';
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
import { apiFetch } from '@/lib/api';
import type { TaxObligation } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

interface Props {
  workspaceId: string;
  obligation: TaxObligation;
}

export function RentaSchedulePaste({ workspaceId, obligation }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState('');
  const queryClient = useQueryClient();
  const { rows, warnings } = useParsedSchedule(texto);

  const guardar = useMutation({
    mutationFn: () =>
      apiFetch<TaxObligation>(`/tax-obligations/${obligation.id}?workspaceId=${workspaceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ schedule: scheduleToPayload(rows) }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taxObligations(workspaceId) });
      toast.success(`Cronograma cargado: ${rows.length} cuotas.`);
      setTexto('');
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ClipboardPaste className="mr-2 size-4" />
          Pegar cronograma
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Pegar cronograma de SUNAT</DialogTitle>
          <DialogDescription>
            Copia el cuadro de cuotas de tu resolución de SUNAT (Anexo N.º 2) y pégalo aquí. Puedes pegarlo tal cual
            sale del PDF, de una tabla o de Excel.
          </DialogDescription>
        </DialogHeader>

        <SchedulePasteField texto={texto} onTextoChange={setTexto} rows={rows} warnings={warnings} />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={!rows.length || guardar.isPending} onClick={() => guardar.mutate()}>
            {guardar.isPending ? 'Guardando…' : `Cargar ${rows.length || ''} cuotas`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
