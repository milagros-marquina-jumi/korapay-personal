'use client';

import { formatMoney } from '@korapay/domain';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TalentPivotPeriod } from '@/lib/api.types';

interface Props {
  periods: TalentPivotPeriod[];
  columns: string[];
  totalLabel?: string;
}

export function PivotTable({ periods, columns, totalLabel = 'Total' }: Props) {
  const columnTotals = new Map<string, number>();
  let grandTotal = 0;
  for (const p of periods) {
    for (const c of p.cells) {
      columnTotals.set(c.name, (columnTotals.get(c.name) ?? 0) + Number(c.amount));
      grandTotal += Number(c.amount);
    }
  }

  if (!periods.length) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Sin datos para este periodo.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-card">Mes</TableHead>
            {columns.map((name) => (
              <TableHead key={name} className="whitespace-nowrap text-right">
                {name}
              </TableHead>
            ))}
            <TableHead className="whitespace-nowrap text-right font-semibold">{totalLabel}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {periods.map((p) => {
            const byName = new Map(p.cells.map((c) => [c.name, c.amount]));
            return (
              <TableRow key={`${p.year}-${p.month}`}>
                <TableCell className="sticky left-0 whitespace-nowrap bg-card text-sm capitalize">{p.label}</TableCell>
                {columns.map((name) => {
                  const value = byName.get(name);
                  return (
                    <TableCell key={name} className="text-right tabular-nums">
                      {value && Number(value) > 0 ? (
                        formatMoney(value, 'PEN')
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="text-right font-semibold tabular-nums">{formatMoney(p.total, 'PEN')}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="border-t-2 bg-muted/40">
            <TableCell className="sticky left-0 bg-muted/40 text-sm font-semibold">Total</TableCell>
            {columns.map((name) => (
              <TableCell key={name} className="text-right font-semibold tabular-nums">
                {formatMoney(String(columnTotals.get(name) ?? 0), 'PEN')}
              </TableCell>
            ))}
            <TableCell className="text-right font-bold tabular-nums">
              {formatMoney(String(grandTotal), 'PEN')}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
