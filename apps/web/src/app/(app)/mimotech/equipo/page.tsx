'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, KPICard, StatusBadge, statusLabel } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Eye, Pencil, Plus, Receipt, Trash2, Users, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { PersonDetailDialog } from '@/components/team/person-detail-dialog';
import { PersonFormDialog, type PersonFormValues } from '@/components/team/person-form-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconAction } from '@/components/ui/icon-action';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch, buildQuery } from '@/lib/api';
import type { Paginated, Person, Transaction } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { cn } from '@/lib/utils';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function ColaboradoresContent() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { highlightClass } = useHighlightNew();
  const ws = activeWorkspaceId ?? '';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [detailPerson, setDetailPerson] = useState<Person | null>(null);

  const { data: peopleData, isLoading } = useQuery({
    queryKey: queryKeys.people(ws),
    queryFn: () => apiFetch<Person[]>(`/people?workspaceId=${ws}&kind=TEAM`),
    enabled: !!ws,
  });

  const { data: payments } = useQuery({
    queryKey: queryKeys.transactions(ws, { type: 'TEAM_PAYMENT', all: true }),
    queryFn: () =>
      apiFetch<Paginated<Transaction>>(
        `/transactions${buildQuery({ workspaceId: ws, type: 'TEAM_PAYMENT', page: 1, pageSize: 500 })}`,
      ),
    enabled: !!ws,
  });

  const invalidatePeople = () => queryClient.invalidateQueries({ queryKey: queryKeys.people(ws) });

  const updatePersonMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: PersonFormValues }) =>
      apiFetch(`/people/${id}?workspaceId=${ws}`, { method: 'PATCH', body: JSON.stringify(normalizePerson(values)) }),
    onSuccess: invalidatePeople,
  });
  const removePersonMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/people/${id}?workspaceId=${ws}`, { method: 'DELETE' }),
    onSuccess: invalidatePeople,
  });

  const totalByPerson = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of payments?.data ?? []) {
      if (!tx.personId) continue;
      map.set(tx.personId, (map.get(tx.personId) ?? 0) + Number(tx.amountBase));
    }
    return map;
  }, [payments?.data]);

  const team = peopleData ?? [];

  const statusOptions = useMemo(
    () =>
      [...new Set(team.map((p) => p.status).filter(Boolean) as string[])].map((v) => ({
        value: v,
        label: statusLabel(v),
      })),
    [team],
  );

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return team.filter((p) => {
      if (status !== FILTER_ALL && p.status !== status) return false;
      if (term && !`${p.name} ${p.role ?? ''}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [team, status, search]);

  const totalPagado = [...totalByPerson.values()].reduce((s, v) => s + v, 0);

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          label="Colaboradores"
          value={String(team.length)}
          icon={Users}
          color="text-info"
          tooltip="Equipo directo registrado en MIMOTECH"
        />
        <KPICard
          label="Total pagado"
          value={formatMoney(String(totalPagado), 'PEN')}
          icon={Wallet}
          color="text-destructive"
          tooltip="Suma histórica de pagos al equipo"
        />
        <KPICard
          label="Con pagos"
          value={String(totalByPerson.size)}
          icon={Receipt}
          color="text-brand"
          tooltip="Colaboradores que recibieron al menos un pago"
        />
      </div>

      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar colaboradores..."
        showClear={search !== '' || status !== 'ACTIVE'}
        onClear={() => {
          setSearch('');
          setStatus('ACTIVE');
        }}
        filters={
          statusOptions.length > 0 ? (
            <FilterSelect
              value={status}
              onValueChange={setStatus}
              options={statusOptions}
              placeholder="Estado"
              allLabel="Todo estado"
            />
          ) : null
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : rows.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((person) => {
            const pagado = totalByPerson.get(person.id) ?? 0;
            return (
              <Card
                key={person.id}
                className={cn('flex h-full flex-col transition-shadow hover:shadow-lift', highlightClass(person.id))}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-3 p-5">
                  <CardTitle className="flex min-w-0 items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{person.initials ?? initials(person.name)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-base">{person.name}</span>
                      {person.role && (
                        <span className="block text-xs font-normal text-muted-foreground">{person.role}</span>
                      )}
                    </span>
                  </CardTitle>
                  {person.status && <StatusBadge status={person.status} />}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2 px-5 pb-5 text-sm">
                  {person.salary && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Sueldo acordado</span>
                      <span className="font-medium tabular-nums">{formatMoney(person.salary, 'PEN')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5">
                    <span className="text-muted-foreground">Total pagado</span>
                    <span className="font-semibold tabular-nums">{formatMoney(String(pagado), 'PEN')}</span>
                  </div>
                  <div className="mt-auto flex justify-end gap-0.5 pt-2">
                    <IconAction icon={Eye} label="Ver detalle" onClick={() => setDetailPerson(person)} />
                    <IconAction icon={Pencil} label="Editar" onClick={() => setEditingPerson(person)} />
                    <IconAction
                      icon={Trash2}
                      label="Eliminar"
                      destructive
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Eliminar colaborador',
                          description: `Se eliminará a "${person.name}". Los pagos existentes se conservan.`,
                          confirmLabel: 'Eliminar',
                          destructive: true,
                        });
                        if (ok) removePersonMutation.mutate(person.id);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Sin colaboradores" description="Registra tu primer colaborador con el botón de arriba." />
      )}

      <PersonDetailDialog
        person={detailPerson}
        payments={payments?.data ?? []}
        onOpenChange={(next) => !next && setDetailPerson(null)}
      />

      {editingPerson && (
        <PersonFormDialog
          person={editingPerson}
          open={!!editingPerson}
          onOpenChange={(next) => !next && setEditingPerson(null)}
          onSubmit={(v) => updatePersonMutation.mutateAsync({ id: editingPerson.id, values: v }).then(() => undefined)}
          isPending={updatePersonMutation.isPending}
        />
      )}
    </>
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
  };
}

export default function ColaboradoresPage() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const ws = activeWorkspaceId ?? '';

  const createPersonMutation = useMutation({
    mutationFn: (values: PersonFormValues) =>
      apiFetch('/people', {
        method: 'POST',
        body: JSON.stringify({ workspaceId: ws, kind: 'TEAM', ...normalizePerson(values) }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.people(ws) }),
  });

  return (
    <WorkspaceGate type="BUSINESS">
      <PageShell
        title="Colaboradores"
        description="Equipo directo de MIMOTECH"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/mimotech/equipo/pagos">
                <Receipt className="mr-2 h-4 w-4" /> Pagos
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/mimotech/equipo/reporte">
                <BarChart3 className="mr-2 h-4 w-4" /> Reporte
              </Link>
            </Button>
            <PersonFormDialog
              onSubmit={(v) => createPersonMutation.mutateAsync(v).then(() => undefined)}
              isPending={createPersonMutation.isPending}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo colaborador
                </Button>
              }
            />
          </div>
        }
      >
        <ColaboradoresContent />
      </PageShell>
    </WorkspaceGate>
  );
}
