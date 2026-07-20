'use client';
import { formatMoney } from '@korapay/domain';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, PiggyBank, Plus, Wallet } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Account {
  id: string;
  name: string;
  bank: string;
  kind: string;
  currency: string;
  lastFour?: string;
  initialBalance: string;
  emoji?: string;
  color?: string;
}
const kindIcons: Record<string, typeof CreditCard> = {
  SAVINGS: PiggyBank,
  CHECKING: Wallet,
  CREDIT_CARD: CreditCard,
  CASH: Wallet,
};
export default function CuentasPage() {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiFetch<Account[]>('/accounts?workspaceId=personal'),
  });
  return (
    <div className="space-y-6">
      {' '}
      <div className="flex items-center justify-between">
        {' '}
        <div>
          {' '}
          <h1 className="font-display text-2xl font-bold">Cuentas</h1>{' '}
          <p className="text-sm text-muted-foreground">Tus bancos y cuentas</p>{' '}
        </div>{' '}
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {' '}
          <Plus className="h-4 w-4" /> Nueva Cuenta{' '}
        </button>{' '}
      </div>{' '}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {' '}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
          ))}{' '}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {' '}
          {accounts?.map((account) => {
            const Icon = kindIcons[account.kind] ?? CreditCard;
            return (
              <div
                key={account.id}
                className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                {' '}
                <div className="flex items-start justify-between">
                  {' '}
                  <div className="flex items-center gap-3">
                    {' '}
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${account.color ?? 'bg-muted'}`}
                    >
                      {' '}
                      <Icon className="h-5 w-5" />{' '}
                    </div>{' '}
                    <div>
                      {' '}
                      <h3 className="font-medium">{account.name}</h3>{' '}
                      <p className="text-xs text-muted-foreground">{account.bank}</p>{' '}
                    </div>{' '}
                  </div>{' '}
                </div>{' '}
                <div className="mt-4">
                  {' '}
                  <p className="font-display text-xl font-bold">
                    {formatMoney(account.initialBalance, account.currency as 'PEN' | 'USD')}
                  </p>{' '}
                  {account.lastFour && (
                    <p className="mt-1 text-xs text-muted-foreground">****{account.lastFour}</p>
                  )}{' '}
                </div>{' '}
              </div>
            );
          })}{' '}
        </div>
      )}{' '}
    </div>
  );
}
