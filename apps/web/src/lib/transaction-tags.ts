// Las transacciones guardan en `tags` cuatro cosas mezcladas: el tipo de gasto (Fijo/No Fijo),
// el medio de pago, el banco y restos heredados de la migracion (meses, cargos). Este modulo
// es la unica fuente de verdad para separarlos.

export const FIXED_TAG = 'Fijo';
export const VARIABLE_TAG = 'No Fijo';

export const EXPENSE_TYPE_TAGS = [FIXED_TAG, VARIABLE_TAG];

// Nombres de mes en mayusculas que la migracion dejo como tags sueltos.
const MONTH_TAG = /^(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)/;

export function isExpenseTypeTag(tag: string): boolean {
  return EXPENSE_TYPE_TAGS.includes(tag);
}

export function isMonthTag(tag: string): boolean {
  return MONTH_TAG.test(tag);
}

export function isFixedExpense(tags?: string[] | null): boolean {
  return tags?.includes(FIXED_TAG) ?? false;
}

export const RENTA_TAG = 'Renta';

// Los gastos generados al pagar una cuota de renta anual pertenecen al cronograma
// tributario: su monto y fecha salen de la cuota, no se editan desde movimientos.
export function isRentaInstallment(tags?: string[] | null): boolean {
  return tags?.includes(RENTA_TAG) ?? false;
}

export function meaningfulTags(tags?: string[] | null): string[] {
  return (tags ?? []).filter((t) => !isExpenseTypeTag(t) && !isMonthTag(t));
}

export interface TagCatalogs {
  paymentMethods: ReadonlySet<string>;
  banks: ReadonlySet<string>;
}

export interface TagSplit {
  paymentMethod: string | null;
  bank: string | null;
  rest: string[];
}

export function splitTags(tags: string[] | null | undefined, catalogs: TagCatalogs): TagSplit {
  const split: TagSplit = { paymentMethod: null, bank: null, rest: [] };

  for (const tag of tags ?? []) {
    if (isExpenseTypeTag(tag)) continue;
    if (!split.paymentMethod && catalogs.paymentMethods.has(tag)) {
      split.paymentMethod = tag;
      continue;
    }
    if (!split.bank && catalogs.banks.has(tag)) {
      split.bank = tag;
      continue;
    }
    split.rest.push(tag);
  }

  return split;
}

interface BuildInput {
  isFixedExpense: boolean;
  applyExpenseType: boolean;
  paymentMethod?: string | null;
  bank?: string | null;
  rest?: string[];
}

export function buildTags({
  isFixedExpense: fixed,
  applyExpenseType,
  paymentMethod,
  bank,
  rest,
}: BuildInput): string[] {
  const tags: string[] = [];
  if (applyExpenseType) tags.push(fixed ? FIXED_TAG : VARIABLE_TAG);
  if (paymentMethod) tags.push(paymentMethod);
  if (bank) tags.push(bank);
  if (rest?.length) tags.push(...rest);
  return tags;
}
