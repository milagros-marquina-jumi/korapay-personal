export const FIXED_TAG = 'Fijo';
export const VARIABLE_TAG = 'No Fijo';

export const EXPENSE_TYPE_TAGS = [FIXED_TAG, VARIABLE_TAG];

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
