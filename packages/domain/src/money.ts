import Decimal from 'decimal.js';
import type { Currency } from './enums';
import { BASE_CURRENCY } from './enums';
export type MoneyAmount = string;
export function toBaseCurrency(amount: Decimal.Value, currency: Currency, exchangeRate: Decimal.Value): Decimal {
  const amt = new Decimal(amount);
  if (currency === BASE_CURRENCY) return amt;
  return amt.mul(new Decimal(exchangeRate));
}
export function fromBaseCurrency(
  amountBase: Decimal.Value,
  targetCurrency: Currency,
  exchangeRate: Decimal.Value,
): Decimal {
  const amt = new Decimal(amountBase);
  if (targetCurrency === BASE_CURRENCY) return amt;
  return amt.div(new Decimal(exchangeRate));
}
export function formatMoney(amount: Decimal.Value, currency: Currency = BASE_CURRENCY): string {
  const amt = new Decimal(amount);
  const formatted = amt.toFixed(2);
  const [intPart, decPart] = formatted.split('.');
  const withCommas = intPart?.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (currency === 'PEN') return `S/ ${withCommas}.${decPart}`;
  return `$ ${withCommas}.${decPart}`;
}
export function serializeMoney(value: Decimal): string {
  return value.toFixed(2);
}
export function parseMoney(value: string): Decimal {
  return new Decimal(value);
}
export function calculateUtility(income: Decimal.Value, costs: Decimal.Value, teamPayments: Decimal.Value): Decimal {
  return new Decimal(income).minus(costs).minus(teamPayments);
}
export function validateTalentDistribution(
  amountWithDiscount: Decimal.Value,
  amountReceived: Decimal.Value,
  amountRetained: Decimal.Value,
): { valid: boolean; difference: Decimal } {
  const total = new Decimal(amountReceived).plus(amountRetained);
  const expected = new Decimal(amountWithDiscount);
  const diff = expected.minus(total);
  return { valid: diff.abs().lessThanOrEqualTo(0.01), difference: diff };
}
export function remainingDebt(originalAmount: Decimal.Value, totalPaid: Decimal.Value): Decimal {
  return new Decimal(originalAmount).minus(totalPaid);
}
export function savingsProgress(currentAmount: Decimal.Value, targetAmount: Decimal.Value): Decimal {
  const target = new Decimal(targetAmount);
  if (target.isZero()) return new Decimal(0);
  return new Decimal(currentAmount).div(target).mul(100);
}
