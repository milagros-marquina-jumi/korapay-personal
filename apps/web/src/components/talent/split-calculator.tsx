'use client';

import { formatMoney } from '@korapay/domain';
import { Delete, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { evaluarExpresion } from '@/lib/calc-eval';
import { calcularReparto, cuadraReparto } from '@/lib/payment-split';
import { cn } from '@/lib/utils';

interface Valores {
  salary?: string;
  amountWithDiscount?: string;
  amountReceived?: string;
  amountRetained?: string;
}

interface Props {
  values: Valores;
  onApply: (campo: 'amountReceived' | 'amountRetained' | 'amountWithDiscount' | 'salary', valor: string) => void;
  onClose: () => void;
}

const TECLAS = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '%', '+'];

const DESTINOS = [
  { campo: 'salary', label: 'Sueldo' },
  { campo: 'amountWithDiscount', label: 'Le llega' },
  { campo: 'amountReceived', label: 'Recibí' },
  { campo: 'amountRetained', label: 'Se quedó' },
] as const;

export function SplitCalculator({ values, onApply, onClose }: Readonly<Props>) {
  const [expr, setExpr] = useState('');
  const resultado = evaluarExpresion(expr);
  const { base, repartido, porRepartir } = calcularReparto(values);
  const money = (v: number) => formatMoney(String(v), 'PEN');
  const cuadra = cuadraReparto(values);

  const pulsar = (t: string) => setExpr((v) => v + t);

  return (
    <aside
      data-calculadora
      className="pointer-events-auto absolute top-0 left-full z-[70] ml-4 hidden w-64 rounded-xl border border-border bg-card p-4 shadow-lift lg:block"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold text-sm">Calculadora</p>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-6"
          aria-label="Cerrar calculadora"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      <Input
        aria-label="Operación"
        value={expr}
        onChange={(e) => setExpr(e.target.value)}
        placeholder="Ej. 6000-2600"
        className="text-right font-mono"
      />
      <p
        className={cn(
          'mt-1 h-5 text-right font-semibold text-sm tabular-nums',
          resultado === null && expr ? 'text-destructive' : 'text-foreground',
        )}
      >
        {expr ? (resultado === null ? 'Operación inválida' : money(resultado)) : ''}
      </p>

      <div className="mt-2 grid grid-cols-4 gap-1">
        {TECLAS.map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={/[\d.]/.test(t) ? 'outline' : 'secondary'}
            className="h-8 px-0 font-mono text-sm"
            onClick={() => pulsar(t)}
          >
            {t}
          </Button>
        ))}
        <Button type="button" size="sm" variant="ghost" className="col-span-2 h-8 text-xs" onClick={() => setExpr('')}>
          Limpiar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="col-span-2 h-8"
          aria-label="Borrar último"
          onClick={() => setExpr((v) => v.slice(0, -1))}
        >
          <Delete className="size-4" />
        </Button>
      </div>

      <div className="mt-3 space-y-1.5 border-t pt-3">
        <p className="text-[11px] text-muted-foreground">Enviar resultado a:</p>
        <div className="grid grid-cols-2 gap-1">
          {DESTINOS.map((d) => (
            <Button
              key={d.campo}
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              disabled={resultado === null}
              onClick={() => onApply(d.campo, resultado?.toFixed(2) ?? '')}
            >
              {d.label}
            </Button>
          ))}
        </div>
      </div>

      <dl className="mt-3 space-y-1 border-t pt-3 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Le llega</dt>
          <dd className="font-semibold tabular-nums">{money(base)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Repartido</dt>
          <dd className="tabular-nums">{money(repartido)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">{porRepartir >= 0 ? 'Falta repartir' : 'Te pasaste'}</dt>
          <dd className={cn('font-semibold tabular-nums', cuadra ? 'text-success' : 'text-destructive')}>
            {money(Math.abs(porRepartir))}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
