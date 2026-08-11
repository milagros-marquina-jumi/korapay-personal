'use client';

import {
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Fragment, type ReactNode, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  isLoading?: boolean;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  emptyState?: ReactNode;
  pageSize?: number;
  rowClassName?: (row: T) => string;
  getRowCanExpand?: (row: Row<T>) => boolean;
  renderExpanded?: (row: T) => ReactNode;
  footer?: ReactNode;
  /** Quita la tarjeta propia cuando la tabla ya vive dentro de una. */
  embedded?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  globalFilter,
  onGlobalFilterChange,
  emptyState,
  pageSize = 15,
  rowClassName,
  getRowCanExpand,
  renderExpanded,
  footer,
  embedded = false,
}: Readonly<DataTableProps<T>>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter, expanded },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange,
    onExpandedChange: setExpanded,
    getRowCanExpand,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;

  if (!isLoading && rows.length === 0) {
    return (
      <div className={embedded ? '' : 'space-y-3'}>
        {emptyState ?? (
          <div
            className={cn(
              'py-16 text-center text-sm text-muted-foreground',
              !embedded && 'rounded-2xl border border-dashed bg-card shadow-soft',
            )}
          >
            Sin resultados
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'space-y-3'}>
      <div className={cn(!embedded && 'overflow-hidden rounded-2xl border bg-card shadow-soft')}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={columns.length}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow className={rowClassName?.(row.original)}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && renderExpanded && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={row.getVisibleCells().length} className="p-0">
                          {renderExpanded(row.original)}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
          </TableBody>
        </Table>
        {footer && <div className="border-t bg-muted/30 px-4 py-3">{footer}</div>}

        {embedded && table.getPageCount() > 1 && (
          <div className="flex items-center justify-between gap-3 border-t bg-muted/20 px-4 py-2.5 text-sm text-muted-foreground">
            <span>{table.getFilteredRowModel().rows.length} resultados</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border px-3 py-1 transition-colors hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Anterior
              </button>
              <span className="tabular-nums">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <button
                type="button"
                className="rounded-lg border px-3 py-1 transition-colors hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {!embedded && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{table.getFilteredRowModel().rows.length} resultados</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border px-3 py-1 transition-colors hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </button>
            <span className="tabular-nums">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <button
              type="button"
              className="rounded-lg border px-3 py-1 transition-colors hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
