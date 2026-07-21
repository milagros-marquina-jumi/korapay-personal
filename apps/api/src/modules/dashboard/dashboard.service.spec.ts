import { DashboardService } from './dashboard.service';

function buildPrismaMock() {
  return {
    transaction: {
      findMany: jest.fn(),
    },
    account: { findMany: jest.fn().mockResolvedValue([{ id: 'a1', initialBalance: '1000.00' }]) },
    debt: { findMany: jest.fn().mockResolvedValue([]) },
    debtPayment: { findMany: jest.fn().mockResolvedValue([]) },
    pendingItem: { findMany: jest.fn().mockResolvedValue([]) },
    talentIncomeDistribution: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

describe('DashboardService', () => {
  it('aggregates income and expense from transactions', async () => {
    const prisma = buildPrismaMock();
    prisma.transaction.findMany
      .mockResolvedValueOnce([
        { type: 'INCOME', status: 'PAID', amountBase: '5000.00' },
        { type: 'EXPENSE', status: 'PAID', amountBase: '1200.00' },
        { type: 'SAVING', status: 'PAID', amountBase: '800.00' },
      ])
      .mockResolvedValueOnce([
        { type: 'INCOME', amountBase: '5000.00', accountId: 'a1', destAccountId: null },
        { type: 'EXPENSE', amountBase: '1200.00', accountId: 'a1', destAccountId: null },
      ]);

    const service = new DashboardService(prisma as any);
    const summary = await service.getSummary('ws-1');

    expect(summary.ingresos).toBe('5000.00');
    expect(summary.egresos).toBe('1200.00');
    expect(summary.ahorro).toBe('800.00');
    expect(summary.disponible).toBe('4800.00');
  });
});
