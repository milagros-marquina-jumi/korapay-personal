const SIN_CATEGORIA = 'Sin categoría';

export function ledgerCategoryLabel(value?: string | null): string {
  if (!value || value === 'SIN_CATEGORIA') return SIN_CATEGORIA;
  return value;
}
