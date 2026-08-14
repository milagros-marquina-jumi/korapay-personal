'use client';

import { formatMoney } from '@korapay/domain';
import { StatusBadge } from '@korapay/ui';
import { AlertTriangle } from 'lucide-react';
import { RecurrenceHistory } from '@/components/forms/recurrence-history';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { EmploymentContract, Transaction } from '@/lib/api.types';
import { accountNumber, type ConceptOrdinal, contractDatesInverted, looksLikeAccount } from '@/lib/employment-income';
import { RECURRENCE_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/labels';
import { isFixedExpense, meaningfulTags } from '@/lib/transaction-tags';
import { cn, formatDate, formatDateLong, formatDateMedium } from '@/lib/utils';

function paymentMethods(tags?: string[]) {
  const methods = meaningfulTags(tags);
  return methods.length ? methods.join(', ') : '—';
}

function amountLabel(tx: Transaction) {
  if (tx.currency !== 'USD') return formatMoney(tx.amountBase, 'PEN');
  return `${formatMoney(tx.amountBase, 'PEN')} (${formatMoney(tx.amountOriginal, 'USD')})`;
}

interface Props {
  transaction: Transaction | null;
  workspaceId: string | null;
  categoryName: (id?: string | null) => string;
  categoryLabel?: string;
  contract?: EmploymentContract | null;
  ordinal?: ConceptOrdinal | null;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailDialog({
  transaction,
  workspaceId,
  categoryName,
  categoryLabel = 'Categoría',
  contract,
  ordinal,
  onOpenChange,
}: Readonly<Props>) {
  const gross = transaction?.amountGross;
  const showGross = gross && Number(gross) !== Number(transaction?.amountOriginal);

  const notes = transaction?.notes ?? '';
  const account = looksLikeAccount(notes) ? accountNumber(notes) : null;
  const freeNotes = account ? '' : notes;

  const esIngreso = transaction?.type === 'INCOME';
  const descuento = showGross ? String(Number(gross) - Number(transaction?.amountOriginal)) : null;
  const moneda = (transaction?.currency ?? 'PEN') as 'PEN' | 'USD';

  return (
    <Dialog open={transaction !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {transaction && (
          <>
            <DialogHeader className="space-y-1">
              <DialogTitle className="pr-6 text-lg leading-tight">
                {transaction.concept}
                {ordinal && (
                  <span className="ml-1.5 font-normal text-base text-muted-foreground tabular-nums">
                    ({ordinal.position}/{ordinal.total})
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{TRANSACTION_TYPE_LABELS[transaction.type] ?? transaction.type}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDateLong(transaction.date)}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Monto</p>
                <p
                  className={cn('font-semibold text-2xl tabular-nums', esIngreso ? 'text-success' : 'text-foreground')}
                >
                  {esIngreso ? '+' : ''}
                  {amountLabel(transaction)}
                </p>
                {descuento && gross && (
                  <p className="mt-0.5 text-muted-foreground text-xs tabular-nums">
                    Bruto {formatMoney(gross, moneda)} · descuento {formatMoney(descuento, moneda)}
                  </p>
                )}
              </div>
              <StatusBadge status={transaction.status} />
            </div>

            <dl className="divide-y rounded-xl border text-sm">
              <DetailLine label={categoryLabel} value={categoryName(transaction.categoryId)} />
              {transaction.type === 'EXPENSE' && (
                <DetailLine label="Tipo de gasto" value={isFixedExpense(transaction.tags) ? 'Fijo' : 'No fijo'} />
              )}
              <DetailLine label="Forma de pago" value={paymentMethods(transaction.tags)} />
              {account && <DetailLine label="Número de cuenta" value={account} />}
              <DetailLine label="Vencimiento" value={transaction.dueDate ? formatDateLong(transaction.dueDate) : '—'} />
              <DetailLine
                label="Se repite"
                value={
                  transaction.isRecurring
                    ? (RECURRENCE_LABELS[transaction.recurrenceRule?.frequency ?? ''] ?? 'Sí')
                    : 'No'
                }
              />
            </dl>

            {contract && (
              <div className="rounded-xl border px-4 py-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Contrato</p>
                <p className="mt-1 font-medium text-sm">
                  {contract.position || 'Sin cargo registrado'}
                  {contract.type && <span className="ml-1.5 text-muted-foreground">· {contract.type}</span>}
                </p>
                <p className="mt-0.5 text-muted-foreground text-sm">
                  {formatDateMedium(contract.startDate)} —{' '}
                  {contract.endDate ? formatDateMedium(contract.endDate) : 'sigue activo'}
                </p>
                {contract.salary && (
                  <p className="mt-1 text-muted-foreground text-sm">
                    Sueldo bruto del contrato:{' '}
                    <span className="font-medium text-foreground tabular-nums">
                      {formatMoney(String(contract.salary), (contract.currency as 'PEN' | 'USD') ?? 'PEN')}
                    </span>
                  </p>
                )}
                {contractDatesInverted(contract) && (
                  <p className="mt-1.5 flex items-start gap-1.5 font-medium text-destructive text-xs">
                    <AlertTriangle className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>La fecha de fin de este contrato es anterior a la de inicio.</span>
                  </p>
                )}
              </div>
            )}

            {transaction.isRecurring && transaction.recurrenceRule && workspaceId && (
              <RecurrenceHistory workspaceId={workspaceId} ruleId={transaction.recurrenceRule.id} />
            )}

            {freeNotes && (
              <div className="rounded-xl border px-4 py-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Notas</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{freeNotes}</p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailLine({ label, value }: Readonly<{ label: string; value: string }>) {
  const vacio = !value || value === '—';
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="shrink-0 text-muted-foreground text-xs">{label}</dt>
      <dd
        className={cn('min-w-0 text-right font-medium tabular-nums', vacio && 'font-normal text-muted-foreground/60')}
      >
        {value || '—'}
      </dd>
    </div>
  );
}

export function UsdConversionDialog({
  transaction,
  onOpenChange,
}: Readonly<{ transaction: Transaction | null; onOpenChange: (open: boolean) => void }>) {
  return (
    <Dialog open={transaction !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conversión a soles</DialogTitle>
          <DialogDescription>{transaction?.concept}</DialogDescription>
        </DialogHeader>
        {transaction && (
          <div className="space-y-3">
            <dl className="divide-y rounded-xl border text-sm">
              <DetailLine label="Monto en dólares" value={formatMoney(transaction.amountOriginal, 'USD')} />
              <DetailLine
                label={`Tipo de cambio del ${formatDate(transaction.date)}`}
                value={`S/ ${Number(transaction.exchangeRate ?? 0).toFixed(3)}`}
              />
            </dl>
            <div className="flex items-end justify-between gap-3 rounded-xl border bg-muted/30 px-4 py-3">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total en soles</p>
              <p className="font-semibold text-2xl text-brand tabular-nums">
                {formatMoney(transaction.amountBase, 'PEN')}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
