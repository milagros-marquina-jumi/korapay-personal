export function categoriaLedgerLabel(value?: string | null): string {
  if (!value || value === 'SIN_CATEGORIA') return 'Sin categoría';
  return value;
}
