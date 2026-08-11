'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
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
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { Talent, TalentLedgerSummary } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { cn, formatDuration } from '@/lib/utils';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  role: z.string().optional(),
  startedWithMeAt: z.string().optional(),
  endedWithMeAt: z.string().optional(),
  firstJobAt: z.string().optional(),
  studyPlace: z.string().optional(),
  studyStartAt: z.string().optional(),
  slideUrl: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Activo', INACTIVE: 'Inactivo' };

function TalentFormDialog({
  workspaceId,
  talent,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onCreated,
}: {
  workspaceId: string;
  talent?: Talent | null;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCreated?: (id: string) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const editing = !!talent;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', status: 'ACTIVE' },
  });

  useEffect(() => {
    if (open && talent) {
      reset({
        name: talent.name,
        status: (talent.status as FormValues['status']) ?? 'ACTIVE',
        role: talent.role ?? '',
        startedWithMeAt: talent.startedWithMeAt ? talent.startedWithMeAt.slice(0, 10) : '',
        endedWithMeAt: talent.endedWithMeAt ? talent.endedWithMeAt.slice(0, 10) : '',
        firstJobAt: talent.firstJobAt ? talent.firstJobAt.slice(0, 10) : '',
        studyPlace: talent.studyPlace ?? '',
        studyStartAt: talent.studyStartAt ? talent.studyStartAt.slice(0, 10) : '',
        slideUrl: talent.slideUrl ?? '',
        email: talent.email ?? '',
        phone: talent.phone ?? '',
        notes: talent.notes ?? '',
      });
    }
  }, [open, talent, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        workspaceId,
        name: values.name,
        status: values.status,
        role: values.role || undefined,
        startedWithMeAt: values.startedWithMeAt || undefined,
        endedWithMeAt: values.endedWithMeAt || undefined,
        firstJobAt: values.firstJobAt || undefined,
        studyPlace: values.studyPlace || undefined,
        studyStartAt: values.studyStartAt || undefined,
        slideUrl: values.slideUrl || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        notes: values.notes || undefined,
      };
      if (editing && talent) {
        return apiFetch<Talent>(`/talents/${talent.id}?workspaceId=${workspaceId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
      return apiFetch<Talent>('/talents', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.talents(workspaceId) });
      toast.success(editing ? 'Talento actualizado' : 'Talento creado');
      if (!editing && created?.id) onCreated?.(created.id);
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar talento' : 'Nuevo talento'}</DialogTitle>
          <DialogDescription>Talento tercerizado de MIMOTECH.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" placeholder="Nombre del talento" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                defaultValue={talent?.status ?? 'ACTIVE'}
                onValueChange={(v) => setValue('status', v as FormValues['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="INACTIVE">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Input id="role" placeholder="Ej. Programadora, RRHH" {...register('role')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startedWithMeAt">Inicio conmigo</Label>
              <Input id="startedWithMeAt" type="date" {...register('startedWithMeAt')} />
            </div>
          </div>

          <CollapsibleSection label="Ver más datos">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstJobAt">Inicio primer trabajo</Label>
                <Input id="firstJobAt" type="date" {...register('firstJobAt')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endedWithMeAt">Fin conmigo</Label>
                <Input id="endedWithMeAt" type="date" {...register('endedWithMeAt')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="studyPlace">Lugar de estudio</Label>
                <Input id="studyPlace" placeholder="Ej. Cibertec, ISIL" {...register('studyPlace')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studyStartAt">Inicio de estudios</Label>
                <Input id="studyStartAt" type="date" {...register('studyStartAt')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slideUrl">Diapositiva (Canva)</Label>
              <Input id="slideUrl" placeholder="https://www.canva.com/..." {...register('slideUrl')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" placeholder="Opcional" {...register('email')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" placeholder="Opcional" {...register('phone')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" rows={3} placeholder="Notas sobre el talento (opcional)" {...register('notes')} />
            </div>
          </CollapsibleSection>

          <input type="hidden" {...register('status')} value={watch('status')} />

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
                  <StatusBadge status={talent.status} />
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2 px-5 pb-5 text-sm">
                  <div className="pointer-events-none flex items-center justify-between">
                    <span className="text-muted-foreground">Tiempo conmigo</span>
                    <span className="font-medium">{formatDuration(talent.startedWithMeAt, talent.endedWithMeAt)}</span>
                  </div>
                  {talent.firstJobAt && (
                    <div className="pointer-events-none flex items-center justify-between">
                      <span className="text-muted-foreground">Tiempo trabajando</span>
                      <span className="font-medium">{formatDuration(talent.firstJobAt)}</span>
                    </div>
                  )}
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
                    <div className="flex gap-0.5">
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
