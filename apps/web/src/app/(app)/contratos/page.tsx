'use client';

import { formatMoney } from '@korapay/domain';
import { EmptyState, StatusBadge, statusLabel } from '@korapay/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ActiveContractsDialog } from '@/components/contracts/active-contracts-dialog';
import { ContractDetailDialog } from '@/components/contracts/contract-detail-dialog';
import { SequenceBadge } from '@/components/contracts/sequence-badge';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { FILTER_ALL, FilterSelect } from '@/components/data-table/filter-select';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { ContractFormDialog } from '@/components/forms/contract-form-dialog';
import { PageShell } from '@/components/layout/page-shell';
import { WorkspaceGate } from '@/components/layout/workspace-gate';
import { useConfirm } from '@/components/providers/confirm-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { Button } from '@/components/ui/button';
import { IconAction } from '@/components/ui/icon-action';
import { apiFetch } from '@/lib/api';
import type { EmploymentContract } from '@/lib/api.types';
import { queryKeys } from '@/lib/query-keys';
import { useHighlightNew } from '@/lib/use-highlight-new';
import { formatDate } from '@/lib/utils';

const REINGRESO_OPTIONS = [
  { value: 'SI', label: 'Solo reingresos' },
  { value: 'NO', label: 'Sin reingreso' },
];

function formatDateOrActive(value?: string | null) {
  return value ? formatDate(value) : 'Actual';
}

