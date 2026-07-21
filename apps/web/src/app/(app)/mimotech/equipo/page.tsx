'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import { Plus, Users, Wallet } from 'lucide-react';
import { useState } from 'react';
import { TransactionFormDialog } from '@/components/forms/transaction-form-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Paginated, Person, Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function EquipoContent() {
  const { activeWorkspaceId } = useWorkspace();
  const [page, _setPage] = useState(1);

  const filters = { page, type: 'TEAM_PAYMENT' };
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.transactions(activeWorkspaceId ?? '', filters),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/transactions${buildQuery({
          workspaceId: activeWorkspaceId ?? '',
          type: 'TEAM_PAYMENT',
          page,
          pageSize: 20,
          sortBy: 'date',
          sortOrder: 'desc',
        })}`,
      ),
    enabled: !!activeWorkspaceId,
  });

  const { data: peopleData, isLoading: peopleLoading } = useQuery({
    queryKey: queryKeys.people(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Person[]>(`/people?workspaceId=${activeWorkspaceId}&kind=TEAM`),
    enabled: !!activeWorkspaceId,
  });

  const rows = data?.data ?? [];
  const team = peopleData ?? [];
  const totalPagado = rows.reduce((sum, tx) => sum + Number(tx.amountBase), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipo directo"
        description="Pagos al equipo directo de MIMOTECH"
        action={
          activeWorkspaceId && (
            <TransactionFormDialog
              workspaceId={activeWorkspaceId}
              defaultType="TEAM_PAYMENT"
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo pago
                </Button>
              }
            />
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <KPICard
          label="Total pagado"
          value={formatMoney(String(totalPagado), 'PEN')}
          icon={Wallet}
          color="text-destructive"
        />
        <KPICard label="Miembros del equipo" value={String(team.length)} icon={Users} color="text-info" />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Persona</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length ? (
                rows.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">{new Date(tx.date).toLocaleDateString('es-PE')}</TableCell>
                    <TableCell className="font-medium">{tx.concept}</TableCell>
                    <TableCell className="text-muted-foreground">{tx.description ?? '-'}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-destructive">
                      {formatMoney(tx.amountOriginal, tx.currency as 'PEN' | 'USD')}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-0">
                    <EmptyState
                      title="Sin pagos"
                      description="Registra tu primer pago al equipo con el boton de arriba."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Miembros del equipo</CardTitle>
        </CardHeader>
        <CardContent>
          {peopleLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : team.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((person) => (
                <div key={person.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar>
                    <AvatarFallback>{person.initials ?? initials(person.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{person.name}</p>
                    {person.role && <p className="text-xs text-muted-foreground">{person.role}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin miembros registrados</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function EquipoPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <EquipoContent />
    </WorkspaceGate>
  );
}
