'use client';

import { StatusBadge } from '@korapay/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';

const STATUS_OPTIONS = [
  { value: 'PAID', label: 'Pagado' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PARTIAL', label: 'Parcial' },
  { value: 'OVERDUE', label: 'Vencido' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

interface TaxStatusToggleProps {
  obligationId: string;
  workspaceId: string;
  status: string;
}

export function TaxStatusToggle({ obligationId, workspaceId, status }: TaxStatusToggleProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (next: string) =>
      apiFetch(`/tax-obligations/${obligationId}?workspaceId=${workspaceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taxObligations(workspaceId) });
      toast.success('Estado actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="rounded-md transition-opacity hover:opacity-80" aria-label="Cambiar estado">
          <StatusBadge status={status} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            disabled={option.value === status || mutation.isPending}
            onSelect={(e) => {
              e.preventDefault();
              if (option.value !== status) mutation.mutate(option.value);
            }}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
