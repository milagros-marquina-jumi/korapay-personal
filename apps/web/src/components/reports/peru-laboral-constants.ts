import { EXPIRING_WINDOW_DAYS } from '@korapay/domain';

export const ESSALUD_BONUS = 0.09;
export const CTS_SALARY_FACTOR = 0.5;
export const CTS_GRATIFICACION_FRACTION = 6;
export const UPCOMING_WINDOW_DAYS = EXPIRING_WINDOW_DAYS;

export type LaborEventKind = 'gratificacion' | 'cts' | 'utilidades';
export type LaborEventStatus = 'pasado' | 'proximo' | 'futuro';

export interface LaborEventSpec {
  id: string;
  kind: LaborEventKind;
  title: string;
  period: string;
  month: number;
  day: number;
  law: string;
}

export const LABOR_EVENTS: LaborEventSpec[] = [
  { id: 'cts-mayo', kind: 'cts', title: 'CTS', period: 'Nov - Abr', month: 4, day: 15, law: 'DL 650' },
  {
    id: 'grati-julio',
    kind: 'gratificacion',
    title: 'Gratificación',
    period: 'Fiestas Patrias',
    month: 6,
    day: 15,
    law: 'Ley 27735',
  },
  { id: 'cts-noviembre', kind: 'cts', title: 'CTS', period: 'May - Oct', month: 10, day: 15, law: 'DL 650' },
  {
    id: 'grati-diciembre',
    kind: 'gratificacion',
    title: 'Gratificación',
    period: 'Navidad',
    month: 11,
    day: 15,
    law: 'Ley 27735',
  },
  {
    id: 'utilidades',
    kind: 'utilidades',
    title: 'Utilidades',
    period: 'Referencial',
    month: 2,
    day: 31,
    law: 'DL 892',
  },
];

export const STATUS_STYLES: Record<LaborEventStatus, { label: string; className: string }> = {
  pasado: { label: 'Pagado', className: 'border-border bg-muted/60 text-muted-foreground' },
  proximo: { label: 'Próximo', className: 'border-warning/25 bg-warning/10 text-warning' },
  futuro: { label: 'Pendiente', className: 'border-info/25 bg-info/10 text-info' },
};

export const OTHER_BENEFITS = [
  { title: 'Vacaciones', value: '30 días', note: 'por año completo', law: 'DL 713' },
  { title: 'EsSalud', value: '9%', note: 'lo aporta la empresa', law: '' },
  { title: 'AFP / ONP', value: '~12.5% / 13%', note: 'se descuenta del sueldo', law: '' },
];
