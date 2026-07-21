import { generateIngestionToken, hashIngestionToken, safeEqualHex } from './ingestion-token';

describe('ingestion token', () => {
  it('generates a prefixed token and matching hash', () => {
    const { token, hash, prefix } = generateIngestionToken();
    expect(token.startsWith('kp_ing_')).toBe(true);
    expect(prefix).toBe(token.slice(0, 14));
    expect(hashIngestionToken(token)).toBe(hash);
  });

  it('hash differs for different tokens', () => {
    const a = generateIngestionToken();
    const b = generateIngestionToken();
    expect(a.hash).not.toBe(b.hash);
  });

  it('safeEqualHex compares hashes', () => {
    const { token, hash } = generateIngestionToken();
    expect(safeEqualHex(hashIngestionToken(token), hash)).toBe(true);
    expect(safeEqualHex(hash, 'deadbeef')).toBe(false);
  });
});
