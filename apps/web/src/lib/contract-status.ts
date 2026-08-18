interface Contrato {
  status: string;
  startDate?: string;
  endDate?: string;
}

/** El contrato terminado necesita fecha de fin; el vigente no debe tenerla. */
export function avisoContrato({ status, startDate, endDate }: Contrato): string | null {
  const fin = (endDate ?? '').trim();
  const inicio = (startDate ?? '').trim();

  if (status === 'FINISHED' && !fin) {
    return 'Marcaste el contrato como finalizado. Indica la fecha de fin para saber hasta cuándo estuvo vigente.';
  }
  if (status === 'ACTIVE' && fin) {
    return 'El contrato sigue activo pero tiene fecha de fin. Si ya terminó, cámbialo a "Finalizado"; si no, borra la fecha.';
  }
  if (fin && inicio && fin < inicio) {
    return 'La fecha de fin no puede ser anterior a la de inicio.';
  }
  return null;
}

/** Al volver a activar un contrato la fecha de fin deja de tener sentido. */
export function normalizarContrato({ status, endDate }: Contrato): string {
  if (status === 'ACTIVE') return '';
  return endDate ?? '';
}
