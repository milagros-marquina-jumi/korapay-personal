'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { formatMoney } from '@korapay/domain';
import { EmptyState } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
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

function AccountFormDialog({ workspaceId }: { workspaceId: string }) {
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
    defaultValues: {
      name: '',
      bank: '',
      kind: 'SAVINGS',
      currency: 'PEN',
      initialBalance: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiFetch('/accounts', { method: 'POST', body: JSON.stringify({ ...values, workspaceId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts(workspaceId) });
      toast.success('Cuenta creada');
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nueva cuenta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cuenta</DialogTitle>
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
              <Select defaultValue="SAVINGS" onValueChange={(v) => setValue('kind', v as FormValues['kind'])}>
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
              <Select defaultValue="PEN" onValueChange={(v) => setValue('currency', v as 'PEN' | 'USD')}>
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

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.accounts(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Account[]>(`/accounts?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuentas"
        description="Tus cuentas bancarias, tarjetas y billeteras"
        action={activeWorkspaceId ? <AccountFormDialog workspaceId={activeWorkspaceId} /> : null}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((account) => (
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
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold tabular-nums">
                  {formatMoney(account.initialBalance, account.currency as 'PEN' | 'USD')}
                </p>
                {account.lastFour && <p className="text-sm text-muted-foreground">····{account.lastFour}</p>}
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
    </div>
  );
}
