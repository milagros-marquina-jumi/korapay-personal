import { describe, expect, it } from 'vitest';
import { detectBankAccount, mapExcelStatus, maskBankAccount, redactSensitiveData } from './validation';

describe('validation', () => {
  it('masks bank accounts', () => {
    expect(maskBankAccount('19339612288010')).toEqual({ masked: '****8010', lastFour: '8010' });
  });

  it('detects bank account patterns', () => {
    expect(detectBankAccount('cuenta 19339612288010')).toBe(true);
    expect(detectBankAccount('hola mundo')).toBe(false);
  });

  it('redacts sensitive numbers', () => {
    const out = redactSensitiveData('BCP 19339612288010 Visa 4111');
    expect(out).not.toContain('19339612288010');
    expect(out).toContain('***8010');
  });

  it('maps Excel statuses to enum', () => {
    expect(mapExcelStatus('Pagado')).toBe('PAID');
    expect(mapExcelStatus('Pendiente')).toBe('PENDING');
    expect(mapExcelStatus('Falta Pagar')).toBe('PENDING');
    expect(mapExcelStatus('')).toBe('PENDING_REVIEW');
    expect(mapExcelStatus(null)).toBe('PENDING_REVIEW');
  });
});
