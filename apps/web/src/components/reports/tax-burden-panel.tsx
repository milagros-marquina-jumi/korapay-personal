'use client';

import { formatMoney } from '@korapay/domain';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TaxBurden } from '@/lib/api.types';

interface TaxBurdenPanelProps {
  readonly taxBurden?: TaxBurden;
}

const HIGH_RATE = 15;

function rateClass(rate: number) {
  if (rate >= HIGH_RATE) return 'text-danger';
  if (rate > 0) return 'text-warning';
  return 'text-muted-foreground';
}

export function TaxBurdenPanel({ taxBurden }: TaxBurdenPanelProps) {
  const rows = taxBurden?.rows ?? [];

  if (!rows.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ingresos después de renta</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-12 text-center text-sm text-muted-foreground">
            Registra obligaciones de renta para ver cuánto te queda después de impuestos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totals = taxBurden?.totals;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingresos después de renta</CardTitle>
        <CardDescription>
          La renta de un año se declara y paga al año siguiente, así que el mismo impuesto se puede mirar de dos formas.
          <span className="mt-1 block">
            <span className="font-medium text-foreground">Devengado:</span> le resta a cada año la renta que ese año
            generó, aunque la pagues después. Sirve para saber cuánto te dejó realmente ese año de trabajo.
          </span>
          <span className="mt-1 block">
            <span className="font-medium text-foreground">Caja:</span> le resta a cada año la renta que efectivamente
            saliste a pagar en él (la del año anterior). Sirve para ver tu flujo de dinero real.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-3 py-2.5 font-medium" rowSpan={2}>
                  Año
                </th>
                <th className="px-3 py-2.5 text-right font-medium" rowSpan={2}>
                  Ingreso neto
                </th>
                <th
                  className="border-l px-3 py-2 text-center font-medium"
                  colSpan={3}
                  title="Renta que generó ese año, aunque se pague al año siguiente"
                >
                  Devengado
                  <span className="block font-normal text-[10px] text-muted-foreground">renta que generó</span>
                </th>
                <th
                  className="border-l px-3 py-2 text-center font-medium"
                  colSpan={3}
                  title="Renta que se pagó durante ese año, correspondiente al ejercicio anterior"
                >
                  Caja
                  <span className="block font-normal text-[10px] text-muted-foreground">renta que pagó</span>
                </th>
              </tr>
              <tr className="border-b bg-muted/40 text-left">
                <th className="border-l px-3 py-2 text-right text-xs font-medium text-muted-foreground">Renta</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Te queda</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Tasa</th>
                <th className="border-l px-3 py-2 text-right text-xs font-medium text-muted-foreground">Renta</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Te queda</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Tasa</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.year} className="border-b last:border-0">
                  <td className="px-3 py-2.5 font-semibold">{r.year}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(r.income, 'PEN')}</td>
                  <td className="border-l px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatMoney(r.accruedTax, 'PEN')}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                    {formatMoney(r.accruedNet, 'PEN')}
                  </td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${rateClass(r.accruedRate)}`}>
                    {r.accruedRate}%
                  </td>
                  <td className="border-l px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                    {formatMoney(r.cashTax, 'PEN')}
                    {r.cashTaxYear !== null && <span className="ml-1 text-xs">{`(de ${r.cashTaxYear})`}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium tabular-nums">{formatMoney(r.cashNet, 'PEN')}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${rateClass(r.cashRate)}`}>{r.cashRate}%</td>
                </tr>
              ))}
            </tbody>
            {totals && (
              <tfoot>
                <tr className="border-t-2 bg-muted/30 font-semibold">
                  <td className="px-3 py-2.5">Total</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(totals.income, 'PEN')}</td>
                  <td className="border-l px-3 py-2.5 text-right tabular-nums">
                    {formatMoney(totals.accruedTax, 'PEN')}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(totals.accruedNet, 'PEN')}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums ${rateClass(totals.accruedRate)}`}>
                    {totals.accruedRate}%
                  </td>
                  <td className="border-l px-3 py-2.5 text-right tabular-nums">{formatMoney(totals.cashTax, 'PEN')}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(totals.cashNet, 'PEN')}</td>
                  <td className="px-3 py-2.5" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
