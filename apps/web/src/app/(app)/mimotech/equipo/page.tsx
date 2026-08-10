'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard, StatusBadge } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2, Users, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { TransactionFormDialog } from '@/components/forms/transaction-form-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { PersonFormDialog, type PersonFormValues } from '@/components/team/person-form-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconAction } from '@/components/ui/icon-action';
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
  PENDING_REVIEW: 'Revisión',
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
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const ws = activeWorkspaceId ?? '';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(FILTER_ALL);
  const [personId, setPersonId] = useState<string>(FILTER_ALL);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.transactions(ws, { type: 'TEAM_PAYMENT', all: true }),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/transactions${buildQuery({
          workspaceId: ws,
          type: 'TEAM_PAYMENT',
          page: 1,
          pageSize: 500,
          sortBy: 'date',
          sortOrder: 'desc',
        })}`,
      ),
    enabled: !!ws,
  });

  const { data: peopleData, isLoading: peopleLoading } = useQuery({
    queryKey: queryKeys.people(ws),
    queryFn: () => apiFetch<Person[]>(`/people?workspaceId=${ws}&kind=TEAM`),
    enabled: !!ws,
  });

  const team = peopleData ?? [];

  const invalidatePeople = () => queryClient.invalidateQueries({ queryKey: queryKeys.people(ws) });
  const invalidatePayments = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions', ws] });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(ws) });
  };

  const removeTxMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/transactions/${id}?workspaceId=${ws}`, { method: 'DELETE' }),
    onSuccess: invalidatePayments,
  });

  const createPersonMutation = useMutation({
    mutationFn: (values: PersonFormValues) =>
      apiFetch('/people', {
        method: 'POST',
        body: JSON.stringify({ workspaceId: ws, kind: 'TEAM', ...normalizePerson(values) }),
      }),
    onSuccess: invalidatePeople,
  });
  const updatePersonMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: PersonFormValues }) =>
      apiFetch(`/people/${id}?workspaceId=${ws}`, { method: 'PATCH', body: JSON.stringify(normalizePerson(values)) }),
    onSuccess: invalidatePeople,
  });
  const removePersonMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/people/${id}?workspaceId=${ws}`, { method: 'DELETE' }),
    onSuccess: invalidatePeople,
  });

  const statusOptions = useMemo(() => {
    const distinct = [...new Set((data?.data ?? []).map((tx) => tx.status))];
    return distinct.map((value) => ({ value, label: STATUS_LABELS[value] ?? value }));
  }, [data?.data]);

  const personOptions = useMemo(() => (peopleData ?? []).map((p) => ({ value: p.id, label: p.name })), [peopleData]);
  const personName = (id?: string | null) => peopleData?.find((p) => p.id === id)?.name;

  const rows = useMemo(() => {
    return (data?.data ?? []).filter((tx) => {
      if (status !== FILTER_ALL && tx.status !== status) return false;
      if (personId !== FILTER_ALL && tx.personId !== personId) return false;
      return true;
    });
  }, [data?.data, status, personId]);

  const totalPagado = rows.reduce((sum, tx) => sum + Number(tx.amountBase), 0);

  const totalByPerson = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of data?.data ?? []) {
      const key = tx.person?.name ?? personName(tx.personId) ?? tx.concept;
      map.set(key, (map.get(key) ?? 0) + Number(tx.amountBase));
    }
    return [...map.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  }, [data?.data, peopleData]);
  const maxPerson = Math.max(1, ...totalByPerson.map((p) => p.total));

  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(
    () => [
      {
        accessorKey: 'date',
        header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.date)}</span>,
      },
      {
        id: 'person',
        header: ({ column }) => <SortableHeader column={column} label="Persona" />,
        accessorFn: (r) => r.person?.name ?? r.concept,
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.person?.name ?? personName(row.original.personId) ?? row.original.concept}
          </span>
        ),
      },
      {
        id: 'notes',
        header: 'Notas',
        cell: ({ row }) => (
          <span className="max-w-[18rem] truncate text-muted-foreground" title={row.original.description ?? ''}>
            {row.original.description ?? '-'}
          </span>
        ),
      },
      {
        id: 'amount',
        accessorFn: (r) => Number(r.amountBase),
        sortingFn: 'basic',
        header: ({ column }) => <SortableHeader column={column} label="Monto" className="ml-auto" />,
        cell: ({ row }) => (
          <div className="text-right font-semibold tabular-nums text-destructive">
            {formatMoney(row.original.amountBase, 'PEN')}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-0.5">
            <IconAction icon={Pencil} label="Editar" onClick={() => setEditingTx(row.original)} />
            <IconAction
              icon={Trash2}
              label="Eliminar"
              destructive
              onClick={async () => {
                const ok = await confirm({
                  title: 'Eliminar pago',
                  description: `Se eliminará el pago de "${row.original.person?.name ?? row.original.concept}". Esta acción no se puede deshacer.`,
                  confirmLabel: 'Eliminar',
                  destructive: true,
                });
                if (ok) removeTxMutation.mutate(row.original.id);
              }}
            />
          </div>
        ),
      },
    ],
    [confirm, removeTxMutation, peopleData],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipo directo"
        description="Pagos al equipo directo de MIMOTECH"
        action={
          ws && (
            <TransactionFormDialog
              workspaceId={ws}
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
          <EmptyState title="Sin pagos" description="Registra tu primer pago al equipo con el botón de arriba." />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Total pagado por persona</CardTitle>
        </CardHeader>
        <CardContent>
          {totalByPerson.length ? (
            <div className="space-y-3">
              {totalByPerson.map((p) => (
                <div key={p.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="tabular-nums text-muted-foreground">{formatMoney(String(p.total), 'PEN')}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-info" style={{ width: `${(p.total / maxPerson) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin pagos registrados</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Miembros del equipo</CardTitle>
          <PersonFormDialog
            onSubmit={(v) => createPersonMutation.mutateAsync(v).then(() => undefined)}
            isPending={createPersonMutation.isPending}
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="mr-1 size-4" /> Nuevo miembro
              </Button>
            }
          />
        </CardHeader>
        <CardContent>
          {peopleLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : team.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((person) => (
                <div key={person.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar>
                    <AvatarFallback>{person.initials ?? initials(person.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{person.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[person.role, person.salary ? formatMoney(person.salary, 'PEN') : null]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <IconAction icon={Pencil} label="Editar" onClick={() => setEditingPerson(person)} />
                    <IconAction
                      icon={Trash2}
                      label="Eliminar"
                      destructive
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Eliminar miembro',
                          description: `Se eliminará a "${person.name}". Los pagos existentes se conservan.`,
                          confirmLabel: 'Eliminar',
                          destructive: true,
                        });
                        if (ok) removePersonMutation.mutate(person.id);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin miembros registrados</p>
          )}
        </CardContent>
      </Card>

      {ws && editingTx && (
        <TransactionFormDialog
          workspaceId={ws}
          defaultType="TEAM_PAYMENT"
          transaction={editingTx}
          open={!!editingTx}
          onOpenChange={(next) => !next && setEditingTx(null)}
        />
      )}
      {editingPerson && (
        <PersonFormDialog
          person={editingPerson}
          open={!!editingPerson}
          onOpenChange={(next) => !next && setEditingPerson(null)}
          onSubmit={(v) => updatePersonMutation.mutateAsync({ id: editingPerson.id, values: v }).then(() => undefined)}
          isPending={updatePersonMutation.isPending}
        />
      )}
    </div>
  );
}

function normalizePerson(values: PersonFormValues) {
  return {
    name: values.name,
    role: values.role || undefined,
    salary: values.salary || undefined,
    status: values.status,
    email: values.email || undefined,
    phone: values.phone || undefined,
    notes: values.notes || undefined,
  };
}

export default function EquipoPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <EquipoContent />
    </WorkspaceGate>
  );
}
