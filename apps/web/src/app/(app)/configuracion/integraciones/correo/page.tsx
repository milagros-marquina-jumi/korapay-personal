'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { EmptyState } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, BookOpen, Copy, Mail, Pause, Play, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { EmailSource, EmailSourceCreated } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  PAUSED: 'Pausado',
  REVOKED: 'Revocado',
};

const STATUS_VARIANTS: Record<string, 'success' | 'secondary' | 'destructive'> = {
  ACTIVE: 'success',
  PAUSED: 'secondary',
  REVOKED: 'destructive',
};

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  email: z.string().email('Correo inválido'),
  defaultWorkspaceId: z.string().min(1, 'Requerido'),
});

type FormValues = z.infer<typeof schema>;

function ingestionUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin.replace(':3060', ':3061')}/api/v1/email-ingestion/messages`;
}

function CopyRow({ value, onCopy }: { value: string; onCopy: () => void }) {
  return (
    <div className="flex items-stretch gap-2">
      <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg border bg-muted px-3 py-2.5 font-mono text-xs">
        {value}
      </code>
      <Button variant="outline" size="sm" className="shrink-0" onClick={onCopy}>
        <Copy className="mr-1 size-4" /> Copiar
      </Button>
    </div>
  );
}

function TokenPanel({ token, onClose }: { token: string; onClose: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-warning/50 bg-warning/10 p-3.5">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
        <p className="text-sm font-medium text-foreground">
          Guarda este token ahora. Por seguridad no se volverá a mostrar; si lo pierdes tendrás que regenerarlo.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Token de ingesta</Label>
        <CopyRow
          value={token}
          onCopy={() => {
            navigator.clipboard.writeText(token);
            toast.success('Token copiado');
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>URL de ingesta</Label>
        <CopyRow
          value={ingestionUrl()}
          onCopy={() => {
            navigator.clipboard.writeText(ingestionUrl());
            toast.success('URL copiada');
          }}
        />
      </div>

      <div className="space-y-2 rounded-xl border bg-muted/40 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <BookOpen className="size-4 text-brand" /> Cómo configurarlo
        </p>
        <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
          <li>
            Copia el script <code className="rounded bg-muted px-1">korapay-gmail-connector.gs</code> (carpeta{' '}
            <code className="rounded bg-muted px-1">tooling/google-apps-script</code>).
          </li>
          <li>
            Pégalo en <span className="font-medium text-foreground">script.google.com</span> y ajusta{' '}
            <code className="rounded bg-muted px-1">apiUrl</code> con tu URL pública.
          </li>
          <li>
            En Propiedades del script agrega <code className="rounded bg-muted px-1">KORAPAY_INGESTION_TOKEN</code> con
            este token.
          </li>
        </ol>
      </div>

      <DialogFooter>
        <Button onClick={onClose}>Entendido</Button>
      </DialogFooter>
    </div>
  );
}

function AddSourceDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (token: string) => void;
}) {
  const { workspaces } = useWorkspace();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', defaultWorkspaceId: workspaces[0]?.id ?? '' },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiFetch<EmailSourceCreated>('/email-sources', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.emailSources() });
      toast.success('Correo conectado');
      reset();
      onOpenChange(false);
      onCreated(data.ingestionToken);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar correo</DialogTitle>
          <DialogDescription>Conecta un correo bancario para importar tus consumos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Correo BCP" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input id="email" type="email" placeholder="tucorreo@gmail.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Workspace por defecto</Label>
            <Select defaultValue={workspaces[0]?.id ?? ''} onValueChange={(v) => setValue('defaultWorkspaceId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.defaultWorkspaceId && (
              <p className="text-xs text-destructive">{errors.defaultWorkspaceId.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Conectando...' : 'Conectar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CorreoIntegracionesPage() {
  const { workspaces } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [addOpen, setAddOpen] = useState(false);
  const [tokenShown, setTokenShown] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.emailSources(),
    queryFn: () => apiFetch<EmailSource[]>('/email-sources'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.emailSources() });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/email-sources/${id}/pause`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      toast.success('Correo pausado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/email-sources/${id}/resume`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      toast.success('Correo reactivado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const regenerateMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<EmailSourceCreated>(`/email-sources/${id}/regenerate-token`, { method: 'POST' }),
    onSuccess: (result) => {
      invalidate();
      setTokenShown(result.ingestionToken);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/email-sources/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      toast.success('Correo eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const workspaceName = (id?: string | null) => workspaces.find((w) => w.id === id)?.name ?? '—';

  const sources = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integraciones de correo"
        description="Conecta tus correos bancarios mediante Google Apps Script"
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Agregar correo
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : sources.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {sources.map((source) => (
            <Card key={source.id} className="flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <Mail className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold">{source.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{source.email}</p>
                  </div>
                </div>
                <Badge variant={STATUS_VARIANTS[source.status] ?? 'secondary'}>
                  {STATUS_LABELS[source.status] ?? source.status}
                </Badge>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Workspace por defecto</dt>
                  <dd className="font-medium">{workspaceName(source.defaultWorkspaceId)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Pendientes</dt>
                  <dd className="font-medium tabular-nums">{source.pendingCount ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Última recepción</dt>
                  <dd className="font-medium">{source.lastReceivedAt ? formatDate(source.lastReceivedAt) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Última ingesta</dt>
                  <dd className="font-medium">
                    {source.lastSuccessfulIngestionAt ? formatDate(source.lastSuccessfulIngestionAt) : '—'}
                  </dd>
                </div>
              </dl>

              <div className="mt-auto flex flex-wrap gap-2">
                {source.status === 'PAUSED' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resumeMutation.mutate(source.id)}
                    disabled={resumeMutation.isPending}
                  >
                    <Play className="mr-1 size-4" /> Reactivar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => pauseMutation.mutate(source.id)}
                    disabled={pauseMutation.isPending}
                  >
                    <Pause className="mr-1 size-4" /> Pausar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => regenerateMutation.mutate(source.id)}
                  disabled={regenerateMutation.isPending}
                >
                  <RefreshCw className="mr-1 size-4" /> Regenerar token
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Eliminar correo',
                      description: `Se eliminará "${source.name}" y su token dejará de funcionar.`,
                      confirmLabel: 'Eliminar',
                      destructive: true,
                    });
                    if (ok) removeMutation.mutate(source.id);
                  }}
                >
                  <Trash2 className="mr-1 size-4 text-destructive" /> Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Mail aria-hidden />}
          title="Sin correos conectados"
          description="Conecta tu primer correo bancario para importar consumos automáticamente."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Agregar correo
            </Button>
          }
        />
      )}

      <AddSourceDialog open={addOpen} onOpenChange={setAddOpen} onCreated={setTokenShown} />

      <Dialog open={tokenShown !== null} onOpenChange={(next) => !next && setTokenShown(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Token de ingesta</DialogTitle>
            <DialogDescription>Configura Google Apps Script con este token.</DialogDescription>
          </DialogHeader>
          {tokenShown && <TokenPanel token={tokenShown} onClose={() => setTokenShown(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
