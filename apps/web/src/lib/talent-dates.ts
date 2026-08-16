import type { Talent } from '@/lib/api.types';

export interface TalentDateIssue {
  field: 'startedWithMeAt' | 'endedWithMeAt' | 'firstJobAt' | 'status';
  message: string;
}

interface TalentDates {
  status?: string;
  startedWithMeAt?: string | null;
  endedWithMeAt?: string | null;
  firstJobAt?: string | null;
  contracts?: { startDate: string; endDate?: string | null }[];
}

function dia(value?: string | null): string | null {
  return value ? value.slice(0, 10) : null;
}

export function hoyIso(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// La fecha del primer trabajo no es un dato aparte: es cuando arranca el
// contrato mas antiguo. Se deriva para que no haya que escribirla a mano.
export function primerContrato(contracts?: { startDate: string }[]): string | null {
  const fechas = (contracts ?? []).map((c) => dia(c.startDate)).filter((d): d is string => !!d);
  if (!fechas.length) return null;
  return fechas.reduce((min, f) => (f < min ? f : min));
}

// Un talento sigue conmigo mientras no tenga fecha de fin. Poner esa fecha es lo
// que lo cierra, y el estado debe acompañarla en vez de contradecirla.
export function estadoEsperado(endedWithMeAt?: string | null, hoy: string = hoyIso()): 'ACTIVE' | 'INACTIVE' {
  const fin = dia(endedWithMeAt);
  if (!fin) return 'ACTIVE';
  return fin <= hoy ? 'INACTIVE' : 'ACTIVE';
}

export function validarFechasTalento(t: TalentDates, hoy: string = hoyIso()): TalentDateIssue[] {
  const inicio = dia(t.startedWithMeAt);
  const fin = dia(t.endedWithMeAt);
  const primerTrabajo = dia(t.firstJobAt);
  const contrato = primerContrato(t.contracts);
  const issues: TalentDateIssue[] = [];

  if (inicio && fin && fin < inicio) {
    issues.push({ field: 'endedWithMeAt', message: 'La fecha de fin no puede ser anterior a la de inicio.' });
  }

  if (primerTrabajo && inicio && primerTrabajo < inicio) {
    issues.push({
      field: 'firstJobAt',
      message: 'El primer trabajo no puede empezar antes de que el talento llegue.',
    });
  }

  if (primerTrabajo && fin && primerTrabajo > fin) {
    issues.push({
      field: 'firstJobAt',
      message: 'El primer trabajo no puede empezar después de que el talento se haya ido.',
    });
  }

  if (primerTrabajo && contrato && primerTrabajo !== contrato) {
    issues.push({
      field: 'firstJobAt',
      message: `No coincide con su primer contrato (${contrato}). Se toma el contrato como fecha real.`,
    });
  }

  if (primerTrabajo && !contrato) {
    issues.push({
      field: 'firstJobAt',
      message: 'Tiene fecha de primer trabajo pero ningún contrato registrado, por eso figura como "Nunca colocado".',
    });
  }

  const esperado = estadoEsperado(t.endedWithMeAt, hoy);
  if (t.status && t.status !== esperado) {
    issues.push({
      field: 'status',
      message:
        esperado === 'INACTIVE'
          ? 'Tiene fecha de fin ya cumplida, así que debería estar inactivo.'
          : 'Está inactivo pero no tiene fecha de fin: indica cuándo dejó de trabajar contigo.',
    });
  }

  return issues;
}

export function primerTrabajoDe(talent: Pick<Talent, 'firstJobAt' | 'contracts'>): string | null {
  return primerContrato(talent.contracts) ?? dia(talent.firstJobAt);
}
