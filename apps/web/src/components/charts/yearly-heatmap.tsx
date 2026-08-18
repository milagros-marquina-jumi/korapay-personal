'use client';

import { formatMoney } from '@korapay/domain';
import { TalentName } from '@/components/talent/talent-name';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface FilaTalento {
  talentId?: string;
  name: string;
  status: string;
  role?: string | null;
  years: { year: number; received: string; paid: string; count: number }[];
}

interface Props {
  data: FilaTalento[];
  metric?: 'received' | 'paid';
}

function tono(valor: number, max: number): string {
  if (valor <= 0) return 'bg-muted/30 text-muted-foreground/60';
  const r = valor / max;
  if (r > 0.75) return 'bg-brand text-white';
  if (r > 0.5) return 'bg-brand/70 text-white';
  if (r > 0.25) return 'bg-brand/45 text-foreground';
  return 'bg-brand/20 text-foreground';
}

function Variacion({ actual, previo }: Readonly<{ actual: number; previo: number | null }>) {
  if (previo === null || previo === 0) return null;
  const pct = ((actual - previo) / previo) * 100;
  if (!Number.isFinite(pct) || Math.abs(pct) < 0.5) return null;
  const subio = pct > 0;
  return (
    <span className={cn('block text-[10px] font-semibold', subio ? 'text-success' : 'text-destructive')}>
      {subio ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

export function YearlyHeatmap({ data, metric = 'received' }: Readonly<Props>) {
  const years = [...new Set(data.flatMap((d) => d.years.map((y) => y.year)))].sort((a, b) => a - b);
  if (!data.length || !years.length) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Sin datos.</p>;
  }

  const valorDe = (fila: FilaTalento, year: number) => {
    const y = fila.years.find((v) => v.year === year);
    if (!y) return null;
    return metric === 'received' ? Number(y.received) : Number(y.paid);
  };
  const max = Math.max(1, ...data.flatMap((f) => years.map((y) => valorDe(f, y) ?? 0)));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 min-w-44 bg-card">Talento</TableHead>
              {years.map((y) => (
                <TableHead key={y} className="min-w-28 px-3 text-center">
                  {y}
                </TableHead>
              ))}
              <TableHead className="min-w-28 px-3 text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((fila) => {
              const total = years.reduce((s, y) => s + (valorDe(fila, y) ?? 0), 0);
              return (
                <TableRow key={fila.talentId ?? fila.name}>
                  <TableCell className="sticky left-0 z-10 bg-card font-medium">
                    <TalentName name={fila.name} role={fila.role} status={fila.status} />
                  </TableCell>
                  {years.map((y, i) => {
                    const v = valorDe(fila, y);
                    const previo = i > 0 ? valorDe(fila, years[i - 1] as number) : null;
                    return (
                      <TableCell key={y} className="p-1.5 text-center">
                        {v === null ? (
                          <span className="block rounded-md bg-muted/20 py-2 text-xs text-muted-foreground/50">-</span>
                        ) : (
                          <span
                            className={cn('block rounded-md py-2 text-xs font-semibold tabular-nums', tono(v, max))}
                          >
                            {formatMoney(String(v), 'PEN')}
                            <Variacion actual={v} previo={previo} />
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="px-3 text-right font-semibold tabular-nums">
                    {formatMoney(String(total), 'PEN')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Cuanto más intenso el color, mayor el monto de ese año. El porcentaje compara contra el año anterior del mismo
        talento: verde subió, rojo bajó.
      </p>
    </div>
  );
}
