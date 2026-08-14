'use client';

import { formatMoney, type ParsedScheduleRow, parseTaxSchedule, scheduleTotals } from '@korapay/domain';
import { AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';

const EJEMPLO = `1   31/07/2025   1,419.00   144.00   1,563.00
2   29/08/2025   1,429.00   117.00   1,546.00`;

const MAX_CRONOGRAMA = 8000;

interface Props {
  texto: string;
  onTextoChange: (texto: string) => void;
  rows: ParsedScheduleRow[];
  warnings: string[];
}

export function useParsedSchedule(texto: string) {
  return useMemo(() => parseTaxSchedule(texto), [texto]);
}

export function SchedulePasteField({ texto, onTextoChange, rows, warnings }: Readonly<Props>) {
  const totals = useMemo(() => scheduleTotals(rows), [rows]);

  return (
    <div className="space-y-3">
      <Textarea
        value={texto}
        onChange={(e) => onTextoChange(e.target.value)}
        rows={10}
        maxLength={MAX_CRONOGRAMA}
        placeholder={EJEMPLO}
        className="max-h-[32vh] min-h-40 resize-y whitespace-pre font-mono text-xs leading-relaxed"
        aria-label="Cronograma pegado"
      />

      {warnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/8 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden="true" />
          <ul className="min-w-0 space-y-0.5 text-warning-foreground text-xs">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-4">
            <div>
              <p className="text-[11px] text-muted-foreground">Cuotas</p>
              <p className="font-semibold text-sm tabular-nums">{rows.length}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Deuda original</p>
              <p className="font-semibold text-sm tabular-nums">{formatMoney(totals.principal, 'PEN')}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Interés</p>
              <p className="font-semibold text-sm text-warning-foreground tabular-nums">
                +{formatMoney(totals.interest, 'PEN')}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Total</p>
              <p className="font-semibold text-sm tabular-nums">{formatMoney(totals.total, 'PEN')}</p>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card shadow-[inset_0_-1px_0_var(--color-border)]">
                <tr className="text-left text-muted-foreground">
                  <th className="px-2 py-1.5 font-medium">#</th>
                  <th className="px-2 py-1.5 font-medium">Vence</th>
                  <th className="px-2 py-1.5 text-right font-medium">Deuda</th>
                  <th className="px-2 py-1.5 text-right font-medium">Interés</th>
                  <th className="px-2 py-1.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.number}>
                    <td className="px-2 py-1.5 tabular-nums">{r.number}</td>
                    <td className="px-2 py-1.5">{r.dueDate ? formatDate(r.dueDate) : '—'}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatMoney(r.principalAmount, 'PEN')}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatMoney(r.interestAmount, 'PEN')}</td>
                    <td className="px-2 py-1.5 text-right font-medium tabular-nums">{formatMoney(r.total, 'PEN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export function scheduleToPayload(rows: ParsedScheduleRow[]) {
  return rows.map((r) => ({
    number: r.number,
    dueDate: r.dueDate ?? undefined,
    principalAmount: r.principalAmount,
    interestAmount: r.interestAmount,
  }));
}
