'use client';

import { formatMoney } from '@korapay/domain';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { SortableHeader } from '@/components/data-table/sortable-header';
import { StatusToggle } from '@/components/data-table/status-toggle';
import { IconAction, IconActions } from '@/components/ui/icon-action';
import type { Transaction } from '@/lib/api.types';
import { accountNumber, type ConceptOrdinal, grossOf } from '@/lib/employment-income';
import { esPagoExcepcional } from '@/lib/payment-split';
import { splitTags, type TagCatalogs } from '@/lib/transaction-tags';
import { cn, formatMonthYear } from '@/lib/utils';

interface Options {
  workspaceId: string | null;
  companyName: (id?: string | null) => string | undefined;
  catalogs: TagCatalogs;
  onEdit: (tx: Transaction) => void;
  onRemove: (tx: Transaction) => void;
  onShowDetail: (tx: Transaction) => void;
  onShowConversion: (tx: Transaction) => void;
  showDate?: boolean;
  ordinals?: Map<string, ConceptOrdinal>;
  ownCompany?: string;
  onOwnCompanyClick?: (tx: Transaction) => void;
}

export function buildIncomeColumns({
  workspaceId,
  companyName,
  catalogs,
  onEdit,
  onRemove,
  onShowDetail,
  onShowConversion,
  showDate = true,
  ordinals,
  ownCompany,
  onOwnCompanyClick,
}: Options): ColumnDef<Transaction, unknown>[] {
  const columns: ColumnDef<Transaction, unknown>[] = [];

  if (showDate) {
    columns.push({
      accessorKey: 'date',
      size: 120,
      header: ({ column }) => <SortableHeader column={column} label="Fecha" />,
      cell: ({ row }) => <span className="text-sm capitalize">{formatMonthYear(row.original.date)}</span>,
    });
  }

  columns.push(
    {
      accessorKey: 'concept',
      size: 200,
      header: ({ column }) => <SortableHeader column={column} label="Concepto" />,
      cell: ({ row }) => {
        const orden = ordinals?.get(row.original.id);
        const empresa = companyName(row.original.companyId) ?? row.original.category?.name;
        return (
          <span
            className="flex max-w-[20rem] items-baseline gap-1.5"
            title={
              orden
                ? `${row.original.concept} ${orden.position} de ${orden.total} en ${empresa ?? 'esta empresa'}`
                : row.original.concept
            }
          >
            <span className={cn('truncate', esPagoExcepcional(row.original.concept) ? 'font-bold' : 'font-medium')}>
              {row.original.concept}
            </span>
            {orden && (
              <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                ({orden.position}/{orden.total})
              </span>
            )}
            {row.original.sourceRef?.startsWith('TALENT_SYNC:') && (
              <span
                className="shrink-0 rounded bg-info/15 px-1.5 py-0.5 font-medium text-[10px] text-info"
                title="Se genera automáticamente desde los pagos de Mimotalents"
              >
                Auto
              </span>
            )}
          </span>
        );
      },
    },
    {
      id: 'company',
      size: 160,
      header: 'Empresa',
      cell: ({ row }) => {
        const nombre = companyName(row.original.companyId) ?? row.original.category?.name ?? '-';
        if (ownCompany && onOwnCompanyClick && nombre === ownCompany) {
          return (
            <button
              type="button"
              onClick={() => onOwnCompanyClick(row.original)}
              title="Ver el detalle de Mimotalents de ese mes"
              className="font-medium text-brand underline decoration-dotted underline-offset-4 hover:text-brand-strong"
            >
              {nombre}
            </button>
          );
        }
        return <span className="font-medium">{nombre}</span>;
      },
    },
    {
      id: 'payment',
      size: 170,
      header: 'Forma de pago',
      cell: ({ row }) => {
        const { paymentMethod, bank } = splitTags(row.original.tags, catalogs);
        const account = accountNumber(row.original.notes);
        if (!paymentMethod && !bank) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="flex flex-col gap-0.5" title={account ? `Cuenta ${account}` : undefined}>
            <div className="flex items-center gap-1.5">
              {paymentMethod && <span className="text-sm">{paymentMethod}</span>}
              {bank && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {bank}
                </span>
              )}
            </div>
            {account && <span className="max-w-48 truncate text-xs tabular-nums text-muted-foreground">{account}</span>}
          </div>
        );
      },
    },
    {
      id: 'amountGross',
      size: 150,
      accessorFn: (r) => Number(r.amountGross ?? r.amountBase),
      sortingFn: 'basic',
      header: ({ column }) => <SortableHeader column={column} label="Bruto" />,
      cell: ({ row }) => {
        const tx = row.original;
        const isUsd = tx.currency === 'USD';
        const gross = isUsd ? Number(tx.amountOriginal) : grossOf(tx);
        const discount = isUsd ? 0 : gross - Number(tx.amountBase);
        return (
          <div className="flex flex-col items-start">
            <span className="tabular-nums text-muted-foreground">
              {formatMoney(String(gross), isUsd ? 'USD' : 'PEN')}
            </span>
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
      size: 150,
      accessorFn: (r) => Number(r.amountBase),
      sortingFn: 'basic',
      header: ({ column }) => <SortableHeader column={column} label="Neto" />,
      cell: ({ row }) => {
        const tx = row.original;
        return (
          <div className="flex items-center justify-start gap-1.5">
            <span className="font-semibold tabular-nums text-success">+{formatMoney(tx.amountBase, 'PEN')}</span>
            {tx.currency === 'USD' && (
              <button
                type="button"
                onClick={() => onShowConversion(tx)}
                title="Ver conversión a soles"
                className="rounded bg-info/15 px-1.5 py-0.5 text-[10px] font-semibold text-info hover:bg-info/25"
              >
                USD
              </button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      size: 120,
      header: 'Estado',
      cell: ({ row }) =>
        workspaceId ? (
          <StatusToggle transactionId={row.original.id} workspaceId={workspaceId} status={row.original.status} />
        ) : null,
    },
    {
      id: 'actions',
      size: 110,
      header: '',
      cell: ({ row }) => {
        const derivada = row.original.sourceRef?.startsWith('TALENT_SYNC:');
        return (
          <IconActions>
            <IconAction icon={Eye} label="Ver detalle" onClick={() => onShowDetail(row.original)} />
            {!derivada && <IconAction icon={Pencil} label="Editar" onClick={() => onEdit(row.original)} />}
            {!derivada && (
              <IconAction icon={Trash2} label="Eliminar" destructive onClick={() => onRemove(row.original)} />
            )}
          </IconActions>
        );
      },
    },
  );

  return columns;
}
