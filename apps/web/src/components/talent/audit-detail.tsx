'use client';

import { formatMoney } from '@korapay/domain';
import { statusLabel } from '@korapay/ui';
import type { TalentAuditEntry } from '@/lib/api.types';
import { formatDate } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = { EGRESO: 'Egreso', DEUDA: 'Deuda' };

interface LedgerSnapshot {
  date?: string;
  type?: string;
  paidAmount?: string;
  debtAmount?: string;
  pendingAmount?: string;
  status?: string;
  description?: string | null;
}

interface CampoSnapshot {
  key: string;
  label: string;
  value: string;
}

function snapshotFields(snap: LedgerSnapshot): CampoSnapshot[] {
  const fields: CampoSnapshot[] = [];
  if (snap.date) fields.push({ key: 'date', label: 'Fecha', value: formatDate(snap.date) });
  if (snap.type) fields.push({ key: 'type', label: 'Tipo', value: TYPE_LABELS[snap.type] ?? snap.type });
  if (snap.paidAmount !== undefined)
    fields.push({ key: 'paidAmount', label: 'Pagado', value: formatMoney(snap.paidAmount, 'PEN') });
  if (snap.debtAmount !== undefined)
    fields.push({ key: 'debtAmount', label: 'Deuda', value: formatMoney(snap.debtAmount, 'PEN') });
  if (snap.pendingAmount !== undefined)
    fields.push({ key: 'pendingAmount', label: 'Falta pagar', value: formatMoney(snap.pendingAmount, 'PEN') });
  if (snap.status) fields.push({ key: 'status', label: 'Estado', value: statusLabel(snap.status) });
  if (snap.description) fields.push({ key: 'description', label: 'Descripción', value: snap.description });
  return fields;
}

function resumenDelCambio(before: LedgerSnapshot, after: LedgerSnapshot): string | null {
  const saldado = before.status !== 'PAID' && after.status === 'PAID';
  const reabierto = before.status === 'PAID' && after.status !== 'PAID';
  const debia = before.pendingAmount !== undefined ? formatMoney(before.pendingAmount, 'PEN') : null;
  if (saldado) return debia ? `Saldó la deuda: debía ${debia}` : 'Marcó la deuda como saldada';
  if (reabierto) return 'Revirtió el pago: vuelve a estar pendiente';
  if (Number(after.paidAmount ?? 0) > Number(before.paidAmount ?? 0)) return 'Registró un pago';
  return null;
}

function tituloRegistro(snap?: LedgerSnapshot): string | null {
  if (!snap) return null;
  const descripcion = snap.description?.trim();
  if (descripcion) return descripcion;
  const tipo = snap.type ? (TYPE_LABELS[snap.type] ?? snap.type) : 'Registro';
  const monto = snap.debtAmount ?? snap.paidAmount;
  const partes = [tipo];
  if (monto !== undefined) partes.push(`de ${formatMoney(monto, 'PEN')}`);
  if (snap.date) partes.push(`del ${formatDate(snap.date)}`);
  return partes.join(' ');
}

export function AuditDetail({ entry }: { entry: TalentAuditEntry }) {
  const before = entry.changes?.before as LedgerSnapshot | undefined;
  const after = entry.changes?.after as LedgerSnapshot | undefined;

  if (entry.action === 'DELETE' && before) {
    return (
      <div className="space-y-0.5 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">
          Registro eliminado{tituloRegistro(before) ? `: ${tituloRegistro(before)}` : ''}
        </p>
        {snapshotFields(before)
          .filter((f) => f.key !== 'description')
          .map((f) => (
            <p key={f.key}>
              {f.label}: {f.value}
            </p>
          ))}
      </div>
    );
  }

  if (entry.action === 'UPDATE' && before && after) {
    const previas = new Map(snapshotFields(before).map((f) => [f.key, f.value]));
    const actuales = snapshotFields(after);
    const clavesActuales = new Set(actuales.map((f) => f.key));
    const changed = [
      ...actuales.filter((f) => previas.get(f.key) !== f.value),
      ...snapshotFields(before)
        .filter((f) => !clavesActuales.has(f.key))
        .map((f) => ({ ...f, value: '—' })),
    ];
    const titulo = tituloRegistro(before) ?? tituloRegistro(after);
    const motivo = resumenDelCambio(before, after);
    return (
      <div className="space-y-0.5 text-xs text-muted-foreground">
        {titulo && <p className="font-medium text-foreground">{titulo}</p>}
        {motivo && <p className="text-foreground/80">{motivo}</p>}
        {changed.length ? (
          changed.map((f) => {
            const anterior = previas.get(f.key);
            return (
              <p key={f.key}>
                {f.label}:{' '}
                {anterior !== undefined && (
                  <>
                    <span className="text-muted-foreground/70 line-through">{anterior}</span>{' '}
                    <span aria-hidden="true">→</span>{' '}
                  </>
                )}
                <span className="font-medium text-foreground">{f.value}</span>
              </p>
            );
          })
        ) : (
          <p>Sin cambios de valor</p>
        )}
      </div>
    );
  }

  if (after) {
    const titulo = tituloRegistro(after);
    return (
      <div className="space-y-0.5 text-xs text-muted-foreground">
        {titulo && <p className="font-medium text-foreground">{titulo}</p>}
        {snapshotFields(after)
          .filter((f) => f.key !== 'description')
          .map((f) => (
            <p key={f.key}>
              {f.label}: {f.value}
            </p>
          ))}
      </div>
    );
  }

  return <span className="text-xs text-muted-foreground">—</span>;
}
