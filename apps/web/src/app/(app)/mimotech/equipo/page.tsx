'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard } from '@korapay/ui';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Users, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { TransactionFormDialog } from '@/components/forms/transaction-form-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Paginated, Person, Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  OVERDUE: 'Vencido',
  PARTIAL: 'Parcial',
  CANCELLED: 'Cancelado',
  PENDING_REVIEW: 'Revision',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
};

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
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(FILTER_ALL);
  const [personId, setPersonId] = useState<string>(FILTER_ALL);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.transactions(activeWorkspaceId ?? '', { type: 'TEAM_PAYMENT', all: true }),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/transactions${buildQuery({
          workspaceId: activeWorkspaceId ?? '',
          type: 'TEAM_PAYMENT',
          page: 1,
          pageSize: 500,
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

  const team = peopleData ?? [];

  const statusOptions = useMemo(() => {
    const distinct = [...new Set((data?.data ?? []).map((tx) => tx.status))];
    return distinct.map((value) => ({ value, label: STATUS_LABELS[value] ?? value }));
  }, [data?.data]);

  const personOptions = useMemo(() => (peopleData ?? []).map((p) => ({ value: p.id, label: p.name })), [peopleData]);

  const rows = useMemo(() => {
    return (data?.data ?? []).filter((tx) => {
      if (status !== FILTER_ALL && tx.status !== status) return false;
      if (personId !== FILTER_ALL && tx.personId !== personId) return false;
      return true;
    });
  }, [data?.data, status, personId]);

  const totalPagado = rows.reduce((sum, tx) => sum + Number(tx.amountBase), 0);

  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.date)}</span>,
      },
      {
        accessorKey: 'concept',
        header: ({ column }) => <SortableHeader column={column} label="Persona" />,
        cell: ({ row }) => <span className="font-medium">{row.original.concept}</span>,
      },
      {
        id: 'notes',
        header: 'Notas',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.description ?? '-'}</span>,
      },
      {
        id: 'amount',
        accessorFn: (r) => Number(r.amountBase),
        sortingFn: 'basic',
        header: ({ column }) => <SortableHeader column={column} label="Monto" className="ml-auto" />,
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums text-destructive">
            {formatMoney(row.original.amountOriginal, row.original.currency as 'PEN' | 'USD')}
          </div>
        ),
      },
    ],
    [],
  );

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

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar pagos..."
        showClear={search !== '' || status !== FILTER_ALL || personId !== FILTER_ALL}
        onClear={() => {
          setSearch('');
          setStatus(FILTER_ALL);
          setPersonId(FILTER_ALL);
        }}
        filters={
          <>
            <FilterSelect
              value={status}
              onValueChange={setStatus}
              options={statusOptions}
              placeholder="Estado"
              allLabel="Todo estado"
            />
            <FilterSelect
              value={personId}
              onValueChange={setPersonId}
              options={personOptions}
              placeholder="Persona"
              allLabel="Toda persona"
            />
          </>
        }
      />

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        emptyState={
          <EmptyState title="Sin pagos" description="Registra tu primer pago al equipo con el boton de arriba." />
        }
      />

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
