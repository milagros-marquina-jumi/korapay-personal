'use client';

import { StatusBadge } from '@korapay/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { WorkspaceIcon } from '@/components/layout/workspace-icon';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IconAction } from '@/components/ui/icon-action';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { Workspace } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { WORKSPACE_TYPE_OPTIONS, workspaceTypeLabel } from '@/lib/workspace-types';

const TYPE_OPTIONS = WORKSPACE_TYPE_OPTIONS;

interface FormState {
  name: string;
  type: string;
  emoji: string;
  description: string;
  currency: string;
  status: string;
}

const WORKSPACE_ICONS = [
  'Home',
  'Briefcase',
  'Building2',
  'PiggyBank',
  'Users',
  'Wallet',
  'Star',
  'Heart',
  'Zap',
  'Globe',
  'Rocket',
  'Gem',
  'Coffee',
  'BookOpen',
  'Palette',
  'GraduationCap',
] as const;

const EMPTY: FormState = {
  name: '',
  type: 'PERSONAL',
  emoji: 'Home',
  description: '',
  currency: 'PEN',
  status: 'ACTIVE',
};

export function WorkspaceManager() {
  const { workspaces } = useWorkspace();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Workspace | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() });

  const save = useMutation({
    mutationFn: () =>
      editing
        ? apiFetch(`/workspaces/${editing.id}`, { method: 'PATCH', body: JSON.stringify(form) })
        : apiFetch('/workspaces', { method: 'POST', body: JSON.stringify(form) }),
    onSuccess: () => {
      invalidate();
      toast.success(editing ? 'Workspace actualizado' : 'Workspace creado');
      setOpen(false);
      setEditing(null);
      setForm(EMPTY);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };
  const openEdit = (w: Workspace) => {
    setEditing(w);
    setForm({
      name: w.name,
      type: w.type,
      emoji: w.emoji ?? 'Home',
      description: w.description ?? '',
      currency: (w as { currency?: string }).currency ?? 'PEN',
      status: w.status ?? 'ACTIVE',
    });
    setOpen(true);
  };

  const typeHint = TYPE_OPTIONS.find((t) => t.value === form.type)?.hint;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Crea y edita tus espacios de trabajo.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" /> Nuevo workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar workspace' : 'Nuevo workspace'}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="ws-name">Nombre</Label>
                <Input
                  id="ws-name"
                  value={form.name}
                  required
                  maxLength={60}
                  placeholder="Ej. Personal, MIMOTECH, Qoryx"
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Icono</Label>
                <div className="grid grid-cols-8 gap-2">
                  {WORKSPACE_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, emoji: iconName }))}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                        form.emoji === iconName
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-border hover:border-muted-foreground text-muted-foreground'
                      }`}
                      title={iconName}
                    >
                      <WorkspaceIcon name={iconName} className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {typeHint && <p className="text-xs text-muted-foreground">{typeHint}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ws-desc">Descripción</Label>
                <Textarea
                  id="ws-desc"
                  value={form.description}
                  maxLength={200}
                  rows={3}
                  placeholder="Breve descripción del workspace"
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Moneda base</Label>
                <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PEN">Soles (S/)</SelectItem>
                    <SelectItem value="USD">Dólares ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="INACTIVE">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Los workspaces inactivos no aparecen en el selector del menú lateral.
                </p>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="divide-y rounded-lg border">
        {workspaces.map((w) => (
          <div key={w.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                aria-hidden
              >
                <WorkspaceIcon name={w.emoji} className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{w.name}</p>
                {w.description && <p className="text-xs text-muted-foreground">{w.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{workspaceTypeLabel(w.type)}</Badge>
              <StatusBadge status={w.status ?? 'ACTIVE'} />
              <IconAction icon={Pencil} label="Editar" onClick={() => openEdit(w)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
