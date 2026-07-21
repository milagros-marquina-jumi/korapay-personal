'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { EmptyState } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { PageHeader } from '@/components/layout/page-header';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';
import type { Company } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  ruc: z.string().optional(),
  industry: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function CompanyFormDialog({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', ruc: '', industry: '' } });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiFetch('/companies', { method: 'POST', body: JSON.stringify({ ...values, workspaceId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.companies(workspaceId) });
      toast.success('Empresa creada');
      reset();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nueva empresa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva empresa</DialogTitle>
          <DialogDescription>Registra una empresa asociada a tus ingresos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ruc">RUC</Label>
            <Input id="ruc" placeholder="Opcional" {...register('ruc')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industria</Label>
            <Input id="industry" placeholder="Opcional" {...register('industry')} />
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
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState(FILTER_ALL);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.companies(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<Company[]>(`/companies?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const allCompanies = data ?? [];

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
        id: 'ruc',
        header: 'RUC',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.ruc ?? '-'}</span>,
      },
      {
        id: 'industry',
        header: 'Industria',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.industry ?? '-'}</span>,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        description="Empresas asociadas a tus ingresos laborales"
        action={activeWorkspaceId && <CompanyFormDialog workspaceId={activeWorkspaceId} />}
      />

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
        emptyState={
          <EmptyState title="Sin empresas" description="Registra tu primera empresa con el botón de arriba." />
        }
      />
    </div>
  );
}

export default function EmpresasPage() {
  return (
    <WorkspaceGate type={['EMPLOYMENT', 'SHARED']}>
      <EmpresasContent />
    </WorkspaceGate>
  );
}
