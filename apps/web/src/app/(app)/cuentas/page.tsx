'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { formatMoney } from '@korapay/domain';
import { EmptyState } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  CreditCard,
  Landmark,
  type LucideIcon,
  Pencil,
  PiggyBank,
  Smartphone,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { PageHeader } from '@/components/layout/page-header';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { IconAction } from '@/components/ui/icon-action';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { Account } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { cn } from '@/lib/utils';

const kindLabels: Record<string, string> = {
  SAVINGS: 'Ahorros',
  CHECKING: 'Corriente',
  CREDIT_CARD: 'Tarjeta crédito',
  CASH: 'Efectivo',
  DIGITAL_WALLET: 'Billetera digital',
  PAYPAL: 'PayPal',
};

const kindIcons: Record<string, LucideIcon> = {
  SAVINGS: PiggyBank,
  CHECKING: Landmark,
  CREDIT_CARD: CreditCard,
  CASH: Banknote,
  DIGITAL_WALLET: Smartphone,
  PAYPAL: Wallet,
};

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  bank: z.string().min(1, 'Requerido'),
  kind: z.enum(['SAVINGS', 'CHECKING', 'CREDIT_CARD', 'CASH', 'DIGITAL_WALLET', 'PAYPAL']),
  currency: z.enum(['PEN', 'USD']),
  initialBalance: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido'),
});

type FormValues = z.infer<typeof schema>;

function AccountFormDialog({
  workspaceId,
  account,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onCreated,
}: {
  workspaceId: string;
  account?: Account;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: (id: string) => void;
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
        ? apiFetch<Account>(`/accounts/${account.id}?workspaceId=${workspaceId}`, {
            method: 'PATCH',
            body: JSON.stringify(values),
          })
        : apiFetch<Account>('/accounts', { method: 'POST', body: JSON.stringify({ ...values, workspaceId }) }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts(workspaceId) });
      toast.success(isEdit ? 'Cuenta actualizada' : 'Cuenta creada');
      if (!isEdit) {
        reset();
        if (created?.id) onCreated?.(created.id);
      }
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
            <Input id="name" placeholder="Ej. Cuenta sueldo, Tarjeta Visa" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank">Banco</Label>
            <Input id="bank" placeholder="Ej. BCP, IBK, BBVA" {...register('bank')} />
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
                  <SelectItem value="CREDIT_CARD">Tarjeta crédito</SelectItem>
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
                  <SelectItem value="USD">Dólares ($)</SelectItem>
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
  const { markNew, highlightClass } = useHighlightNew();
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState(FILTER_ALL);
  const [currencyFilter, setCurrencyFilter] = useState(FILTER_ALL);
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

  const kindOptions = Object.entries(kindLabels).map(([value, label]) => ({ value, label }));

  const accounts = useMemo(() => {
    const all = data ?? [];
    const q = search.trim().toLowerCase();
    return all.filter(
      (a) =>
        (!q || `${a.name} ${a.bank}`.toLowerCase().includes(q)) &&
        (kindFilter === FILTER_ALL || a.kind === kindFilter) &&
        (currencyFilter === FILTER_ALL || a.currency === currencyFilter),
    );
  }, [data, search, kindFilter, currencyFilter]);

  const hasFilters = search !== '' || kindFilter !== FILTER_ALL || currencyFilter !== FILTER_ALL;

  const clearFilters = () => {
    setSearch('');
    setKindFilter(FILTER_ALL);
    setCurrencyFilter(FILTER_ALL);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuentas"
        description="Tus cuentas bancarias, tarjetas y billeteras"
        action={activeWorkspaceId ? <AccountFormDialog workspaceId={activeWorkspaceId} onCreated={markNew} /> : null}
      />

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar cuentas..."
        showClear={hasFilters}
        onClear={clearFilters}
        filters={
          <>
            <FilterSelect
              value={kindFilter}
              onValueChange={setKindFilter}
              options={kindOptions}
              placeholder="Tipo"
              allLabel="Todo tipo"
            />
            <FilterSelect
              value={currencyFilter}
              onValueChange={setCurrencyFilter}
              options={[
                { value: 'PEN', label: 'Soles' },
                { value: 'USD', label: 'Dólares' },
              ]}
              placeholder="Moneda"
              allLabel="Toda moneda"
            />
          </>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : accounts.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const KindIcon = kindIcons[account.kind] ?? Wallet;
            return (
              <Card key={account.id} className={cn('p-5', highlightClass(account.id))}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <KindIcon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-base font-semibold">{account.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{account.bank}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <IconAction icon={Pencil} label="Editar" onClick={() => setEditing(account)} />
                    <IconAction
                      icon={Trash2}
                      label="Eliminar"
                      destructive
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Eliminar cuenta',
                          description: `Se archivará "${account.name}". Los movimientos asociados se conservan.`,
                          confirmLabel: 'Eliminar',
                          destructive: true,
                        });
                        if (ok) removeMutation.mutate(account.id);
                      }}
                    />
                  </div>
                </div>
                <p className="mt-4 font-display text-2xl font-bold tabular-nums">
                  {formatMoney(account.initialBalance, account.currency as 'PEN' | 'USD')}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary">{kindLabels[account.kind] ?? account.kind}</Badge>
                  <Badge variant="outline">{account.currency}</Badge>
                  {account.lastFour && (
                    <span className="ml-auto text-sm text-muted-foreground tabular-nums">····{account.lastFour}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Sin cuentas"
          description="Aún no tienes cuentas registradas. Crea la primera para empezar."
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
