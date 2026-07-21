import { describe, expect, it } from 'vitest';
import {
  calculateUtility,
  formatMoney,
  fromBaseCurrency,
  remainingDebt,
  savingsProgress,
  toBaseCurrency,
  validateTalentDistribution,
} from './money';

describe('money', () => {
  it('formats PEN and USD', () => {
    expect(formatMoney('1234.5', 'PEN')).toBe('S/ 1,234.50');
    expect(formatMoney('1000000', 'USD')).toBe('$ 1,000,000.00');
  });

  it('converts USD to base PEN with rate', () => {
    expect(toBaseCurrency('10', 'USD', '3.42').toFixed(2)).toBe('34.20');
    expect(toBaseCurrency('10', 'PEN', '3.42').toFixed(2)).toBe('10.00');
  });

  it('converts base back to currency', () => {
    expect(fromBaseCurrency('34.20', 'USD', '3.42').toFixed(2)).toBe('10.00');
  });

  it('computes utility', () => {
    expect(calculateUtility('1000', '200', '300').toFixed(2)).toBe('500.00');
  });

  it('validates talent distribution within tolerance', () => {
    expect(validateTalentDistribution('3200', '1700', '1500').valid).toBe(true);
    expect(validateTalentDistribution('3200', '1700', '1400').valid).toBe(false);
  });

  it('computes remaining debt and savings progress', () => {
    expect(remainingDebt('3000', '1000').toFixed(2)).toBe('2000.00');
    expect(savingsProgress('2500', '5000').toFixed(0)).toBe('50');
    expect(savingsProgress('100', '0').toFixed(0)).toBe('0');
  });
});
