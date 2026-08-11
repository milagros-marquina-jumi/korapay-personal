'use client';

import { formatMoney } from '@korapay/domain';
import { statusLabel } from '@korapay/ui';
import { RecurrenceHistory } from '@/components/forms/recurrence-history';
import { DetailRow } from '@/components/transactions/due-date-hint';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Transaction } from '@/lib/api.types';
import { RECURRENCE_LABELS, TRANSACTION_TYPE_LABELS } from '@/lib/labels';
import { isFixedExpense, meaningfulTags } from '@/lib/transaction-tags';
import { formatDate, formatDateLong } from '@/lib/utils';

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
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailDialog({
  transaction,
  workspaceId,
  categoryName,
  categoryLabel = 'Categoría',
  onOpenChange,
}: Readonly<Props>) {
  const gross = transaction?.amountGross;
  const showGross = gross && Number(gross) !== Number(transaction?.amountOriginal);

  return (
    <Dialog open={transaction !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction?.concept}</DialogTitle>
          <DialogDescription>Detalle del movimiento</DialogDescription>
        </DialogHeader>
        {transaction && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <DetailRow label="Fecha" value={formatDateLong(transaction.date)} />
            <DetailRow label="Tipo" value={TRANSACTION_TYPE_LABELS[transaction.type] ?? transaction.type} />
            <DetailRow label="Monto" value={amountLabel(transaction)} />
            {showGross && (
              <DetailRow
                label="Monto bruto"
                value={`${formatMoney(gross, transaction.currency as 'PEN' | 'USD')} (descuento ${formatMoney(
                  String(Number(gross) - Number(transaction.amountOriginal)),
                  transaction.currency as 'PEN' | 'USD',
                )})`}
              />
            )}
            <DetailRow label="Estado" value={statusLabel(transaction.status)} />
            <DetailRow label={categoryLabel} value={categoryName(transaction.categoryId)} />
            {transaction.type === 'EXPENSE' && (
              <DetailRow label="Tipo de gasto" value={isFixedExpense(transaction.tags) ? 'Fijo' : 'No fijo'} />
            )}
            <DetailRow label="Medios de pago" value={paymentMethods(transaction.tags)} />
            <DetailRow label="Vencimiento" value={transaction.dueDate ? formatDateLong(transaction.dueDate) : '—'} />
            <DetailRow
              label="Recurrencia"
              value={
                transaction.isRecurring
                  ? (RECURRENCE_LABELS[transaction.recurrenceRule?.frequency ?? ''] ?? 'Sí')
                  : 'No'
              }
            />
            {transaction.isRecurring && transaction.recurrenceRule && workspaceId && (
              <RecurrenceHistory workspaceId={workspaceId} ruleId={transaction.recurrenceRule.id} />
            )}
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">Notas</dt>
              <dd className="mt-0.5 whitespace-pre-wrap">{transaction.notes || '—'}</dd>
            </div>
          </dl>
        )}
      </DialogContent>
    </Dialog>
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
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Monto en dólares</span>
              <span className="font-semibold tabular-nums">{formatMoney(transaction.amountOriginal, 'USD')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tipo de cambio del {formatDate(transaction.date)}</span>
              <span className="font-medium tabular-nums">S/ {Number(transaction.exchangeRate ?? 0).toFixed(3)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-medium">Total en soles</span>
              <span className="font-semibold tabular-nums text-brand">
                {formatMoney(transaction.amountBase, 'PEN')}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
