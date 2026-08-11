'use client';

import { ChevronDown, RotateCcw } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { CompanyDuration } from '@/lib/api.types';
import { cn, formatDurationDays, formatDurationRange } from '@/lib/utils';

interface Props {
  data: CompanyDuration[];
  limit?: number;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function CompanyDurationTable({ data, limit }: Readonly<Props>) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = limit ? data.slice(0, limit) : data;
  const max = rows.reduce((m, r) => Math.max(m, r.totalDays), 0);

  if (!rows.length) return <p className="py-12 text-center text-sm text-muted-foreground">Sin contratos</p>;

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="w-10 px-3 py-2.5 font-medium">#</th>
            <th className="px-3 py-2.5 font-medium">Empresa</th>
            <th className="px-3 py-2.5 font-medium">Duración</th>
            <th className="w-40 px-3 py-2.5 font-medium">Periodo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const multi = row.contracts > 1;
            const open = expanded === row.name;
            const width = max > 0 ? Math.max(2, (row.totalDays / max) * 100) : 0;
            return (
              <Fragment key={row.name}>
                <tr className={cn('border-b last:border-0', multi && 'hover:bg-muted/40')}>
                  <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{index + 1}</td>
                  <td className="px-3 py-2.5">
                    {multi ? (
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : row.name)}
                        aria-expanded={open}
                        className="flex items-center gap-2 text-left hover:text-brand-strong dark:hover:text-brand"
                      >
                        <span className="font-medium">{row.name}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand-strong dark:text-brand">
                          <RotateCcw className="size-3" />
                          {row.contracts} contratos
                        </span>
                        {row.active && (
                          <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                            Activo
                          </span>
                        )}
                        <ChevronDown
                          className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')}
                        />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{row.name}</span>
                        {row.active && (
                          <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                            Activo
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${width}%` }} />
                      </div>
                      <span className="w-52 shrink-0 tabular-nums text-muted-foreground">
                        {multi
                          ? formatDurationDays(row.totalDays)
                          : formatDurationRange(row.firstStart ?? '', row.lastEnd)}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs tabular-nums text-muted-foreground">
                    {row.firstStart ? formatDate(row.firstStart) : '-'} →{' '}
                    {row.lastEnd ? formatDate(row.lastEnd) : 'hoy'}
                  </td>
                </tr>
                {multi && open && (
                  <tr className="border-b bg-muted/20 last:border-0">
                    <td />
                    <td colSpan={3} className="px-3 py-3">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Reingresos
                      </p>
                      <div className="space-y-1.5">
                        {row.periods.map((p, i) => (
                          <div key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                            <span className="w-6 shrink-0 tabular-nums text-muted-foreground">{i + 1}.</span>
                            <span className="tabular-nums">
                              {formatDate(p.startDate)} → {p.endDate ? formatDate(p.endDate) : 'hoy'}
                            </span>
                            <span className="text-muted-foreground">{formatDurationRange(p.startDate, p.endDate)}</span>
                            {p.position && <span className="text-muted-foreground">· {p.position}</span>}
                            {p.type && <span className="text-muted-foreground">· {p.type}</span>}
                            {p.active && <span className="font-medium text-success">· en curso</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
