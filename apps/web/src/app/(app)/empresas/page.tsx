'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { EmptyState } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ClientManagerDialog } from '@/components/company/client-manager-dialog';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { IconAction } from '@/components/ui/icon-action';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import type { Company } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { formatDate } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  ruc: z.string().optional(),
  industry: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function CompanyFormDialog({
  workspaceId,
  company,
  trigger,
  open,
  onOpenChange,
  onSaved,
}: {
  workspaceId: string;
  company?: Company | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (id: string) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = open ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const queryClient = useQueryClient();
  const editing = !!company;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', ruc: '', industry: '', startDate: '', endDate: '' },
  });

  useEffect(() => {
    if (isOpen && company) {
      reset({
        name: company.name,
        ruc: company.ruc ?? '',
        industry: company.industry ?? '',
        startDate: company.startDate ? company.startDate.slice(0, 10) : '',
        endDate: company.endDate ? company.endDate.slice(0, 10) : '',
      });
    }
  }, [isOpen, company, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        workspaceId,
        name: values.name,
        ruc: values.ruc || undefined,
        industry: values.industry || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      };
      if (editing && company) {
        return apiFetch<Company>(`/companies/${company.id}?workspaceId=${workspaceId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }
      return apiFetch<Company>('/companies', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies(workspaceId) });
      toast.success(editing ? 'Empresa actualizada' : 'Empresa creada');
      if (!editing && result?.id) onSaved?.(result.id);
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar empresa' : 'Nueva empresa'}</DialogTitle>
          <DialogDescription>Empresa asociada a tus ingresos laborales, con periodo y clientes.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Ej. WIGILABS, ENTELGY, CANVIA" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha inicio</Label>
              <Input id="startDate" type="date" {...register('startDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha fin</Label>
              <Input id="endDate" type="date" {...register('endDate')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ruc">RUC</Label>
              <Input id="ruc" placeholder="Opcional" {...register('ruc')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industria</Label>
              <Input id="industry" placeholder="Opcional" {...register('industry')} />
            </div>
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

function EmpresasContent() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { markNew, highlightClass } = useHighlightNew();
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState(FILTER_ALL);
  const [editing, setEditing] = useState<Company | null>(null);
  const [clientsFor, setClientsFor] = useState<Company | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.companies(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Company[]>(`/companies?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const allCompanies = data ?? [];

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/companies/${id}?workspaceId=${activeWorkspaceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies(activeWorkspaceId ?? '') });
      toast.success('Empresa eliminada');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const industryOptions = useMemo(
    () =>
      [...new Set(allCompanies.map((c) => c.industry).filter(Boolean) as string[])].map((v) => ({
        value: v,
        label: v,
      })),
    [allCompanies],
  );

  const companies = useMemo(
    () => allCompanies.filter((c) => industry === FILTER_ALL || c.industry === industry),
    [allCompanies, industry],
  );

  const handleClear = () => {
    setSearch('');
    setIndustry(FILTER_ALL);
  };

  const columns = useMemo<ColumnDef<Company, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <SortableHeader column={column} label="Nombre" />,
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        id: 'startDate',
        accessorFn: (r) => r.startDate ?? '',
        header: ({ column }) => <SortableHeader column={column} label="Inicio" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.startDate ? formatDate(row.original.startDate) : '-'}
          </span>
        ),
      },
      {
        id: 'endDate',
        accessorFn: (r) => r.endDate ?? '',
        header: ({ column }) => <SortableHeader column={column} label="Fin" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.endDate ? formatDate(row.original.endDate) : 'Actual'}
          </span>
        ),
      },
      {
        id: 'clients',
        header: 'Clientes',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setClientsFor(row.original)}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm hover:bg-muted"
          >
            <Users className="size-3.5 text-muted-foreground" />
            <span className="tabular-nums">{row.original.clientCount ?? 0}</span>
          </button>
        ),
      },
      {
        id: 'industry',
        header: 'Industria',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.industry ?? '-'}</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-0.5">
            <IconAction icon={Users} label="Clientes" onClick={() => setClientsFor(row.original)} />
            <IconAction icon={Pencil} label="Editar" onClick={() => setEditing(row.original)} />
            <IconAction
              icon={Trash2}
              label="Eliminar"
              destructive
              onClick={async () => {
                const ok = await confirm({
                  title: 'Eliminar empresa',
                  description: `Se eliminará "${row.original.name}" y sus clientes. Esta acción no se puede deshacer.`,
                  confirmLabel: 'Eliminar',
                  destructive: true,
                });
                if (ok) removeMutation.mutate(row.original.id);
              }}
            />
          </div>
        ),
      },
    ],
    [confirm, removeMutation],
  );

  return (
    <PageShell
      title="Empresas"
      description="Empresas asociadas a tus ingresos laborales"
      action={
        activeWorkspaceId && (
          <CompanyFormDialog
            workspaceId={activeWorkspaceId}
            onSaved={markNew}
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nueva empresa
              </Button>
            }
          />
        )
      }
    >
      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar empresas..."
        showClear={search !== '' || industry !== FILTER_ALL}
        onClear={handleClear}
        filters={
          <FilterSelect
            value={industry}
            onValueChange={setIndustry}
            options={industryOptions}
            placeholder="Industria"
            allLabel="Toda industria"
          />
        }
      />

      <DataTable
        columns={columns}
        data={companies}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        rowClassName={(c) => highlightClass(c.id)}
        emptyState={
          <EmptyState title="Sin empresas" description="Registra tu primera empresa con el botón de arriba." />
        }
      />

      {activeWorkspaceId && editing && (
        <CompanyFormDialog
          workspaceId={activeWorkspaceId}
          company={editing}
          open={!!editing}
          onOpenChange={(next) => !next && setEditing(null)}
        />
      )}

      {activeWorkspaceId && clientsFor && (
        <ClientManagerDialog
          workspaceId={activeWorkspaceId}
          company={clientsFor}
          open={!!clientsFor}
          onOpenChange={(next) => !next && setClientsFor(null)}
        />
      )}
    </PageShell>
  );
}

export default function EmpresasPage() {
  return (
    <WorkspaceGate type={['EMPLOYMENT', 'SHARED']}>
      <EmpresasContent />
    </WorkspaceGate>
  );
}
