import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('maps known statuses to Spanish labels', () => {
    expect(renderToStaticMarkup(<StatusBadge status="PAID" />)).toContain('Pagado');
    expect(renderToStaticMarkup(<StatusBadge status="PENDING" />)).toContain('Pendiente');
    expect(renderToStaticMarkup(<StatusBadge status="OVERDUE" />)).toContain('Vencido');
    expect(renderToStaticMarkup(<StatusBadge status="ACTIVE" />)).toContain('Activo');
  });

  it('falls back to the raw status for unknown values', () => {
    expect(renderToStaticMarkup(<StatusBadge status="WEIRD" />)).toContain('WEIRD');
  });
});
