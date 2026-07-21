'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { EmptyState } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/page-header';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import type { Category, ReconciliationRule } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  merchantPattern: z.string().optional(),
  bankCode: z.string().optional(),
  targetWorkspaceId: z.string().min(1, 'Requerido'),
  targetCategoryId: z.string().optional(),
  priority: z.coerce.number().int().min(0),
});

type FormValues = z.infer<typeof schema>;

function RuleFormDialog({
  rule,
  open,
  onOpenChange,
}: {
  rule?: ReconciliationRule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { workspaces, activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const isEdit = !!rule;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: rule?.name ?? '',
      merchantPattern: rule?.merchantPattern ?? '',
      bankCode: rule?.bankCode ?? '',
      targetWorkspaceId: rule?.targetWorkspaceId ?? workspaces[0]?.id ?? '',
      targetCategoryId: rule?.targetCategoryId ?? '',
      priority: rule?.priority ?? 100,
    },
  });

  const targetWorkspaceId = watch('targetWorkspaceId');

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories(targetWorkspaceId),
    queryFn: () => apiFetch<Category[]>(`/categories?workspaceId=${targetWorkspaceId}`),
    enabled: open && !!targetWorkspaceId,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        name: values.name,
        merchantPattern: values.merchantPattern || undefined,
        bankCode: values.bankCode || undefined,
        targetWorkspaceId: values.targetWorkspaceId,
        targetCategoryId: values.targetCategoryId || undefined,
        priority: values.priority,
      };
      return isEdit
        ? apiFetch(`/reconciliation-rules/${rule.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        : apiFetch('/reconciliation-rules', {
            method: 'POST',
            body: JSON.stringify({
              ...payload,
              workspaceId: activeWorkspaceId ?? values.targetWorkspaceId,
              autoConfirm: false,
            }),
          });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reconciliationRules() });
      toast.success(isEdit ? 'Regla actualizada' : 'Regla creada');
      if (!isEdit) reset();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar regla' : 'Nueva regla'}</DialogTitle>
          <DialogDescription>Asigna automáticamente workspace, cuenta y categoría según el comercio.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="merchantPattern">Patrón de comercio</Label>
            <Input id="merchantPattern" placeholder="NETFLIX" {...register('merchantPattern')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankCode">Código de banco</Label>
            <Input id="bankCode" placeholder="BCP" {...register('bankCode')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Workspace destino</Label>
              <Select
                defaultValue={rule?.targetWorkspaceId ?? workspaces[0]?.id ?? ''}
                onValueChange={(v) => {
                  setValue('targetWorkspaceId', v);
                  setValue('targetCategoryId', '');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.targetWorkspaceId && (
                <p className="text-xs text-destructive">{errors.targetWorkspaceId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Input id="priority" type="number" inputMode="numeric" {...register('priority')} />
              {errors.priority && <p className="text-xs text-destructive">{errors.priority.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Categoría destino</Label>
            <Select
              value={watch('targetCategoryId') || undefined}
              onValueChange={(v) => setValue('targetCategoryId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

export default function ReglasConciliacionPage() {
  const { workspaces } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ReconciliationRule | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.reconciliationRules(),
    queryFn: () => apiFetch<ReconciliationRule[]>('/reconciliation-rules'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.reconciliationRules() });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/reconciliation-rules/${id}/toggle`, { method: 'POST' }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/reconciliation-rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      toast.success('Regla eliminada');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const workspaceName = (id: string) => workspaces.find((w) => w.id === id)?.name ?? '—';

  const rules = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reglas de conciliación"
        description="Asigna automáticamente workspace, cuenta y categoría según el comercio"
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nueva regla
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : rules.length ? (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Comercio</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Workspace destino</TableHead>
                <TableHead>Activa</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{rule.merchantPattern ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{rule.bankCode ?? '—'}</TableCell>
                  <TableCell className="text-sm">{workspaceName(rule.targetWorkspaceId)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.active}
                      onCheckedChange={() => toggleMutation.mutate(rule.id)}
                      aria-label="Activar regla"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        aria-label="Editar"
                        onClick={() => setEditing(rule)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8"
                        aria-label="Eliminar"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Eliminar regla',
                            description: `Se eliminará la regla "${rule.name}".`,
                            confirmLabel: 'Eliminar',
                            destructive: true,
                          });
                          if (ok) removeMutation.mutate(rule.id);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="Sin reglas"
          description="Crea una regla para clasificar automáticamente los movimientos detectados."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nueva regla
            </Button>
          }
        />
      )}

      <RuleFormDialog open={addOpen} onOpenChange={setAddOpen} />

      {editing && (
        <RuleFormDialog
          rule={editing}
          open
          onOpenChange={(next) => {
            if (!next) setEditing(null);
          }}
        />
      )}
    </div>
  );
}