function ContratosContent() {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { markNew, highlightClass } = useHighlightNew();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(FILTER_ALL);
  const [type, setType] = useState(FILTER_ALL);
  const [currency, setCurrency] = useState(FILTER_ALL);
  const [company, setCompany] = useState(FILTER_ALL);
  const [reingreso, setReingreso] = useState(FILTER_ALL);
  const [editing, setEditing] = useState<EmploymentContract | null>(null);
  const [detalle, setDetalle] = useState<EmploymentContract | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.employmentContracts(activeWorkspaceId ?? ''),
    queryFn: () => apiFetch<EmploymentContract[]>(`/employment-contracts?workspaceId=${activeWorkspaceId}`),
    enabled: !!activeWorkspaceId,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/employment-contracts/${id}?workspaceId=${activeWorkspaceId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employmentContracts(activeWorkspaceId ?? '') });
      toast.success('Contrato eliminado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allContracts = data ?? [];

  const statusOptions = useMemo(
    () =>
      [...new Set(allContracts.map((c) => c.state ?? c.status).filter(Boolean) as string[])].map((v) => ({
        value: v,
        label: statusLabel(v),
      })),
    [allContracts],
  );

  const typeOptions = useMemo(
    () =>
      [...new Set(allContracts.map((c) => c.type).filter(Boolean) as string[])].map((v) => ({
        value: v,
        label: v,
      })),
    [allContracts],
  );

  const companyOptions = useMemo(
    () =>
      [...new Set(allContracts.map((c) => c.companyName).filter(Boolean) as string[])]
        .sort((a, b) => a.localeCompare(b))
        .map((v) => ({ value: v, label: v })),
    [allContracts],
  );

  const currencyOptions = [
    { value: 'PEN', label: 'Soles' },
    { value: 'USD', label: 'Dólares' },
  ];

  const contracts = useMemo(
    () =>
      allContracts.filter(
        (c) =>
          (status === FILTER_ALL || (c.state ?? c.status) === status) &&
          (type === FILTER_ALL || c.type === type) &&
          (currency === FILTER_ALL || c.currency === currency) &&
          (company === FILTER_ALL || c.companyName === company) &&
          (reingreso === FILTER_ALL ||
            (reingreso === 'SI' ? (c.sequenceTotal ?? 1) > 1 : (c.sequenceTotal ?? 1) === 1)),
      ),
    [allContracts, status, type, currency, company, reingreso],
  );

  const handleClear = () => {
    setSearch('');
    setStatus(FILTER_ALL);
    setType(FILTER_ALL);
    setCurrency(FILTER_ALL);
    setCompany(FILTER_ALL);
    setReingreso(FILTER_ALL);
  };

  const columns = useMemo<ColumnDef<EmploymentContract, unknown>[]>(
    () => [
      {
        id: 'company',
        accessorFn: (r) => r.companyName ?? '',
        header: ({ column }) => <SortableHeader column={column} label="Empresa" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium">{row.original.companyName ?? 'Sin empresa'}</span>
              <SequenceBadge sequence={row.original.sequence} total={row.original.sequenceTotal} />
            </div>
            {row.original.position && <span className="text-xs text-muted-foreground">{row.original.position}</span>}
          </div>
        ),
      },
      {
        accessorKey: 'startDate',
        header: ({ column }) => <SortableHeader column={column} label="Inicio" />,
        cell: ({ row }) => <span className="text-sm">{formatDate(row.original.startDate)}</span>,
      },
      {
        id: 'endDate',
        header: 'Fin',
        cell: ({ row }) => <span className="text-sm">{formatDateOrActive(row.original.endDate)}</span>,
      },
      {
        id: 'type',
        header: 'Tipo de pago',
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.type ?? '-'}</span>,
      },
      {
        id: 'salary',
        header: 'Salario bruto',
        cell: ({ row }) => {
          const own = row.original.salary;
          const derived = row.original.grossSalary;
          const value = own ?? derived;
          if (!value) return <span className="text-muted-foreground">-</span>;
          return (
            <div className="flex flex-col">
              <span className="font-medium tabular-nums">
                {formatMoney(value, row.original.currency as 'PEN' | 'USD')}
              </span>
              {!own && <span className="text-xs text-muted-foreground">según sus pagos</span>}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => {
          const days = row.original.daysRemaining;
          return (
            <div className="flex flex-col items-start gap-0.5">
              <StatusBadge status={row.original.state ?? row.original.status} />
              {row.original.state === 'EXPIRING' && days !== null && days !== undefined && (
                <span className="text-xs text-warning">{days === 0 ? 'vence hoy' : `faltan ${days} días`}</span>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-0.5">
            <IconAction icon={Eye} label="Ver detalle" onClick={() => setDetalle(row.original)} />
            <IconAction icon={Pencil} label="Editar" onClick={() => setEditing(row.original)} />
            <IconAction
              icon={Trash2}
              label="Eliminar"
              destructive
              onClick={async () => {
                const ok = await confirm({
                  title: 'Eliminar contrato',
                  description: `Se eliminará el contrato de "${row.original.companyName ?? 'Sin empresa'}". Esta acción no se puede deshacer.`,
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
      title="Contratos"
      description="Tus contratos laborales"
      action={
        activeWorkspaceId && (
          <div className="flex items-center gap-2">
            <ActiveContractsDialog contracts={allContracts} />
            <ContractFormDialog
              workspaceId={activeWorkspaceId}
              onSaved={markNew}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo contrato
                </Button>
              }
            />
          </div>
        )
      }
    >
      <DataTableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar contratos..."
        showClear={
          search !== '' ||
          status !== FILTER_ALL ||
          type !== FILTER_ALL ||
          currency !== FILTER_ALL ||
          company !== FILTER_ALL ||
          reingreso !== FILTER_ALL
        }
        onClear={handleClear}
        filters={
          <>
            <FilterSelect
              value={company}
              onValueChange={setCompany}
              options={companyOptions}
              placeholder="Empresa"
              allLabel="Toda empresa"
            />
            <FilterSelect
              value={status}
              onValueChange={setStatus}
              options={statusOptions}
              placeholder="Estado"
              allLabel="Todo estado"
            />
            <FilterSelect
              value={type}
              onValueChange={setType}
              options={typeOptions}
              placeholder="Tipo"
              allLabel="Todo tipo"
            />
            <FilterSelect
              value={currency}
              onValueChange={setCurrency}
              options={currencyOptions}
              placeholder="Moneda"
              allLabel="Toda moneda"
            />
            <FilterSelect
              value={reingreso}
              onValueChange={setReingreso}
              options={REINGRESO_OPTIONS}
              placeholder="Reingresos"
              allLabel="Todos"
            />
          </>
        }
      />

      <DataTable
        columns={columns}
        data={contracts}
        isLoading={isLoading}
        globalFilter={search}
        onGlobalFilterChange={setSearch}
        rowClassName={(c) => highlightClass(c.id)}
        emptyState={
          <EmptyState title="Sin contratos" description="Registra tu primer contrato con el botón de arriba." />
        }
      />

      {activeWorkspaceId && editing && (
        <ContractFormDialog
          workspaceId={activeWorkspaceId}
          contract={editing}
          open={!!editing}
          onOpenChange={(next) => !next && setEditing(null)}
        />
      )}

      <ContractDetailDialog contract={detalle} onOpenChange={(next) => !next && setDetalle(null)} />
    </PageShell>
  );
}

export default function ContratosPage() {
  return (
    <WorkspaceGate type="EMPLOYMENT">
      <ContratosContent />
    </WorkspaceGate>
  );
}
