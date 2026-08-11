'use client';

import { formatMoney } from '@korapay/domain';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { StatusToggle } from '@/components/data-table/status-toggle';
import { IconAction } from '@/components/ui/icon-action';
import type { Transaction } from '@/lib/api.types';
import { accountNumber, grossOf } from '@/lib/employment-income';
import { splitTags, type TagCatalogs } from '@/lib/transaction-tags';
import { formatMonthYear } from '@/lib/utils';

interface Options {
  workspaceId: string | null;
  companyName: (id?: string | null) => string | undefined;
  catalogs: TagCatalogs;
  onEdit: (tx: Transaction) => void;
  onRemove: (tx: Transaction) => void;
  showDate?: boolean;
}

export function buildIncomeColumns({
  workspaceId,
  companyName,
  catalogs,
  onEdit,
  onRemove,
  showDate = true,
}: Options): ColumnDef<Transaction, unknown>[] {
  const columns: ColumnDef<Transaction, unknown>[] = [];

  if (showDate) {
    columns.push({
      accessorKey: 'date',
      header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
      cell: ({ row }) => <span className="text-sm capitalize">{formatMonthYear(row.original.date)}</span>,
    });
  }

  columns.push(
    {
      accessorKey: 'concept',
      header: ({ column }) => <SortableHeader column={column} label="Concepto" />,
      cell: ({ row }) => (
        <span className="block max-w-[20rem] truncate font-medium" title={row.original.concept}>
          {row.original.concept}
        </span>
      ),
    },
    {
      id: 'company',
      header: 'Empresa',
      cell: ({ row }) => {
        const payment = splitTags(row.original.tags, catalogs).paymentMethod;
        return (
          <div className="flex flex-col">
            <span>{companyName(row.original.companyId) ?? row.original.category?.name ?? '-'}</span>
            {payment && <span className="text-xs text-muted-foreground">{payment}</span>}
          </div>
        );
      },
    },
    {
      id: 'bank',
      header: 'Banco',
      cell: ({ row }) => {
        const bank = splitTags(row.original.tags, catalogs).bank;
        const account = accountNumber(row.original.notes);
        if (!bank && !account) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-col" title={row.original.notes ?? undefined}>
            <span className="text-sm">{bank ?? '-'}</span>
            {account && (
              <span className="max-w-[11rem] truncate text-xs tabular-nums text-muted-foreground">{account}</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'amountGross',
      accessorFn: (r) => Number(r.amountGross ?? r.amountBase),
      sortingFn: 'basic',
      header: ({ column }) => <SortableHeader column={column} label="Bruto" className="ml-auto" />,
      cell: ({ row }) => {
        const gross = grossOf(row.original);
        const discount = gross - Number(row.original.amountBase);
        return (
          <div className="flex flex-col items-end">
            <span className="tabular-nums text-muted-foreground">{formatMoney(String(gross), 'PEN')}</span>
            {discount > 0.005 && (
              <span className="text-xs tabular-nums text-muted-foreground/70">
                -{formatMoney(String(discount), 'PEN')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'amount',
      accessorFn: (r) => Number(r.amountBase),
      sortingFn: 'basic',
      header: ({ column }) => <SortableHeader column={column} label="Neto" className="ml-auto" />,
      cell: ({ row }) => (
        <div className="text-right font-semibold tabular-nums text-success">
          +{formatMoney(row.original.amountBase, 'PEN')}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) =>
        workspaceId ? (
          <StatusToggle transactionId={row.original.id} workspaceId={workspaceId} status={row.original.status} />
        ) : null,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-0.5">
          <IconAction icon={Pencil} label="Editar" onClick={() => onEdit(row.original)} />
          <IconAction icon={Trash2} label="Eliminar" destructive onClick={() => onRemove(row.original)} />
        </div>
      ),
    },
  );

  return columns;
}
