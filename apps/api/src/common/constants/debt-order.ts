interface FilaDeuda {
  pending: string;
  date: string;
}

export function ordenarDeudas<T extends FilaDeuda>(filas: T[]): T[] {
  return [...filas].sort((a, b) => {
    const pendienteA = Number(a.pending) > 0 ? 0 : 1;
    const pendienteB = Number(b.pending) > 0 ? 0 : 1;
    if (pendienteA !== pendienteB) return pendienteA - pendienteB;
    return b.date.localeCompare(a.date);
  });
}
