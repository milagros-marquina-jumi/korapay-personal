'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { formatMoney } from '@korapay/domain';
import { EmptyState } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { PageHeader } from '@/components/layout/page-header';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { Account } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const kindLabels: Record<string, string> = {
  SAVINGS: 'Ahorros',
  CHECKING: 'Corriente',
  CREDIT_CARD: 'Tarjeta credito',
  CASH: 'Efectivo',
  DIGITAL_WALLET: 'Billetera digital',
  PAYPAL: 'PayPal',
};

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  bank: z.string().min(1, 'Requerido'),
  kind: z.enum(['SAVINGS', 'CHECKING', 'CREDIT_CARD', 'CASH', 'DIGITAL_WALLET', 'PAYPAL']),
  currency: z.enum(['PEN', 'USD']),
  initialBalance: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto invalido'),
});

type FormValues = z.infer<typeof schema>;

function AccountFormDialog({
  workspaceId,
  account,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  workspaceId: string;
  account?: Account;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const queryClient = useQueryClient();
  const isEdit = !!account;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: account?.name ?? '',
      bank: account?.bank ?? '',
      kind: (account?.kind as FormValues['kind']) ?? 'SAVINGS',
      currency: (account?.currency as 'PEN' | 'USD') ?? 'PEN',
      initialBalance: account?.initialBalance ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? apiFetch(`/accounts/${account.id}?workspaceId=${workspaceId}`, {
            method: 'PATCH',
            body: JSON.stringify(values),
          })
        : apiFetch('/accounts', { method: 'POST', body: JSON.stringify({ ...values, workspaceId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts(workspaceId) });
      toast.success(isEdit ? 'Cuenta actualizada' : 'Cuenta creada');
      if (!isEdit) reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>Nueva cuenta</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar cuenta' : 'Nueva cuenta'}</DialogTitle>
          <DialogDescription>Registra una cuenta bancaria, tarjeta o billetera.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank">Banco</Label>
            <Input id="bank" {...register('bank')} />
            {errors.bank && <p className="text-xs text-destructive">{errors.bank.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                defaultValue={account?.kind ?? 'SAVINGS'}
                onValueChange={(v) => setValue('kind', v as FormValues['kind'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAVINGS">Ahorros</SelectItem>
                  <SelectItem value="CHECKING">Corriente</SelectItem>
                  <SelectItem value="CREDIT_CARD">Tarjeta credito</SelectItem>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                  <SelectItem value="DIGITAL_WALLET">Billetera digital</SelectItem>
                  <SelectItem value="PAYPAL">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Moneda</Label>
              <Select
                defaultValue={account?.currency ?? 'PEN'}
                onValueChange={(v) => setValue('currency', v as 'PEN' | 'USD')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEN">Soles (S/)</SelectItem>
                  <SelectItem value="USD">Dolares ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialBalance">Saldo inicial</Label>
            <Input id="initialBalance" inputMode="decimal" placeholder="0.00" {...register('initialBalance')} />
            {errors.initialBalance && <p className="text-xs text-destructive">{errors.initialBalance.message}</p>}
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

export default function CuentasPage() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Account | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.accounts(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Account[]>(`/accounts?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/accounts/${id}?workspaceId=${activeWorkspaceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts(activeWorkspaceId ?? '') });
      toast.success('Cuenta eliminada');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const accounts = useMemo(() => {
    const all = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((a) => `${a.name} ${a.bank}`.toLowerCase().includes(q));
  }, [data, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuentas"
        description="Tus cuentas bancarias, tarjetas y billeteras"
        action={activeWorkspaceId ? <AccountFormDialog workspaceId={activeWorkspaceId} /> : null}
      />

      <DataTableToolbar search={search} onSearchChange={setSearch} placeholder="Buscar cuentas..." />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : accounts.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {account.emoji && <span className="text-2xl">{account.emoji}</span>}
                  <div>
                    <CardTitle className="text-base">{account.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{account.bank}</p>
                  </div>
                </div>
                <Badge variant="secondary">{kindLabels[account.kind] ?? account.kind}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-2xl font-bold tabular-nums">
                  {formatMoney(account.initialBalance, account.currency as 'PEN' | 'USD')}
                </p>
                {account.lastFour && <p className="text-sm text-muted-foreground">····{account.lastFour}</p>}
                <div className="flex justify-end gap-1">
                  <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => setEditing(account)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Eliminar"
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Eliminar cuenta',
                        description: `Se archivara "${account.name}". Los movimientos asociados se conservan.`,
                        confirmLabel: 'Eliminar',
                        destructive: true,
                      });
                      if (ok) removeMutation.mutate(account.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sin cuentas"
          description="Aun no tienes cuentas registradas. Crea la primera para empezar."
          action={activeWorkspaceId ? <AccountFormDialog workspaceId={activeWorkspaceId} /> : undefined}
        />
      )}

      {editing && activeWorkspaceId && (
        <AccountFormDialog
          workspaceId={activeWorkspaceId}
          account={editing}
          open
          onOpenChange={(next) => {
            if (!next) setEditing(null);
          }}
          trigger={<span className="hidden" />}
        />
      )}
    </div>
  );
}
