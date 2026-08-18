interface Contrato {
  status: string;
  startDate?: string;
  endDate?: string;
}

export function avisoContrato({ status, startDate, endDate }: Contrato): string | null {
  const fin = (endDate ?? '').trim();
  const inicio = (startDate ?? '').trim();

  if (fin && inicio && fin < inicio) {
    return 'La fecha de fin no puede ser anterior a la de inicio.';
  }
  if (status === 'FINISHED' && !fin) {
    return 'Marcaste el contrato como finalizado. Indica la fecha de fin para saber hasta cuándo estuvo vigente.';
  }
  if (status === 'ACTIVE' && fin && fin < hoyIso()) {
    return 'La fecha de fin ya pasó y el contrato sigue como activo. Si ya terminó, cámbialo a "Finalizado".';
  }
  return null;
}

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function normalizarContrato({ endDate }: Contrato): string {
  return endDate ?? '';
}
