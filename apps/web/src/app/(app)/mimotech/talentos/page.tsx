'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { StatusPicker } from '@/components/data-table/status-toggle';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { STATUS_LABELS, TalentFormDialog } from '@/components/talent/talent-form-dialog';
import { TalentWorkedTime } from '@/components/team/talent-worked-time';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconAction } from '@/components/ui/icon-action';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { Talent, TalentLedgerSummary } from '@/lib/api.types';
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

function TalentosContent() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { markNew, highlightClass } = useHighlightNew();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [pending, setPending] = useState(FILTER_ALL);
  const [editing, setEditing] = useState<Talent | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.talents(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Talent[]>(`/talents?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const { data: summaries } = useQuery({
    queryKey: queryKeys.talentLedgerSummary(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<TalentLedgerSummary[]>(`/talent-ledger/summary?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });
  const summaryById = useMemo(() => {
    const map: Record<string, TalentLedgerSummary> = {};
    for (const s of summaries ?? []) map[s.talentId] = s;
    return map;
  }, [summaries]);

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/talents/${id}?workspaceId=${activeWorkspaceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talents(activeWorkspaceId ?? '') });
      toast.success('Talento eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/talents/${id}?workspaceId=${activeWorkspaceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ workspaceId: activeWorkspaceId, status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talents(activeWorkspaceId ?? '') });
      toast.success('Estado actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusOptions = useMemo(() => {
    const distinct = [...new Set((data ?? []).map((t) => t.status).filter(Boolean))];
    return distinct.map((value) => ({ value, label: STATUS_LABELS[value] ?? value }));
  }, [data]);

  const talents = useMemo(() => {
    const all = data ?? [];
    const q = search.trim().toLowerCase();
    return all
      .filter((t) => {
        const matchesSearch = !q || t.name.toLowerCase().includes(q);
        const matchesStatus = status === FILTER_ALL || t.status === status;
        const matchesPending = pending !== 'PENDING' || Number(summaryById[t.id]?.totalPending ?? 0) > 0;
        return matchesSearch && matchesStatus && matchesPending;
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'ACTIVE' ? -1 : 1;
        const aStart = a.startedWithMeAt ? new Date(a.startedWithMeAt).getTime() : Number.POSITIVE_INFINITY;
        const bStart = b.startedWithMeAt ? new Date(b.startedWithMeAt).getTime() : Number.POSITIVE_INFINITY;
        return aStart - bStart;
      });
  }, [data, search, status, pending, summaryById]);

  const hasFilters = search.trim().length > 0 || status !== 'ACTIVE' || pending !== FILTER_ALL;

  return (
    <PageShell
      title="Talentos"
      description="Talentos tercerizados de MIMOTECH (activos primero, por antigüedad)"
      action={
        activeWorkspaceId && (
          <TalentFormDialog
            workspaceId={activeWorkspaceId}
            onCreated={markNew}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuevo talento
              </Button>
            }
          />
        )
      }
    >
      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar talentos..."
        showClear={hasFilters}
        onClear={() => {
          setSearch('');
          setStatus('ACTIVE');
          setPending(FILTER_ALL);
        }}
        filters={
          <>
            {statusOptions.length > 0 && (
              <FilterSelect
                value={status}
                onValueChange={setStatus}
                options={statusOptions}
                placeholder="Estado"
                allLabel="Todos los estados"
              />
            )}
            <FilterSelect
              value={pending}
              onValueChange={setPending}
              options={[{ value: 'PENDING', label: 'Con falta de pagar' }]}
              placeholder="Pagos"
              allLabel="Todos los pagos"
            />
          </>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : talents.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {talents.map((talent) => {
            const talentSummary = summaryById[talent.id];
            return (
              <Card
                key={talent.id}
                className={cn(
                  'relative flex h-full flex-col transition-shadow hover:shadow-lift',
                  highlightClass(talent.id),
                )}
              >
                <Link
                  href={`/mimotech/talentos/${talent.id}`}
                  aria-label={`Ver detalle de ${talent.name}`}
                  className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <CardHeader className="pointer-events-none flex flex-row items-start justify-between gap-3 p-5">
                  <CardTitle className="flex min-w-0 items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{initials(talent.name)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0">
                      <span className="block truncate text-base">{talent.name}</span>
                      {talent.role && (
                        <span className="block text-xs font-normal text-muted-foreground">{talent.role}</span>
                      )}
                    </span>
                  </CardTitle>
                  <span className="pointer-events-auto relative z-10">
                    <StatusPicker
                      status={talent.status}
                      options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                      isPending={statusMutation.isPending}
                      onSelect={(status) => statusMutation.mutate({ id: talent.id, status })}
                    />
                  </span>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2 px-5 pb-5 text-sm">
                  <TalentWorkedTime talent={talent} />
                  {talent.studyPlace && (
                    <div className="pointer-events-none flex items-center gap-1.5 text-muted-foreground">
                      <GraduationCap className="size-3.5" />
                      <span className="truncate">{talent.studyPlace}</span>
                    </div>
                  )}
                  {talentSummary && Number(talentSummary.totalPending) > 0 && (
                    <div className="pointer-events-none flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5">
                      <span className="text-muted-foreground">Falta pagar</span>
                      <span className="font-semibold tabular-nums text-destructive">
                        {formatMoney(talentSummary.totalPending, 'PEN')}
                      </span>
                    </div>
                  )}
                  <div className="relative z-10 mt-auto flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                      {talent.slideUrl && (
                        <a
                          href={talent.slideUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                        >
                          <ExternalLink className="size-3" /> Canva
                        </a>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <IconAction icon={Pencil} label="Editar" onClick={() => setEditing(talent)} />
                      <IconAction
                        icon={Trash2}
                        label="Eliminar"
                        destructive
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Eliminar talento',
                            description: `Se eliminará "${talent.name}". Esta acción no se puede deshacer.`,
                            confirmLabel: 'Eliminar',
                            destructive: true,
                          });
                          if (ok) removeMutation.mutate(talent.id);
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Sin talentos" description="Registra tu primer talento con el botón de arriba." />
      )}

      {activeWorkspaceId && editing && (
        <TalentFormDialog
          workspaceId={activeWorkspaceId}
          talent={editing}
          open={!!editing}
          onOpenChange={(next) => !next && setEditing(null)}
        />
      )}
    </PageShell>
  );
}

export default function TalentosPage() {
  return (
    <WorkspaceGate type="BUSINESS">
      <TalentosContent />
    </WorkspaceGate>
  );
}
