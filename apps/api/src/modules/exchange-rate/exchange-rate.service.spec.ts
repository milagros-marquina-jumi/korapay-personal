import { ConfigService } from '@nestjs/config';
import { ExchangeRateService } from './exchange-rate.service';

function buildPrisma() {
  return {
    currency: { findUnique: jest.fn() },
    exchangeRate: { findFirst: jest.fn(), upsert: jest.fn(), findMany: jest.fn() },
  };
}

describe('ExchangeRateService', () => {
  it('getRateForDate falls back to previous day, then latest, then default', async () => {
    const prisma = buildPrisma();
    prisma.exchangeRate.findFirst
      .mockResolvedValueOnce(null) // exact
      .mockResolvedValueOnce({ rate: '3.40' }); // previous
    const svc = new ExchangeRateService(prisma as never, new ConfigService());
    expect(await svc.getRateForDate('2026-07-20')).toBe('3.40');
  });

  it('getRateForDate returns default 3.42 when nothing stored', async () => {
    const prisma = buildPrisma();
    prisma.exchangeRate.findFirst.mockResolvedValue(null);
    const svc = new ExchangeRateService(prisma as never, new ConfigService());
    expect(await svc.getRateForDate('2026-07-20')).toBe('3.42');
  });

  it('refreshFromDecolecta parses sell_price and upserts by date', async () => {
    const prisma = buildPrisma();
    prisma.currency.findUnique.mockResolvedValueOnce({ id: 'usd' }).mockResolvedValueOnce({ id: 'pen' });
    prisma.exchangeRate.upsert.mockResolvedValue({ rate: '3.408', date: new Date('2026-07-20') });
    const config = {
      get: jest.fn((k: string, d?: string) =>
        k === 'DECOLECTA_API_KEY' ? 'sk_test' : (d ?? 'https://api.decolecta.com'),
      ),
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        buy_price: '3.402',
        sell_price: '3.408',
        base_currency: 'USD',
        quote_currency: 'PEN',
        date: '2026-07-20',
      }),
    }) as never;

    const svc = new ExchangeRateService(prisma as never, config as never);
    const result = await svc.refreshFromDecolecta();
    expect(result.rate).toBe('3.408');
    expect(prisma.exchangeRate.upsert).toHaveBeenCalled();
  });

  it('refreshFromDecolecta degrades to last saved rate on API failure', async () => {
    const prisma = buildPrisma();
    prisma.exchangeRate.findFirst.mockResolvedValue({ rate: '3.42', date: new Date('2026-07-19') });
    const config = { get: jest.fn(() => 'sk_test') };
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as never;
    const svc = new ExchangeRateService(prisma as never, config as never);
    const result = await svc.refreshFromDecolecta();
    expect(result?.rate).toBe('3.42');
  });
});
