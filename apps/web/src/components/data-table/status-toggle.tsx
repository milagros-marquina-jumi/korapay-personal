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

const STATUS_OPTIONS = [
  { value: 'PAID', label: 'Pagado' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PARTIAL', label: 'Parcial' },
  { value: 'OVERDUE', label: 'Vencido' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

interface StatusToggleProps {
  transactionId: string;
  workspaceId: string;
  status: string;
  onChanged?: () => void;
}

export function StatusToggle({ transactionId, workspaceId, status, onChanged }: StatusToggleProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (next: string) =>
      apiFetch(`/transactions/${transactionId}/status?workspaceId=${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify({ status: next }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', workspaceId] });
      toast.success('Estado actualizado');
      onChanged?.();
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
