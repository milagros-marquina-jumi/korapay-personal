'use client';

import { StatusBadge } from '@korapay/ui';
import { WorkspaceIcon } from '@/components/layout/workspace-icon';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Project } from '@/lib/api.types';
import { formatDateLong } from '@/lib/utils';

interface Props {
  project: Project | null;
  onOpenChange: (open: boolean) => void;
  onEdit?: (project: Project) => void;
}

export function ProjectDetailDialog({ project, onOpenChange, onEdit }: Readonly<Props>) {
  return (
    <Dialog open={project !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {project && (
          <>
            <DialogHeader className="space-y-1">
              <DialogTitle className="flex items-center gap-2 pr-6 text-lg leading-tight">
                <WorkspaceIcon name={project.emoji} className="size-5 shrink-0 text-muted-foreground" />
                {project.name}
              </DialogTitle>
              <DialogDescription>Proyecto de MIMOTECH</DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Estado</p>
              <StatusBadge status={project.status} />
            </div>

            <dl className="divide-y rounded-xl border text-sm">
              {project.createdAt && <Line label="Creado" value={formatDateLong(project.createdAt)} />}
              {project.updatedAt && <Line label="Última actualización" value={formatDateLong(project.updatedAt)} />}
            </dl>

            <div className="rounded-xl border px-4 py-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Descripción</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">
                {project.description || <span className="text-muted-foreground">Sin descripción</span>}
              </p>
            </div>

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(project)}
                className="self-start text-sm text-brand-strong underline underline-offset-4 dark:text-brand"
              >
                Editar proyecto
              </button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Line({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="shrink-0 text-muted-foreground text-xs">{label}</dt>
      <dd className="min-w-0 text-right font-medium">{value}</dd>
    </div>
  );
}
