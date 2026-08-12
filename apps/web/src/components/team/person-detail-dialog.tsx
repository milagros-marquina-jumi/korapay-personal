'use client';

import { formatMoney } from '@korapay/domain';
import { StatusBadge } from '@korapay/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Person, Transaction } from '@/lib/api.types';
import { formatDate } from '@/lib/utils';

interface PersonDetailDialogProps {
  readonly person: Person | null;
  readonly payments: Transaction[];
  readonly onOpenChange: (open: boolean) => void;
}

export function PersonDetailDialog({ person, payments, onOpenChange }: PersonDetailDialogProps) {
  if (!person) return null;

  const propios = payments.filter((t) => t.personId === person.id).sort((a, b) => b.date.localeCompare(a.date));
  const total = propios.reduce((s, t) => s + Number(t.amountBase), 0);
  const pendiente = propios.filter((t) => t.status !== 'PAID').reduce((s, t) => s + Number(t.amountBase), 0);

  return (
    <Dialog open={!!person} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {person.name}
            {person.status && <StatusBadge status={person.status} />}
          </DialogTitle>
        </DialogHeader>

        <div className="min-w-0 space-y-4 text-sm">
          <div className="grid min-w-0 grid-cols-2 gap-3">
            <div className="min-w-0 rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Total pagado</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums">{formatMoney(String(total), 'PEN')}</p>
            </div>
            <div className="min-w-0 rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Pendiente</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-warning">
                {formatMoney(String(pendiente), 'PEN')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {person.role && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rol</span>
                <span className="font-medium">{person.role}</span>
              </div>
            )}
            {person.salary && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sueldo acordado</span>
                <span className="font-medium tabular-nums">{formatMoney(person.salary, 'PEN')}</span>
              </div>
            )}
            {person.email && (
              <div className="flex items-center justify-between gap-4">
                <span className="shrink-0 text-muted-foreground">Correo</span>
                <span className="truncate font-medium">{person.email}</span>
              </div>
            )}
            {person.phone && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Teléfono</span>
                <span className="font-medium">{person.phone}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pagos registrados</span>
              <span className="font-medium tabular-nums">{propios.length}</span>
            </div>
          </div>

          {propios.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Últimos pagos</p>
              <div className="max-h-56 overflow-auto rounded-lg border">
                <table className="w-full table-fixed text-sm">
                  <tbody>
                    {propios.slice(0, 10).map((t) => (
                      <tr key={t.id} className="border-b last:border-0">
                        <td className="w-24 whitespace-nowrap px-2 py-2 text-xs text-muted-foreground">
                          {formatDate(t.date)}
                        </td>
                        <td className="px-2 py-2">
                          <p className="truncate" title={t.description ?? undefined}>
                            {t.description || '—'}
                          </p>
                        </td>
                        <td className="w-24 whitespace-nowrap px-2 py-2 text-right font-medium tabular-nums">
                          {formatMoney(t.amountBase, 'PEN')}
                        </td>
                        <td className="w-20 px-2 py-2">
                          <StatusBadge status={t.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
